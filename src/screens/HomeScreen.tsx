// HomeScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface PrayerTimesAPI {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const states = [
  { name: "Kerala", districts: ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"] },
  { name: "Tamil Nadu", districts: ["Chennai", "Coimbatore", "Madurai"] },
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

const methods = [
  { label: "University of Islamic Sciences, Karachi", value: "1" },
  { label: "Islamic Society of North America (ISNA)", value: "2" },
  { label: "Muslim World League (MWL)", value: "3" },
  { label: "Umm Al-Qura University, Makkah", value: "4" },
  { label: "Egyptian General Authority of Survey", value: "5" },
  { label: "Institute of Geophysics, University of Tehran", value: "7" },
  { label: "Gulf Region", value: "8" },
  { label: "Kuwait", value: "9" },
  { label: "Qatar", value: "10" },
  { label: "Singapore, JAKIM, Malaysia", value: "11" },
  { label: "Union Organization Islamic de France", value: "12" },
  { label: "Diyanet İşleri Başkanlığı, Turkey", value: "13" },
  { label: "Spiritual Administration of Muslims of Russia", value: "14" },
];

export default function HomeScreen({ navigation }: Props) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesAPI | null>(null);
  const [stateName, setStateName] = useState("Kerala");
  const [district, setDistrict] = useState("Thiruvananthapuram");
  const [school, setSchool] = useState<"1" | "2">("2");
  const [method, setMethod] = useState("5");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss A"));
  const [gregorianDate, setGregorianDate] = useState("");
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blink, setBlink] = useState(true);
  const [openState, setOpenState] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);

  const stateItems = states.map(s => ({ label: s.name, value: s.name }));
  const districtItems = states.find(s => s.name === stateName)?.districts.map(d => ({ label: d, value: d })) || [];
  const onOpenState = () => setOpenDistrict(false);
  const onOpenDistrict = () => setOpenState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss A"));
      setBlink(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [savedState, savedDistrict, savedSchool, savedMethod] = await Promise.all([
          AsyncStorage.getItem("state"),
          AsyncStorage.getItem("district"),
          AsyncStorage.getItem("school"),
          AsyncStorage.getItem("method"),
        ]);

        if (savedState) setStateName(savedState);
        if (savedDistrict) setDistrict(savedDistrict);
        if (savedSchool === "1" || savedSchool === "2") setSchool(savedSchool);
        if (savedMethod) setMethod(savedMethod);

        await fetchPrayerTimes(
          savedDistrict || district,
          savedSchool === "1" || savedSchool === "2" ? savedSchool : school,
          savedMethod || method,
          false
        );
      })();
    }, [])
  );

  useEffect(() => {
    const districts = states.find(s => s.name === stateName)?.districts || [];
    if (districts.length > 0) setDistrict(districts[0]);
  }, [stateName]);

  const adjustPrayerTimes = (timings: PrayerTimesAPI) => ({
    ...timings,
    Dhuhr: moment(timings.Dhuhr, "HH:mm").add(3, "minutes").format("HH:mm"),
    Maghrib: moment(timings.Maghrib, "HH:mm").add(3, "minutes").format("HH:mm"),
    Isha: moment(timings.Isha, "HH:mm").add(5, "minutes").format("HH:mm"),
    Asr: moment(timings.Asr, "HH:mm").add(1, "minutes").format("HH:mm"),
  });

  const fetchPrayerTimes = async (districtName: string, schoolType: "1" | "2", methodType: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const coords = districtCoordinates[districtName];
      if (!coords) throw new Error("Coordinates not found");
      const schoolParam = schoolType === "1" ? 1 : 0;
      const cacheKey = `${districtName}_${schoolType}_${methodType}_${moment().format("YYYY-MM-DD")}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const { timings, gregorian, hijri } = JSON.parse(cached);
        setPrayerTimes(adjustPrayerTimes(timings));
        setGregorianDate(gregorian);
        setHijriDate(hijri);
      } else {
        const { data } = await axios.get("https://api.aladhan.com/v1/timings", {
          params: { latitude: coords.lat, longitude: coords.lon, method: methodType, school: schoolParam },
        });

        if (data.code === 200) {
          const adjustedTimings = adjustPrayerTimes(data.data.timings);
          const gregorian = `${data.data.date.gregorian.weekday.en}, ${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`;
          const hijri = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
          setPrayerTimes(adjustedTimings);
          setGregorianDate(gregorian);
          setHijriDate(hijri);
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ timings: adjustedTimings, gregorian, hijri }));
        } else setError("Failed to fetch prayer times");
      }

      await AsyncStorage.multiSet([
        ["state", stateName],
        ["district", districtName],
        ["school", schoolType],
        ["method", methodType],
      ]);
    } catch (err: any) {
      console.error("Axios error:", err.response?.data || err.message);
      setError("Network error. Check your internet connection.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchPrayerTimes(district, school, method); }, [district, school, method]);

  const toggleSchool = async () => {
    const newSchool = school === "2" ? "1" : "2";
    setSchool(newSchool);
    await AsyncStorage.setItem("school", newSchool);
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = moment();
    const times = Object.entries(prayerTimes).map(([name, time]) => ({ name, time: moment(time, "HH:mm") }));
    return times.find(t => t.time.isAfter(now)) || times[0];
  };

  const nextPrayer = getNextPrayer();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        <Text style={styles.currentTime}>{currentTime}</Text>
        <Text style={styles.gregorianDate}>{gregorianDate}</Text>
        <Text style={styles.hijriDate}>{hijriDate}</Text>

        <Text style={styles.title}>Prayer Times ({school === "2" ? "Shafi" : "Hanafi"})</Text>

        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select State</Text>
          <DropDownPicker open={openState} value={stateName} items={stateItems} setOpen={setOpenState} setValue={setStateName} onOpen={onOpenState} listMode="MODAL" modalProps={{ animationType: "slide" }} />
        </View>

        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select District</Text>
          <DropDownPicker open={openDistrict} value={district} items={districtItems} setOpen={setOpenDistrict} setValue={setDistrict} onOpen={onOpenDistrict} listMode="MODAL" modalProps={{ animationType: "slide" }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1e40af" style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={styles.loading}>{error}</Text>
        ) : (
          prayerTimes &&
          Object.entries(prayerTimes).map(([name, time]) => {
            const isNext = nextPrayer?.name === name;
            return (
              <View key={name} style={[styles.card, isNext ? styles.nextPrayerCard : {}]}>
                <Text style={styles.prayerName}>{name === "Asr" && school === "1" ? "Asr (Hanafi)" : name}</Text>
                <Text style={[styles.prayerTime, isNext ? styles.prayerTimeBlink : {}]}>{moment(time, "HH:mm").format("h:mm A")}</Text>
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.buttonCard} onPress={toggleSchool} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Switch to {school === "2" ? "Hanafi" : "Shafi"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={customStyles.settingsButton} onPress={() => navigation.navigate("Settings")} activeOpacity={0.8}>
          <Text style={customStyles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonCard, { marginTop: 20 }]} onPress={() => Linking.openURL("tel:+91974552510")} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Call Support: +91 97455 2510</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f6fc" }, // soft gradient-like background
  scrollContainer: { padding: 16, paddingBottom: 40 },

  // Clock & Dates
  currentTime: { fontSize: 38, fontWeight: "700", textAlign: "center", marginVertical: 12, color: "#1e293b" },
  gregorianDate: { fontSize: 16, textAlign: "center", color: "#64748b" },
  hijriDate: { fontSize: 16, textAlign: "center", color: "#64748b", marginBottom: 20 },

  // Titles
  title: { fontSize: 22, fontWeight: "700", marginVertical: 12, textAlign: "center", color: "#1e293b" },

  // Dropdowns
  dropdownWrapper: { marginVertical: 12, zIndex: 1000 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#444" },

  // Prayer Cards
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  nextPrayerCard: {
    backgroundColor: "#fffbeb",
    borderColor: "#facc15",
    borderWidth: 1,
  },
  prayerName: { fontSize: 18, fontWeight: "600", color: "#1e293b" },
  prayerTime: { fontSize: 18, fontWeight: "700", color: "#1e40af" },
  prayerTimeBlink: { opacity: 1, color: "#b45309" }, // amber blinking effect handled in useEffect

  // Buttons
  buttonCard: {
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 18,
    marginVertical: 12,
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Loading & Error
  loading: { textAlign: "center", color: "red", marginTop: 20, fontWeight: "600", fontSize: 15 },
});

const customStyles = StyleSheet.create({
  settingsButton: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 18,
    marginVertical: 12,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  settingsButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
