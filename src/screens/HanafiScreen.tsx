import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import moment from "moment";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "Hanafi">;

interface PrayerTimesAPI {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const keralaDistricts = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

const districtCoordinates: Record<string, { lat: number; lon: number }> = {
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
  Kollam: { lat: 8.8932, lon: 76.6141 },
  Pathanamthitta: { lat: 9.2648, lon: 76.7870 },
  Alappuzha: { lat: 9.4981, lon: 76.3388 },
  Kottayam: { lat: 9.5916, lon: 76.5222 },
  Idukki: { lat: 9.85, lon: 76.97 },
  Ernakulam: { lat: 9.9816, lon: 76.2999 },
  Thrissur: { lat: 10.5276, lon: 76.2144 },
  Palakkad: { lat: 10.7867, lon: 76.6548 },
  Malappuram: { lat: 11.0730, lon: 76.0743 },
  Kozhikode: { lat: 11.2588, lon: 75.7804 },
  Wayanad: { lat: 11.6854, lon: 76.1310 },
  Kannur: { lat: 11.8745, lon: 75.3704 },
  Kasaragod: { lat: 12.4996, lon: 74.9869 },
};

export default function HanafiScreen({ navigation }: Props) {
  const [district, setDistrict] = useState<string>("Thiruvananthapuram");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const method = "1"; // MWL
  const school = "1"; // Hanafi

  useEffect(() => {
    const init = async () => {
      try {
        const savedDistrict = await AsyncStorage.getItem("district");
        if (savedDistrict) setDistrict(savedDistrict);

        await fetchPrayerTimes(savedDistrict || district);
      } catch (err) {
        console.warn("Error loading district:", err);
      }
    };

    init();
  }, []);

  const fetchPrayerTimes = async (selectedDistrict: string) => {
    setLoading(true);
    setError("");
    try {
      const { lat, lon } = districtCoordinates[selectedDistrict];
      const { data } = await axios.get("https://api.aladhan.com/v1/timings", {
        params: { latitude: lat, longitude: lon, method, school },
      });

      if (data.code === 200) {
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = data.data.timings;
        setPrayerTimes({ Fajr, Dhuhr, Asr, Maghrib, Isha });
        await AsyncStorage.setItem("district", selectedDistrict);
      } else {
        setError("Failed to fetch prayer times.");
      }
    } catch (err) {
      console.error("Error fetching prayer times:", err);
      setError("Error fetching prayer times.");
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    fetchPrayerTimes(value);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Prayer Times (Hanafi)</Text>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select District:</Text>
          <Picker
            selectedValue={district}
            onValueChange={handleDistrictChange}
            style={styles.picker}
          >
            {keralaDistricts.map((d) => (
              <Picker.Item key={d} label={d} value={d} />
            ))}
          </Picker>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <Text style={styles.loading}>{error}</Text>
        ) : prayerTimes ? (
          <>
            {Object.entries(prayerTimes).map(([name, time]) => (
              <View key={name} style={styles.card}>
                <Text style={styles.prayerName}>
                  {name === "Asr" ? "Asr (Hanafi)" : name}
                </Text>
                <Text style={styles.prayerTime}>
                  {moment(time, "HH:mm").format("h:mm A")}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.buttonCard, { backgroundColor: "#007AFF" }]}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.buttonText}>Switch to Shafi</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#333",
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  loading: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 30,
    color: "#888",
  },
  buttonCard: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
