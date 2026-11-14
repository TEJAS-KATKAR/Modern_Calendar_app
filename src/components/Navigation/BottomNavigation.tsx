import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const tabs = [
    { name: "Calendar", icon: "calendar-outline", href: "/" },
    { name: "Upcoming", icon: "list-outline", href: "/upcoming" },
    { name: "Settings", icon: "settings-outline", href: "/settings" },
] as const;

export default function BottomNavigation() {
    const pathname = usePathname();
    const active =
        pathname === "/settings"
            ? "Settings"
            : pathname === "/upcoming"
              ? "Upcoming"
              : "Calendar";
    return (
        <View className="mx-5 flex-row items-center justify-around rounded-[30px] bg-white px-4 py-2 pb-16 shadow-lg">

            {tabs.map((tab) => {
                const selected = active === tab.name;

                return (
                    <Pressable
                        key={tab.name}
                        onPress={() => router.navigate(tab.href)}
                        className={`min-w-[90px] items-center justify-center rounded-2xl px-4 py-2 ${
                            selected ? "bg-red-100" : ""
                        }`}
                    >
                        <Ionicons
                            name={tab.icon as keyof typeof Ionicons.glyphMap}
                            size={25}
                            color={selected ? "#D72F32" : "#333A59"}
                        />

                        <Text
                            className={`mt-1 text-xs font-semibold ${
                                selected
                                    ? "text-red-700"
                                    : "text-slate-700"
                            }`}
                        >
                            {tab.name}
                        </Text>
                    </Pressable>
                );
            })}

        </View>
    );
}
