import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    title: string;
    subtitle: string;
    category: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export default function EventCard({
    title,
    subtitle,
    category,
    color,
    icon,
}: Props) {
    return (
        <Pressable
            className="mb-3 flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: color }}
        >
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-white/70">
                <Ionicons name={icon} size={23} color="#E85B78" />
            </View>

            <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">
                    {title}
                </Text>

                <Text className="mt-1 text-xs text-slate-600">
                    {subtitle}
                </Text>
            </View>

            <View className="rounded-full bg-white/70 px-3 py-2">
                <Text className="text-xs font-semibold text-slate-700">
                    {category}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={20}
                color="#27304B"
                style={{ marginLeft: 8 }}
            />
        </Pressable>
    );
}