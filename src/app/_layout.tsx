import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import BottomNavigation from "../components/Navigation/BottomNavigation";
import { EventPreferencesProvider } from "../context/EventPreferencesContext";

import "../../global.css";

function AppNavigator() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const screenBackground =
        pathname === "/settings" ? "#F8F8FC" : "#FFF8F7";

    return (
        <View style={{ flex: 1, backgroundColor: screenBackground }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                }}
            />
            <View
                pointerEvents="box-none"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -46,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 10),
                }}
            >
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
