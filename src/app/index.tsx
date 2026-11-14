import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { EVENT_CATEGORY_COLORS } from "../events/calendarEvents";
import { useEventPreferences } from "../context/EventPreferencesContext";

const today = new Date();

type CalendarAgendaItem = {
    id: string;
    date: Date;
    title: string;
    subtitle: string;
    color: string;
    backgroundColor: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const monthIndexes: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
};

function parseReminderDateKey(dateKey: string): Date | null {
    const [, monthName, day, year] = dateKey.split(" ");
    const monthIndex = monthIndexes[monthName];
    if (monthIndex === undefined) return null;

    const date = new Date(Number(year), monthIndex, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
}

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

    const upcomingItems = useMemo(() => {
        const start = new Date(year, month, selectedDate).getTime();
        const end = new Date(year, month + 1, 1).getTime();
        const items: CalendarAgendaItem[] = [];

        for (const event of visibleEvents) {
            const [eventYear, eventMonth, eventDay] = event.date
                .split("-")
                .map(Number);
            const date = new Date(eventYear, eventMonth - 1, eventDay);
            if (date.getTime() < start || date.getTime() >= end) continue;

            items.push({
                id: `event-${event.id}`,
                date,
                title: event.name,
                subtitle: event.timeUtc
                    ? `${event.category} · ${event.timeUtc} UTC`
                    : event.category,
                color: EVENT_CATEGORY_COLORS[event.category].accent,
                backgroundColor: EVENT_CATEGORY_COLORS[event.category].background,
                icon: "calendar-outline",
            });
        }

        for (const reminder of reminders) {
            const date = parseReminderDateKey(reminder.dateKey);
            if (!date || date.getTime() < start || date.getTime() >= end) continue;

            items.push({
                id: `reminder-${reminder.id}`,
                date,
                title: reminder.title,
                subtitle: `${reminder.category.name} · ${reminder.startTime.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                })}`,
                color: reminder.category.textColor,
                backgroundColor: reminder.category.color,
                icon: "notifications-outline",
            });
        }

        return items
            .sort(
                (first, second) =>
                    first.date.getTime() - second.date.getTime() ||
                    first.title.localeCompare(second.title)
            )
            .slice(0, 4);
    }, [month, reminders, selectedDate, visibleEvents, year]);

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
        await handleSaveReminders(updatedReminders);
    };

    const handleSaveReminders = async (updatedReminders: Reminder[]) => {
        remindersRef.current = updatedReminders;
        setReminders(updatedReminders);
        try {
            await saveReminders(updatedReminders);
        } catch (error) {
            console.error("Failed to save reminders", error);
            const saved = await loadReminders();
            remindersRef.current = saved;
            setReminders(saved);
            throw error;
        }
    };

    const handleSelectDate = useCallback((date: number) => {
        setSelectedDate(date);
        setShowSheet(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setShowSheet(false);
    }, []);

    const reminderDates = useMemo(
        () => reminders.map((reminder) => reminder.dateKey),
        [reminders]
    );
    const importantReminderDates = useMemo(
        () =>
            reminders
                .filter((reminder) => reminder.category.name === "Important")
                .map((reminder) => reminder.dateKey),
        [reminders]
    );

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
                    contentContainerStyle={{
                        paddingBottom: Math.max(insets.bottom, 10) + 96,
                    }}
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
                            events={visibleEvents}
                            reminderDates={reminderDates}
                            importantReminderDates={importantReminderDates}
                            onSelectDate={handleSelectDate}
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

                    {/* Upcoming agenda */}
                    <View className="mx-5 mt-6">
                        <View className="mb-3 flex-row items-center justify-between">
                            <View>
                                <Text className="text-lg font-bold text-slate-900">
                                    Coming up
                                </Text>
                                <Text className="mt-1 text-xs text-slate-500">
                                    From {new Date(year, month, selectedDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </Text>
                            </View>
                            {upcomingItems.length > 0 && (
                                <Text className="text-xs font-semibold text-slate-500">
                                    NEXT {upcomingItems.length}
                                </Text>
                            )}
                        </View>

                        {upcomingItems.length === 0 ? (
                            <View className="rounded-2xl border border-[#EEE5E5] bg-white px-4 py-5">
                                <Text className="text-sm font-semibold text-slate-700">
                                    Nothing else scheduled this month
                                </Text>
                                <Text className="mt-1 text-xs leading-5 text-slate-500">
                                    Events and reminders from this date will appear here.
                                </Text>
                            </View>
                        ) : (
                            <View className="gap-2">
                                {upcomingItems.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => {
                                            handleSelectDate(item.date.getDate());
                                        }}
                                        className="flex-row items-center rounded-2xl border border-[#EEE5E5] bg-white px-3 py-3 active:bg-red-50"
                                    >
                                        <View className="mr-3 min-w-[52px] items-center rounded-xl bg-[#FFF4F2] px-2 py-2">
                                            <Text className="text-[10px] font-bold uppercase text-[#D85B55]">
                                                {item.date.toLocaleDateString("en-US", { month: "short" })}
                                            </Text>
                                            <Text className="mt-0.5 text-lg font-bold leading-5 text-[#303449]">
                                                {item.date.getDate()}
                                            </Text>
                                        </View>

                                        <View
                                            className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                                            style={{ backgroundColor: item.backgroundColor }}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={18}
                                                color={item.color}
                                            />
                                        </View>

                                        <View className="flex-1">
                                            <Text
                                                numberOfLines={1}
                                                className="text-sm font-semibold text-slate-900"
                                            >
                                                {item.title}
                                            </Text>
                                            <Text className="mt-1 text-[11px] capitalize text-slate-500">
                                                {item.subtitle}
                                            </Text>
                                        </View>

                                        <Ionicons
                                            name="chevron-forward"
                                            size={17}
                                            color="#A0A3B2"
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                </ScrollView>

                {/* Selected Date Sheet */}
                <SelectedDateSheet
                    visible={showSheet}
                    date={new Date(year, month, selectedDate)}
                    events={visibleEvents}
                    reminders={reminders}
                    remindersReady={remindersReady}
                    onClose={handleCloseSheet}
                    onCreateReminder={handleCreateReminder}
                    onSaveReminders={handleSaveReminders}
                />

            </View>
        </View>
    );
}
