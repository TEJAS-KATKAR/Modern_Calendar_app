import { View, Text, Pressable, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    month: string;
    year: number;
    monthIndex: number;
    topInset: number;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

// Seasonal header images
const seasonalImages = {
    winter: require("../../../assets/images/winter.webp"),
    spring: require("../../../assets/images/spring.webp"),
    summer: require("../../../assets/images/summer.webp"),
    autumn: require("../../../assets/images/autumn.webp"),
};

const getSeasonalImage = (month: number) => {
    if (month === 11 || month <= 1) return seasonalImages.winter;
    if (month >= 2 && month <= 4) return seasonalImages.spring;
    if (month >= 5 && month <= 7) return seasonalImages.summer;

    return seasonalImages.autumn;
};

export default function CalendarHeader({
    month,
    year,
    monthIndex,
    topInset,
    onPrevious,
    onNext,
    onToday,
}: Props) {
    const headerImage = getSeasonalImage(monthIndex);

    return (
        <ImageBackground
            source={headerImage}
            resizeMode="cover"
        >
            {/* Dark overlay for readable text */}
            <LinearGradient
                colors={[
                    "rgba(12,15,35,0.55)",
                    "rgba(15,20,45,0.25)",
                    "rgba(15,20,45,0.65)",
                ]}
            >
                {/* Main Header */}
                <View
                    className="px-5 pb-4"
                    style={{ paddingTop: topInset + 10 }}
                >
                    <View className="flex-row items-center justify-between">

                        <View className="flex-row items-center gap-3">
                            <Pressable className="h-12 w-10 items-center justify-center">
                                <Ionicons name="menu" size={32} color="white" />
                            </Pressable>

                            <View>
                                <Text className="text-xl font-bold text-white">
                                    US Calendar {year}
                                </Text>

                                <Text className="text-sm text-gray-200">
                                    Holidays • Events
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-2">

                            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-white/15">
                                <Ionicons name="search" size={25} color="white" />
                            </Pressable>

                            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-white/15">
                                <Ionicons name="notifications-outline" size={25} color="white" />
                            </Pressable>

                            <View className="h-11 w-11 items-center justify-center rounded-full bg-violet-600">
                                <Text className="font-bold text-white">US</Text>
                            </View>

                        </View>
                    </View>
                </View>

                {/* Month Navigation */}
                <View
                    className="flex-row items-center justify-between px-4 py-3"
                    style={{
                        backgroundColor: "rgba(12,15,35,0.45)",
                    }}
                >
                    <Pressable
                        onPress={onPrevious}
                        className="h-12 w-12 items-center justify-center rounded-full bg-white/15 active:bg-white/30"
                    >
                        <Ionicons name="chevron-back" size={27} color="white" />
                    </Pressable>

                    <View className="flex-1 flex-row items-center justify-center gap-2">
                        <Text className="text-xl font-bold text-white">
                            {month} {year}
                        </Text>

                        <Ionicons name="chevron-down" size={18} color="white" />
                    </View>

                    <Pressable
                        onPress={onNext}
                        className="h-12 w-12 items-center justify-center rounded-full bg-white/15 active:bg-white/30"
                    >
                        <Ionicons name="chevron-forward" size={27} color="white" />
                    </Pressable>

                    <Pressable
                        onPress={onToday}
                        className="ml-2 rounded-full bg-[#F46B63] px-5 py-3 active:bg-red-700"
                    >
                        <Text className="font-bold text-white">
                            Today
                        </Text>
                    </Pressable>
                </View>

            </LinearGradient>
        </ImageBackground>
    );
}