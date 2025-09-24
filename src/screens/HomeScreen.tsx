// HomeScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles as styles } from "../style/homestyle";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface PrayerTimesAPI {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const states = [
  {
    name: "Kerala",
    districts: [
      "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki",
      "Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"
    ]
  },
  { name: "Tamil Nadu", districts: ["Chennai","Coimbatore","Madurai"] },
];

const districtCoordinates: Record<string, { lat: number; lon: number }> = {
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
  Kollam: { lat: 8.8932, lon: 76.6141 },
  Pathanamthitta: { lat: 9.2648, lon: 76.787 },
  Alappuzha: { lat: 9.4981, lon: 76.3388 },
  Kottayam: { lat: 9.5916, lon: 76.5222 },
  Idukki: { lat: 9.849, lon: 76.968 },
  Ernakulam: { lat: 9.9816, lon: 76.2999 },
  Thrissur: { lat: 10.5276, lon: 76.2144 },
  Palakkad: { lat: 10.7867, lon: 76.6548 },
  Malappuram: { lat: 11.073, lon: 76.074 },
  Kozhikode: { lat: 11.2588, lon: 75.7804 },
  Wayanad: { lat: 11.6854, lon: 76.132 },
  Kannur: { lat: 11.8745, lon: 75.3704 },
  Kasaragod: { lat: 12.4984, lon: 74.9896 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Coimbatore: { lat: 11.0168, lon: 76.9558 },
  Madurai: { lat: 9.9252, lon: 78.1198 },
};

export default function HomeScreen({ navigation }: Props) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesAPI | null>(null);
  const [stateName, setStateName] = useState("Kerala");
  const [district, setDistrict] = useState("Thiruvananthapuram");
  const [school, setSchool] = useState<"1" | "2">("2");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss A"));
  const [gregorianDate, setGregorianDate] = useState("");
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openState, setOpenState] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);

  const stateItems = states.map(s => ({ label: s.name, value: s.name }));
  const districtItems = states.find(s => s.name === stateName)?.districts.map(d => ({ label: d, value: d })) || [];

  const onOpenState = () => setOpenDistrict(false);
  const onOpenDistrict = () => setOpenState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment().format("h:mm:ss A")), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved state/district/school & cached prayer times on screen focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [savedState, savedDistrict, savedSchool] = await Promise.all([
          AsyncStorage.getItem("state"),
          AsyncStorage.getItem("district"),
          AsyncStorage.getItem("school"),
        ]);

        if(savedState) setStateName(savedState);
        if(savedDistrict) setDistrict(savedDistrict);
        if(savedSchool === "1" || savedSchool === "2") setSchool(savedSchool);

        await fetchPrayerTimes(savedDistrict || district, savedSchool === "1" || savedSchool === "2" ? savedSchool : school, false);
      })();
    }, [])
  );

  // Update district automatically when state changes
  useEffect(() => {
    const districts = states.find(s => s.name === stateName)?.districts || [];
    if(districts.length > 0) setDistrict(districts[0]);
  }, [stateName]);

  // Fetch prayer times function (with caching)
  const fetchPrayerTimes = async (districtName: string, schoolType: "1"|"2", showLoading = true) => {
    if(showLoading) setLoading(true);
    setError("");

    try {
      const coords = districtCoordinates[districtName];
      if(!coords) throw new Error("Coordinates not found");

      const cacheKey = `${districtName}_${schoolType}_${moment().format("YYYY-MM-DD")}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if(cached){
        const { timings, gregorian, hijri } = JSON.parse(cached);
        setPrayerTimes(timings);
        setGregorianDate(gregorian);
        setHijriDate(hijri);
      } else {
        const { data } = await axios.get("https://api.aladhan.com/v1/timings", {
          params: { latitude: coords.lat, longitude: coords.lon, method: 2, school: schoolType }
        });

        if(data.code === 200){
          const { Fajr,Dhuhr,Asr,Maghrib,Isha } = data.data.timings;
          const timings = { Fajr,Dhuhr,Asr,Maghrib,Isha };
          const gregorian = `${data.data.date.gregorian.weekday.en}, ${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`;
          const hijri = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;

          setPrayerTimes(timings);
          setGregorianDate(gregorian);
          setHijriDate(hijri);

          await AsyncStorage.setItem(cacheKey, JSON.stringify({ timings, gregorian, hijri }));
        } else setError("Failed to fetch prayer times");
      }

      // Save preferences once per fetch
      await AsyncStorage.multiSet([
        ["state", stateName],
        ["district", districtName],
        ["school", schoolType],
      ]);

    } catch(err) {
      console.error(err);
      setError("Network error. Check your internet connection.");
    } finally { if(showLoading) setLoading(false); }
  };

  // Fetch prayer times whenever district or school changes
  useEffect(() => {
    fetchPrayerTimes(district, school);
  }, [district, school]);

  const toggleSchool = async () => {
    const newSchool = school === "2" ? "1" : "2";
    setSchool(newSchool);
    await AsyncStorage.setItem("school", newSchool);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top","bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.currentTime}>{currentTime}</Text>
        <Text style={styles.gregorianDate}>{gregorianDate}</Text>
        <Text style={styles.hijriDate}>{hijriDate}</Text>

        <Text style={styles.title}>Prayer Times ({school==="2"?"Shafi":"Hanafi"})</Text>

        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select State</Text>
          <DropDownPicker
            open={openState}
            value={stateName}
            items={stateItems}
            setOpen={setOpenState}
            setValue={setStateName}
            onOpen={onOpenState}
            listMode="MODAL"
            modalProps={{ animationType:"slide" }}
          />
        </View>

        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select District</Text>
          <DropDownPicker
            open={openDistrict}
            value={district}
            items={districtItems}
            setOpen={setOpenDistrict}
            setValue={setDistrict}
            onOpen={onOpenDistrict}
            listMode="MODAL"
            modalProps={{ animationType:"slide" }}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={styles.loading}>{error}</Text>
        ) : (
          prayerTimes && Object.entries(prayerTimes).map(([name, time]) => (
            <View key={name} style={styles.card}>
              <Text style={styles.prayerName}>{name === "Asr" && school === "1" ? "Asr (Hanafi)" : name}</Text>
              <Text style={styles.prayerTime}>{moment(time, "HH:mm").format("h:mm A")}</Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.buttonCard} onPress={toggleSchool} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Switch to {school==="2"?"Hanafi":"Shafi"}</Text>
        </TouchableOpacity>

        {/* Support Phone Number */}
        <TouchableOpacity 
          style={[styles.buttonCard, { marginTop: 20 }]} 
          onPress={() => Linking.openURL("tel:+91974552510")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Call Support: +91 97455 2510</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
