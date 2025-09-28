// SettingsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const methods = [
  { label: "Karachi (Pakistan, India)", value: "2" },
  { label: "Muslim World League (MWL)", value: "3" },
  { label: "Egyptian General Authority", value: "5" },
];

export default function SettingsScreen() {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("3"); // default MWL
  const [items, setItems] = useState(methods);

  useEffect(() => {
    (async () => {
      const savedMethod = await AsyncStorage.getItem("method");
      if(savedMethod) setMethod(savedMethod);
    })();
  }, []);

  useEffect(() => {
    if(method) AsyncStorage.setItem("method", method);
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
          modalProps={{ animationType:"slide" }}
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
