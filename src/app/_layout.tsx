import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import BottomNavigation from "../components/Navigation/BottomNavigation";
import { EventPreferencesProvider } from "../context/EventPreferencesContext";

import "../../global.css";

function AppNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                }}
            />
            <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
                <BottomNavigation />
            </View>
        </View>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <EventPreferencesProvider>
                    <AppNavigator />
                </EventPreferencesProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
