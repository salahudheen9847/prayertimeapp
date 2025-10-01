// SettingsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// Full list of AlAdhan calculation methods
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

export default function SettingsScreen() {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("3"); // default MWL
  const [items, setItems] = useState(methods);

  // Load saved method
  useEffect(() => {
    (async () => {
      const savedMethod = await AsyncStorage.getItem("method");
      if (savedMethod) setMethod(savedMethod);
    })();
  }, []);

  // Save method whenever it changes
  useEffect(() => {
    if (method) AsyncStorage.setItem("method", method);
  }, [method]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.dropdownWrapper}>
        <Text style={styles.label}>Select Calculation Method</Text>
        <DropDownPicker
          open={open}
          value={method}
          items={items}
          setOpen={setOpen}
          setValue={setMethod}
          setItems={setItems}
          listMode="MODAL"
          modalProps={{ animationType: "slide" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  dropdownWrapper: { marginBottom: 20 },
  label: { marginBottom: 10, fontSize: 16, fontWeight: "600" },
});
