import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CalendarHeader from "../components/Calendar/CalendarHeader";
import CalendarView from "../components/Calendar/CalendarView";
import SelectedDateSheet from "../components/Calendar/SelectedDateSheet";
import type { Reminder } from "../types/reminder";
import { loadReminders, saveReminders } from "../storage/reminders";
import { calendarEvents } from "../events/calendarEvents";
import { useEventPreferences } from "../context/EventPreferencesContext";

const today = new Date();

const shortcuts = [
    { title: "Holidays", icon: "flag-outline", color: "#FFE7E7" },
    { title: "Events", icon: "calendar-outline", color: "#E2F0FF" },
    { title: "Reminders", icon: "notifications-outline", color: "#FFF0D5" },
];

export default function CalendarScreen() {

    const insets = useSafeAreaInsets();
    const { preferences: eventPreferences } = useEventPreferences();

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(today.getDate());

    const [showSheet, setShowSheet] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const remindersRef = useRef<Reminder[]>([]);
    const [remindersReady, setRemindersReady] = useState(false);

    const visibleEvents = useMemo(
        () =>
            calendarEvents.filter(
                (event) => eventPreferences[event.preferenceKey]
            ),
        [eventPreferences]
    );

    useEffect(() => {
        let isMounted = true;

        loadReminders()
            .then((savedReminders) => {
                if (!isMounted) return;
                remindersRef.current = savedReminders;
                setReminders(savedReminders);
            })
            .catch((error) => {
                console.error("Failed to load reminders", error);
            })
            .finally(() => {
                if (isMounted) setRemindersReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCreateReminder = async (reminder: Reminder) => {
        const updatedReminders = [...remindersRef.current, reminder];
        remindersRef.current = updatedReminders;
        setReminders(updatedReminders);
        await saveReminders(updatedReminders);
    };

    const monthName = new Date(year, month).toLocaleString("en-US", {
        month: "long",
    });

    const changeMonth = (value: number) => {
        const date = new Date(year, month + value, 1);

        setYear(date.getFullYear());
        setMonth(date.getMonth());
        setSelectedDate(1);
        setShowSheet(false);
    };

    const goToToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
        setSelectedDate(today.getDate());
        setShowSheet(false);
    };

    return (
        <View className="flex-1 bg-[#FFF8F7]">

            <StatusBar
                style="light"
            />

            <View className="flex-1">

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >

                <CalendarHeader
                    month={monthName}
                    year={year}
                    monthIndex={month}
                    topInset={insets.top}
                    onPrevious={() => changeMonth(-1)}
                    onNext={() => changeMonth(1)}
                    onToday={goToToday}
                />

                    {/* Calendar */}
                    <View className="mt-3">
                        <CalendarView
                            year={year}
                            month={month}
                            selectedDate={selectedDate}
                            today={today}
                            eventDates={visibleEvents.map((event) => event.date)}
                            reminderDates={reminders.map((reminder) => reminder.dateKey)}
                            importantReminderDates={reminders
                                .filter((reminder) => reminder.category.name === "Important")
                                .map((reminder) => reminder.dateKey)}
                            onSelectDate={(date) => {
                                setSelectedDate(date);
                                setShowSheet(true);
                            }}
                        />
                    </View>

                    {/* Monthly Summary */}
                    <Pressable
                        className="mx-5 mt-6 flex-row items-center rounded-[30px] bg-white p-5 shadow-sm active:bg-red-50"
                    >
                        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-red-100">
                            <Ionicons
                                name="calendar"
                                size={30}
                                color="#D83232"
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-900">
                                {monthName} {year}
                            </Text>

                            <Text className="mt-1 text-sm text-slate-600">
                                {new Date(year, month + 1, 0).getDate()} Days
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={22}
                            color="#18213D"
                        />
                    </Pressable>

                    {/* Shortcuts */}
                    <View className="mx-5 mt-5 flex-row gap-3">
                        {shortcuts.map((item) => (
                            <Pressable
                                key={item.title}
                                className="flex-1 items-center justify-center rounded-3xl py-5 active:opacity-70"
                                style={{ backgroundColor: item.color }}
                            >
                                <Ionicons
                                    name={item.icon as keyof typeof Ionicons.glyphMap}
                                    size={28}
                                    color="#5141C8"
                                />

                                <Text className="mt-2 text-xs font-bold text-slate-800">
                                    {item.title}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                </ScrollView>

                {/* Selected Date Sheet */}
                <SelectedDateSheet
                    visible={showSheet}
                    date={new Date(year, month, selectedDate)}
                    events={visibleEvents}
                    reminders={reminders}
                    remindersReady={remindersReady}
                    onClose={() => setShowSheet(false)}
                    onCreateReminder={handleCreateReminder}
                />

            </View>
        </View>
    );
}
