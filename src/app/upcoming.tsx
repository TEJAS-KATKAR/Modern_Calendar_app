import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    SectionList,
    Text,
    TextInput,
    View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Reminder } from "../types/reminder";
import { loadReminders, saveReminders } from "../storage/reminders";
import {
    calendarEvents,
    EVENT_CATEGORY_COLORS,
    type CalendarEvent,
} from "../events/calendarEvents";
import { useEventPreferences } from "../context/EventPreferencesContext";

type ReminderItem = Reminder & { completed?: boolean };

type AgendaItem =
    | {
          type: "event";
          id: string;
          dateKey: string;
          event: CalendarEvent;
      }
    | {
          type: "reminder";
          id: string;
          dateKey: string;
          reminder: ReminderItem;
      }
    | {
          type: "empty";
          id: string;
          dateKey: string;
      };

type AgendaSection = {
    dateKey: string;
    data: AgendaItem[];
};

function getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseReminderDate(dateKey: string): Date | null {
    const parts = dateKey.split(" ");

    if (parts.length !== 4) return null;

    const monthNames: Record<string, number> = {
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

    const month = monthNames[parts[1]];
    const day = Number(parts[2]);
    const year = Number(parts[3]);

    if (month === undefined || !day || !year) return null;

    return new Date(year, month, day);
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDateHeading(dateKey: string): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const tomorrow = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
    );

    if (dateKey === getDateKey(today)) return "Today";
    if (dateKey === getDateKey(tomorrow)) return "Tomorrow";

    return date.toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function UpcomingScreen() {
    const insets = useSafeAreaInsets();
    const { preferences } = useEventPreferences();

    const [reminders, setReminders] = useState<ReminderItem[]>([]);
    const [remindersReady, setRemindersReady] = useState(false);
    const [showPreviousDays, setShowPreviousDays] = useState(false);
    const [listVisit, setListVisit] = useState(0);

    const [showOptions, setShowOptions] = useState(false);
    const [showEvents, setShowEvents] = useState(true);
    const [showReminders, setShowReminders] = useState(true);
    const [priorityFirst, setPriorityFirst] = useState(false);

    const [activeReminderId, setActiveReminderId] = useState<string | null>(
        null
    );

    const [editing, setEditing] = useState<ReminderItem | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [timePicker, setTimePicker] = useState<"start" | "end" | null>(
        null
    );

    // Load reminders whenever this screen becomes active.
    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            setShowPreviousDays(false);
            setListVisit((visit) => visit + 1);
            setRemindersReady(false);

            loadReminders()
                .then((saved) => {
                    if (mounted) {
                        setReminders(saved as ReminderItem[]);
                    }
                })
                .catch((error) => {
                    console.error("Failed to load reminders:", error);
                })
                .finally(() => {
                    if (mounted) {
                        setRemindersReady(true);
                    }
                });

            return () => {
                mounted = false;
            };
        }, [])
    );

    // Save updated reminders.
    const persistReminders = async (updated: ReminderItem[]) => {
        setReminders(updated);

        try {
            await saveReminders(updated);
        } catch (error) {
            console.error("Failed to save reminders:", error);

            Alert.alert(
                "Couldn't save changes",
                "Please try again."
            );

            const saved = await loadReminders();
            setReminders(saved as ReminderItem[]);
        }
    };

    // Build and group upcoming events and reminders.
    const groupedItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 10);

        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);

        const startDateKey = getDateKey(startDate);
        const endDateKey = getDateKey(endDate);
        const items: AgendaItem[] = [];

        if (showEvents) {
            calendarEvents.forEach((event) => {
                if (
                    preferences[event.preferenceKey] &&
                    event.date >= startDateKey &&
                    event.date <= endDateKey
                ) {
                    items.push({
                        type: "event",
                        id: `event-${event.id}`,
                        dateKey: event.date,
                        event,
                    });
                }
            });
        }

        if (showReminders) {
            reminders.forEach((reminder) => {
                const date = parseReminderDate(reminder.dateKey);
                if (!date) return;

                const dateKey = getDateKey(date);

                if (dateKey >= startDateKey && dateKey <= endDateKey) {
                    items.push({
                        type: "reminder",
                        id: `reminder-${reminder.id}`,
                        dateKey,
                        reminder,
                    });
                }
            });
        }

        items.sort((a, b) => {
            if (a.dateKey !== b.dateKey) {
                return a.dateKey.localeCompare(b.dateKey);
            }

            if (priorityFirst) {
                const aImportant =
                    a.type === "reminder" &&
                    a.reminder.category.name === "Important";

                const bImportant =
                    b.type === "reminder" &&
                    b.reminder.category.name === "Important";

                if (aImportant !== bImportant) {
                    return aImportant ? -1 : 1;
                }
            }

            if (a.type === "event" && b.type === "reminder") return -1;
            if (a.type === "reminder" && b.type === "event") return 1;

            if (a.type === "reminder" && b.type === "reminder") {
                return (
                    a.reminder.startTime.getTime() -
                    b.reminder.startTime.getTime()
                );
            }

            if (a.type === "event" && b.type === "event") {
                return a.event.name.localeCompare(b.event.name);
            }

            return 0;
        });

        const grouped = new Map<string, AgendaItem[]>();

        items.forEach((item) => {
            const current = grouped.get(item.dateKey) ?? [];
            grouped.set(item.dateKey, [...current, item]);
        });

        const todayKey = getDateKey(today);
        if (!grouped.has(todayKey)) {
            grouped.set(todayKey, [
                {
                    type: "empty",
                    id: `empty-${todayKey}`,
                    dateKey: todayKey,
                },
            ]);
        }

        const sortedSections = Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, data]) => ({ dateKey, data }));

        const todaySection = sortedSections.find(
            (section) => section.dateKey === todayKey
        );
        const previousSections = sortedSections
            .filter((section) => section.dateKey < todayKey)
            .reverse();
        const futureSections = sortedSections.filter(
            (section) => section.dateKey > todayKey
        );

        return [
            ...(todaySection ? [todaySection] : []),
            ...(showPreviousDays ? previousSections : []),
            ...futureSections,
        ];
    }, [
        reminders,
        preferences,
        showEvents,
        showReminders,
        priorityFirst,
        showPreviousDays,
    ]);

    // Delete reminder.
    const deleteReminder = (reminder: ReminderItem) => {
        Alert.alert(
            "Delete reminder?",
            `Are you sure you want to delete "${reminder.title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const updated = reminders.filter(
                            (item) => item.id !== reminder.id
                        );

                        void persistReminders(updated);
                        setActiveReminderId(null);
                    },
                },
            ]
        );
    };

    // Toggle completion without removing the reminder from the agenda.
    const markReminderDone = (reminder: ReminderItem) => {
        const updated = reminders.map((item) =>
            item.id === reminder.id
                ? { ...item, completed: !item.completed }
                : item
        );

        void persistReminders(updated);
        setActiveReminderId(null);
    };

    // Open edit modal.
    const openEdit = (reminder: ReminderItem) => {
        setEditing(reminder);
        setEditTitle(reminder.title);
        setStartTime(new Date(reminder.startTime));
        setEndTime(new Date(reminder.endTime));
        setActiveReminderId(null);
    };

    // Save edited reminder.
    const saveEdit = () => {
        if (!editing) return;

        if (!editTitle.trim()) {
            Alert.alert("Missing title", "Please enter a title.");
            return;
        }

        if (endTime.getTime() <= startTime.getTime()) {
            Alert.alert(
                "Invalid time",
                "End time must be later than start time."
            );
            return;
        }

        const updated = reminders.map((item) =>
            item.id === editing.id
                ? {
                      ...item,
                      title: editTitle.trim(),
                      startTime,
                      endTime,
                  }
                : item
        );

        void persistReminders(updated);
        setEditing(null);
    };

    // Event card.
    const renderEvent = (event: CalendarEvent) => {
        const colors = EVENT_CATEGORY_COLORS[event.category];

        return (
            <View
                key={event.id}
                className="mb-2 min-h-[65px] flex-row items-center rounded-2xl border border-[#EEEAF0] bg-white px-4 py-3"
            >
                <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: colors.background,
                    }}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={19}
                        color={colors.accent}
                    />
                </View>

                <View className="flex-1">
                    <Text className="text-sm font-semibold text-[#303449]">
                        {event.name}
                    </Text>

                    <Text className="mt-1 text-xs text-[#85899B]">
                        {event.category}
                    </Text>
                </View>

                <View
                    className="rounded-full px-2.5 py-1"
                    style={{
                        backgroundColor: colors.background,
                    }}
                >
                    <Text
                        className="text-[10px] font-semibold"
                        style={{ color: colors.text }}
                    >
                        Event
                    </Text>
                </View>
            </View>
        );
    };

    // Reminder card and long-press action bar.
    const renderReminder = (reminder: ReminderItem) => {
        const selected = activeReminderId === reminder.id;

        return (
            <View key={reminder.id} className="relative mb-2">
                <Pressable
                    delayLongPress={350}
                    onLongPress={() => {
                        setActiveReminderId(reminder.id);
                    }}
                    onPress={() => {
                        if (selected) {
                            setActiveReminderId(null);
                        }
                    }}
                    className="min-h-[65px] flex-row items-center rounded-2xl border border-[#EEEAF0] bg-white px-4 py-3"
                >
                    <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: reminder.category.color,
                        }}
                    >
                        <Ionicons
                            name="notifications-outline"
                            size={19}
                            color={reminder.category.textColor}
                        />
                    </View>

                    <View className="flex-1">
                        <Text
                            className="text-sm font-semibold text-[#303449]"
                            style={
                                reminder.completed
                                    ? { textDecorationLine: "line-through" }
                                    : undefined
                            }
                        >
                            {reminder.title}
                        </Text>

                        <Text className="mt-1 text-xs text-[#85899B]">
                            {reminder.category.name} ·{" "}
                            {formatTime(reminder.startTime)}
                            {" – "}
                            {formatTime(reminder.endTime)}
                        </Text>
                    </View>

                    <View className="rounded-full bg-[#F1EEFF] px-2.5 py-1">
                        <Text className="text-[10px] font-semibold text-[#7058E8]">
                            Reminder
                        </Text>
                    </View>
                </Pressable>

                {selected && (
                    <View
                        className="absolute right-0 z-20 flex-row items-center rounded-full border border-[#EAE6F2] bg-white px-2 py-1.5 shadow-lg"
                        style={{ top: 58, elevation: 12 }}
                    >
                        <Pressable
                            onPress={() => deleteReminder(reminder)}
                            className="flex-row items-center px-3 py-2"
                            hitSlop={8}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#DC2626"
                            />
                            <Text className="ml-1.5 text-xs font-semibold text-[#DC2626]">
                                Delete
                            </Text>
                        </Pressable>

                        <View className="h-5 w-px bg-[#ECEAF0]" />

                        <Pressable
                            onPress={() => openEdit(reminder)}
                            className="flex-row items-center px-3 py-2"
                            hitSlop={8}
                        >
                            <Ionicons
                                name="create-outline"
                                size={16}
                                color="#52658F"
                            />
                            <Text className="ml-1.5 text-xs font-semibold text-[#52658F]">
                                Edit
                            </Text>
                        </Pressable>

                        <View className="h-5 w-px bg-[#ECEAF0]" />

                        <Pressable
                            onPress={() => markReminderDone(reminder)}
                            className="flex-row items-center px-3 py-2"
                            hitSlop={8}
                        >
                            <Ionicons
                                name={
                                    reminder.completed
                                        ? "arrow-undo-circle-outline"
                                        : "checkmark-circle-outline"
                                }
                                size={16}
                                color="#43836C"
                            />
                            <Text className="ml-1.5 text-xs font-semibold text-[#43836C]">
                                {reminder.completed ? "Undo" : "Done"}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#FFF8F7]">
            <StatusBar style="dark" />

            <SectionList<AgendaItem, AgendaSection>
                key={listVisit}
                sections={groupedItems}
                keyExtractor={(item) => item.id}
                extraData={activeReminderId}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingBottom: Math.max(insets.bottom, 10) + 96,
                    paddingHorizontal: 20,
                    flexGrow: groupedItems.length === 0 ? 1 : undefined,
                }}
                renderSectionHeader={({ section }) => (
                    <View className="mb-3 mt-3 flex-row items-center">
                        <Text className="text-[14px] font-bold text-[#4d4d4d]">
                            {formatDateHeading(section.dateKey)}
                        </Text>
                        <View className="ml-3 h-px flex-1 bg-[#EAE6E5]" />
                    </View>
                )}
                renderItem={({ item }) => {
                    if (item.type === "event") return renderEvent(item.event);
                    if (item.type === "reminder") return renderReminder(item.reminder);

                    return (
                        <View className="mb-2 rounded-2xl border border-dashed border-[#E7E1E4] bg-white/70 px-4 py-4">
                            <Text className="text-sm font-medium text-[#85899B]">
                                Nothing scheduled for today
                            </Text>
                        </View>
                    );
                }}
                ListHeaderComponent={
                    <View className="mb-4">
                        <View className="mb-4 flex-row items-center justify-between">
                            <View>
                                <Text className="text-[27px] font-bold tracking-tight text-[#303449]">
                                    Upcoming
                                </Text>
                                <Text className="mt-1 text-sm text-[#85899B]">
                                    Today and the next 30 days
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => {
                                    setActiveReminderId(null);
                                    setShowOptions(true);
                                }}
                                className="h-11 w-11 items-center justify-center rounded-2xl border border-[#EEEAF0] bg-white"
                            >
                                <Ionicons name="options-outline" size={22} color="#303449" />
                            </Pressable>
                        </View>
                        <Pressable
                            onPress={() => setShowPreviousDays((value) => !value)}
                            className="flex-row items-center justify-between rounded-2xl border border-[#EEEAF0] bg-white px-4 py-3"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="time-outline" size={18} color="#7058E8" />
                                <Text className="ml-2 text-sm font-semibold text-[#303449]">
                                    {showPreviousDays ? "Hide previous days" : "See previous days"}
                                </Text>
                            </View>
                            <Ionicons
                                name={showPreviousDays ? "chevron-up" : "chevron-down"}
                                size={18}
                                color="#85899B"
                            />
                        </Pressable>
                    </View>
                }
                ListEmptyComponent={
                    <View className="mt-16 items-center px-8">
                        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-[#F0EDFF]">
                            <Ionicons
                                name="calendar-clear-outline"
                                size={29}
                                color="#7058E8"
                            />
                        </View>
                        <Text className="mt-5 text-base font-semibold text-[#303449]">
                            Nothing coming up
                        </Text>
                        <Text className="mt-2 text-center text-sm leading-5 text-[#85899B]">
                            {remindersReady
                                ? "Your upcoming events and reminders will appear here."
                                : "Loading your reminders…"}
                        </Text>
                    </View>
                }
            />

            {/* Floating options panel */}
            <Modal
                visible={showOptions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptions(false)}
            >
                <Pressable
                    className="flex-1 bg-black/20"
                    onPress={() => setShowOptions(false)}
                >
                    <View
                        className="absolute right-5 w-[230px] rounded-2xl border border-[#EEEAF0] bg-white p-4 shadow-xl"
                        style={{
                            top: insets.top + 66,
                        }}
                    >
                        <View className="mb-3 flex-row items-center justify-between">
                            <Text className="text-sm font-bold text-[#303449]">
                                Display options
                            </Text>

                            <Ionicons
                                name="options-outline"
                                size={17}
                                color="#85899B"
                            />
                        </View>

                        <Pressable
                            onPress={() =>
                                setPriorityFirst((value) => !value)
                            }
                            className="flex-row items-center justify-between border-b border-[#F1EFF3] py-3"
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="flag-outline"
                                    size={18}
                                    color="#D97706"
                                />

                                <Text className="ml-3 text-sm font-medium text-[#303449]">
                                    Priority first
                                </Text>
                            </View>

                            <Ionicons
                                name={
                                    priorityFirst
                                        ? "checkbox"
                                        : "square-outline"
                                }
                                size={20}
                                color={priorityFirst ? "#7058E8" : "#A0A3B2"}
                            />
                        </Pressable>

                        <Pressable
                            onPress={() =>
                                setShowEvents((value) => !value)
                            }
                            className="flex-row items-center justify-between border-b border-[#F1EFF3] py-3"
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color="#C62828"
                                />

                                <Text className="ml-3 text-sm font-medium text-[#303449]">
                                    Show events
                                </Text>
                            </View>

                            <Ionicons
                                name={
                                    showEvents
                                        ? "checkbox"
                                        : "square-outline"
                                }
                                size={20}
                                color={showEvents ? "#7058E8" : "#A0A3B2"}
                            />
                        </Pressable>

                        <Pressable
                            onPress={() =>
                                setShowReminders((value) => !value)
                            }
                            className="flex-row items-center justify-between py-3"
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="notifications-outline"
                                    size={18}
                                    color="#7058E8"
                                />

                                <Text className="ml-3 text-sm font-medium text-[#303449]">
                                    Show reminders
                                </Text>
                            </View>

                            <Ionicons
                                name={
                                    showReminders
                                        ? "checkbox"
                                        : "square-outline"
                                }
                                size={20}
                                color={
                                    showReminders ? "#7058E8" : "#A0A3B2"
                                }
                            />
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* Edit reminder modal */}
            <Modal
                visible={!!editing}
                transparent
                animationType="fade"
                onRequestClose={() => setEditing(null)}
            >
                <View className="flex-1 justify-center bg-black/35 px-5">
                    <View className="rounded-[28px] bg-white p-5">
                        <View className="mb-5 flex-row items-center justify-between">
                            <Text className="text-lg font-bold text-[#303449]">
                                Edit reminder
                            </Text>

                            <Pressable
                                onPress={() => setEditing(null)}
                                className="h-9 w-9 items-center justify-center rounded-full bg-[#F5F4F7]"
                            >
                                <Ionicons
                                    name="close"
                                    size={19}
                                    color="#666B7D"
                                />
                            </Pressable>
                        </View>

                        <Text className="mb-2 text-xs font-semibold text-[#85899B]">
                            TITLE
                        </Text>

                        <TextInput
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Reminder title"
                            placeholderTextColor="#A0A3B2"
                            className="mb-4 rounded-2xl border border-[#ECEAF0] px-4 py-3 text-sm text-[#303449]"
                        />

                        <Text className="mb-2 text-xs font-semibold text-[#85899B]">
                            TIME
                        </Text>

                        <View className="mb-5 flex-row gap-3">
                            <Pressable
                                onPress={() => setTimePicker("start")}
                                className="flex-1 flex-row items-center justify-between rounded-2xl border border-[#ECEAF0] px-3 py-3"
                            >
                                <Text className="text-sm text-[#303449]">
                                    {formatTime(startTime)}
                                </Text>

                                <Ionicons
                                    name="time-outline"
                                    size={17}
                                    color="#85899B"
                                />
                            </Pressable>

                            <Pressable
                                onPress={() => setTimePicker("end")}
                                className="flex-1 flex-row items-center justify-between rounded-2xl border border-[#ECEAF0] px-3 py-3"
                            >
                                <Text className="text-sm text-[#303449]">
                                    {formatTime(endTime)}
                                </Text>

                                <Ionicons
                                    name="time-outline"
                                    size={17}
                                    color="#85899B"
                                />
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={saveEdit}
                            className="items-center rounded-2xl bg-[#7058E8] py-3.5"
                        >
                            <Text className="text-sm font-bold text-white">
                                Save changes
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Time picker */}
            {timePicker && (
                <DateTimePicker
                    value={timePicker === "start" ? startTime : endTime}
                    mode="time"
                    display="default"
                    onChange={(_event, selectedDate) => {
                        if (selectedDate && timePicker === "start") {
                            setStartTime(selectedDate);
                        }

                        if (selectedDate && timePicker === "end") {
                            setEndTime(selectedDate);
                        }

                        setTimePicker(null);
                    }}
                />
            )}
        </View>
    );
}
