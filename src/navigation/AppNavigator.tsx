import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import HomeScreen from "../screens/HomeScreen";
import HanafiScreen from "../screens/HanafiScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Define navigation types
export type RootStackParamList = {
  Home: undefined;
  Hanafi: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Prayer Times (Shafi)" }}
        />
        <Stack.Screen
          name="Hanafi"
          component={HanafiScreen}
          options={{ title: "Prayer Times (Hanafi)" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
