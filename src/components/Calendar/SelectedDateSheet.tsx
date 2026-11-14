import { useEffect, useMemo, useRef, useState } from "react";

import {
    View,
    Text,
    Pressable,
    BackHandler,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
    IMPORTANT_CATEGORY_COLORS,
    type Reminder,
    type ReminderCategory,
} from "../../types/reminder";
import {
    getCalendarEventDateKey,
    type CalendarEvent,
    EVENT_CATEGORY_COLORS,
} from "../../events/calendarEvents";


interface Props {
    visible: boolean;
    date: Date | null;
    events: CalendarEvent[];
    reminders: Reminder[];
    remindersReady: boolean;
    onClose: () => void;
    onCreateReminder: (reminder: Reminder) => Promise<void>;
    onSaveReminders: (reminders: Reminder[]) => Promise<void>;
}


// Default categories
const defaultCategories: ReminderCategory[] = [
    {
        name: "Work",
        color: "#E8EDF8",
        textColor: "#52658F",
    },
    {
        name: "Personal",
        color: "#E2F1EC",
        textColor: "#43836C",
    },
    {
        name: "Important",
        color: IMPORTANT_CATEGORY_COLORS.background,
        textColor: IMPORTANT_CATEGORY_COLORS.text,
    },
];


// Available custom category colors
const categoryColors = [
    { bg: "#E8EDF8", text: "#52658F" },
    { bg: "#E2F1EC", text: "#43836C" },
    { bg: IMPORTANT_CATEGORY_COLORS.background, text: IMPORTANT_CATEGORY_COLORS.text },
    { bg: "#F4EBDD", text: "#A17B43" },
    { bg: "#EDE8F8", text: "#7962AD" },
    { bg: "#E2EFF4", text: "#4D8295" },
    { bg: "#F3E8E0", text: "#A77859" },
    { bg: "#E9EBED", text: "#68717B" },
];

const noReminders: Reminder[] = [];
const noEvents: CalendarEvent[] = [];


export default function SelectedDateSheet({
    visible,
    date,
    events,
    reminders,
    remindersReady,
    onClose,
    onCreateReminder,
    onSaveReminders,
}: Props) {

    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() => ["55%", "80%"], []);

    const { height } = useWindowDimensions();


    // Reminder form
    const [showCreate, setShowCreate] = useState(false);
    const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editStartTime, setEditStartTime] = useState(new Date());
    const [editEndTime, setEditEndTime] = useState(new Date());
    const [editTimePicker, setEditTimePicker] = useState<"start" | "end" | null>(null);

    const [reminderTitle, setReminderTitle] = useState("");

    const [startTime, setStartTime] = useState(() => {
        const time = new Date();
        time.setHours(16, 0, 0, 0);
        return time;
    });

    const [endTime, setEndTime] = useState(() => {
        const time = new Date();
        time.setHours(18, 0, 0, 0);
        return time;
    });


    // Categories
    const [categories, setCategories] = useState<ReminderCategory[]>(
        defaultCategories
    );

    const [selectedCategory, setSelectedCategory] = useState<ReminderCategory>(
        defaultCategories[1]
    );


    // Custom category form
    const [showNewCategory, setShowNewCategory] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState("");

    const [newCategoryColor, setNewCategoryColor] = useState(
        categoryColors[0]
    );


    // Time picker
    const [activeTimePicker, setActiveTimePicker] = useState<
        "start" | "end" | null
    >(null);


    // Reset nested forms when the sheet is dismissed.
    useEffect(() => {
        if (!visible) {
            setShowCreate(false);
            setShowNewCategory(false);
        }
    }, [visible]);


    // Android back button handling
    useEffect(() => {
        if (!visible) return;

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {

                if (activeTimePicker) {
                    setActiveTimePicker(null);
                    return true;
                }

                if (showNewCategory) {
                    setShowNewCategory(false);
                    return true;
                }

                if (showCreate) {
                    setShowCreate(false);
                    return true;
                }

                sheetRef.current?.close();

                onClose();

                return true;
            }
        );

        return () => subscription.remove();

    }, [
        visible,
        showCreate,
        showNewCategory,
        activeTimePicker,
        onClose,
    ]);


    const dateKey = date?.toDateString() ?? "";
    const eventDateKey = date ? getCalendarEventDateKey(date) : "";

    const remindersByDate = useMemo(() => {
        const grouped = new Map<string, Reminder[]>();
        for (const reminder of reminders) {
            const dayReminders = grouped.get(reminder.dateKey) ?? [];
            dayReminders.push(reminder);
            grouped.set(reminder.dateKey, dayReminders);
        }
        for (const dayReminders of grouped.values()) {
            dayReminders.sort(
                (first, second) => first.startTime.getTime() - second.startTime.getTime()
            );
        }
        return grouped;
    }, [reminders]);

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        for (const event of events) {
            const dayEvents = grouped.get(event.date) ?? [];
            dayEvents.push(event);
            grouped.set(event.date, dayEvents);
        }
        return grouped;
    }, [events]);

    const selectedReminders = remindersByDate.get(dateKey) ?? noReminders;
    const selectedEvents = eventsByDate.get(eventDateKey) ?? noEvents;

    if (!date) return null;


    const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
    });


    const formatTime = (time: Date) =>
        time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const saveReminderChanges = async (updated: Reminder[]) => {
        try {
            await onSaveReminders(updated);
        } catch {
            Alert.alert("Couldn't save changes", "Please try again.");
        }
    };

    const markReminderDone = (reminder: Reminder) => {
        void saveReminderChanges(
            reminders.map((item) =>
                item.id === reminder.id
                    ? { ...item, completed: !item.completed }
                    : item
            )
        );
        setActiveReminderId(null);
    };

    const deleteReminder = (reminder: Reminder) => {
        Alert.alert("Delete reminder?", `Delete “${reminder.title}”?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    void saveReminderChanges(
                        reminders.filter((item) => item.id !== reminder.id)
                    );
                    setActiveReminderId(null);
                },
            },
        ]);
    };

    const openReminderEdit = (reminder: Reminder) => {
        setEditingReminder(reminder);
        setEditTitle(reminder.title);
        setEditStartTime(new Date(reminder.startTime));
        setEditEndTime(new Date(reminder.endTime));
        setActiveReminderId(null);
    };

    const saveReminderEdit = () => {
        if (!editingReminder || !editTitle.trim()) return;
        if (editEndTime.getTime() <= editStartTime.getTime()) {
            Alert.alert("Invalid time", "End time must be later than start time.");
            return;
        }
        void saveReminderChanges(
            reminders.map((item) =>
                item.id === editingReminder.id
                    ? { ...item, title: editTitle.trim(), startTime: editStartTime, endTime: editEndTime }
                    : item
            )
        );
        setEditingReminder(null);
    };


    // Create reminder
    const handleCreateReminder = async () => {

        if (!reminderTitle.trim()) return;

        if (endTime.getTime() <= startTime.getTime()) return;

        const newReminder: Reminder = {
            id: Date.now().toString(),
            title: reminderTitle.trim(),
            startTime,
            endTime,
            category: selectedCategory,
            dateKey,
        };

        try {
            await onCreateReminder(newReminder);
        } catch {
            Alert.alert("Couldn't save reminder", "Please try again.");
            return;
        }

        setReminderTitle("");

        setStartTime((previous) => {
            const next = new Date(previous);
            next.setHours(16, 0, 0, 0);
            return next;
        });

        setEndTime((previous) => {
            const next = new Date(previous);
            next.setHours(18, 0, 0, 0);
            return next;
        });

        setSelectedCategory(defaultCategories[1]);

        setShowCreate(false);
    };


    // Create custom category
    const handleCreateCategory = () => {

        if (!newCategoryName.trim()) return;

        const category: ReminderCategory = {
            name: newCategoryName.trim(),
            color: newCategoryColor.bg,
            textColor: newCategoryColor.text,
        };

        setCategories((previous) => [
            ...previous,
            category,
        ]);

        setSelectedCategory(category);

        setNewCategoryName("");

        setShowNewCategory(false);
    };


    const renderBackdrop = (props: any) => (
        <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            opacity={0.45}
        />
    );


    return (
        <>

            {/* SELECTED DATE BOTTOM SHEET */}

            {visible && <BottomSheet
                ref={sheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                enableDynamicSizing={false}
                backdropComponent={renderBackdrop}

                handleIndicatorStyle={{
                    backgroundColor: "#C4C5D0",
                    width: 42,
                    height: 5,
                }}

                backgroundStyle={{
                    backgroundColor: "#F8F8FC",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                }}

                onChange={(index) => {
                    if (index === -1) {
                        onClose();
                    }
                }}
            >

                <BottomSheetScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: 125,
                    }}
                >

                    {/* DATE HEADER */}

                    <View className="mb-6 flex-row items-center justify-between">

                        <View className="flex-1 mr-3">

                            <Text className="text-[20px] font-bold text-[#20243A]">
                                {formattedDate}
                            </Text>

                            <Text className="mt-1 text-[13px] text-[#85899B]">
                                Your day at a glance
                            </Text>

                        </View>


                        {/* CREATE BUTTON */}

                        <Pressable
                            onPress={() => setShowCreate(true)}
                            className="flex-row items-center rounded-xl bg-[#7058E8] px-4 py-3 active:bg-[#5B43D0]"
                            style={{ elevation: 3 }}
                        >

                            <Ionicons
                                name="add"
                                size={20}
                                color="white"
                            />

                            <Text className="ml-1 text-sm font-semibold text-white">
                                Create
                            </Text>

                        </Pressable>

                    </View>


                    {/* EMPTY STATE */}

                    {selectedEvents.length > 0 && (
                        <View className="mb-5">
                            <View className="mb-4 flex-row items-center justify-between">
                                <Text className="text-base font-bold text-[#252941]">
                                    Events
                                </Text>
                                <Text className="text-xs text-[#85899B]">
                                    {selectedEvents.length} items
                                </Text>
                            </View>

                            {selectedEvents.map((event) => (
                                <View
                                    key={event.id}
                                    className="mb-3 flex-row rounded-2xl border border-[#ECECF3] bg-white p-4"
                                >
                                    <View
                                        className="mr-3 w-1 rounded-full"
                                        style={{
                                            backgroundColor: EVENT_CATEGORY_COLORS[event.category].accent,
                                        }}
                                    />

                                    <View className="flex-1">
                                        <View className="flex-row items-start justify-between gap-2">
                                            <Text className="flex-1 text-[15px] font-semibold text-[#252941]">
                                                {event.name}
                                            </Text>
                                            <View
                                                className="rounded-lg px-2 py-1"
                                                style={{
                                                    backgroundColor: EVENT_CATEGORY_COLORS[event.category].background,
                                                }}
                                            >
                                                <Text
                                                    className="text-[10px] font-semibold"
                                                    style={{ color: EVENT_CATEGORY_COLORS[event.category].text }}
                                                >
                                                    {event.category}
                                                </Text>
                                            </View>
                                        </View>

                                        {event.description && (
                                            <Text numberOfLines={2} className="mt-2 text-xs leading-5 text-[#666B80]">
                                                {event.description}
                                            </Text>
                                        )}

                                        {event.details && (
                                            <Text numberOfLines={2} className="mt-2 text-xs leading-5 text-[#85899B]">
                                                {event.details}
                                            </Text>
                                        )}

                                        {event.extraInfo && (
                                            <Text className="mt-2 text-[11px] font-medium capitalize text-[#85899B]">
                                                {event.extraInfo}
                                            </Text>
                                        )}

                                        {event.timeUtc && (
                                            <Text className="mt-2 text-[11px] font-medium text-[#85899B]">
                                                {event.timeUtc} UTC
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}


                    {selectedEvents.length === 0 && selectedReminders.length === 0 && (

                        <View className="min-h-[210px] items-center justify-center rounded-[24px] border border-[#ECECF3] bg-white px-6 py-8">

                            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-[#F0EDFF]">

                                <Ionicons
                                    name="calendar-clear-outline"
                                    size={30}
                                    color="#7058E8"
                                />

                            </View>

                            <Text className="text-[17px] font-bold text-[#252941]">
                                Nothing planned today
                            </Text>

                            <Text className="mt-2 text-center text-[13px] leading-5 text-[#85899B]">
                                Enjoy your free time. Events and reminders will appear here.
                            </Text>

                        </View>

                    )}


                    {/* USER REMINDERS */}

                    {selectedReminders.length > 0 && (

                        <View>

                            <View className="mb-4 flex-row items-center justify-between">

                                <Text className="text-base font-bold text-[#252941]">
                                    Your Reminders
                                </Text>

                                <Text className="text-xs text-[#85899B]">
                                    {selectedReminders.length} items
                                </Text>

                            </View>


                            {selectedReminders.map((reminder) => (

                                <View key={reminder.id} className="mb-3">
                                <Pressable
                                    onLongPress={() => setActiveReminderId(reminder.id)}
                                    onPress={() => {
                                        if (activeReminderId === reminder.id) setActiveReminderId(null);
                                    }}
                                    className="flex-row items-center rounded-2xl border border-[#ECECF3] bg-white p-4"
                                >

                                    {/* CATEGORY INDICATOR */}

                                    <View
                                        className="mr-3 h-10 w-1 rounded-full"
                                        style={{
                                            backgroundColor: reminder.category.textColor,
                                        }}
                                    />


                                    {/* REMINDER INFORMATION */}

                                    <View className="flex-1">

                                        <Text
                                            className="text-[15px] font-semibold"
                                            style={
                                                reminder.completed
                                                    ? { color: "#85899B", textDecorationLine: "line-through" }
                                                    : { color: "#252941" }
                                            }
                                        >
                                            {reminder.title}
                                        </Text>

                                        <View className="mt-2 flex-row items-center">

                                            <Ionicons
                                                name="time-outline"
                                                size={14}
                                                color="#85899B"
                                            />

                                            <Text className="ml-1 text-xs text-[#85899B]">
                                                {formatTime(reminder.startTime)}
                                                {" - "}
                                                {formatTime(reminder.endTime)}
                                            </Text>

                                        </View>

                                    </View>


                                    {/* CATEGORY TAG */}

                                    <View
                                        className="rounded-lg px-3 py-2"
                                        style={{
                                            backgroundColor: reminder.completed ? "#E5F3EC" : reminder.category.color,
                                        }}
                                    >

                                        <Text
                                            className="text-[11px] font-semibold"
                                            style={{
                                                color: reminder.completed ? "#43836C" : reminder.category.textColor,
                                            }}
                                        >
                                            {reminder.completed ? "Done" : reminder.category.name}
                                        </Text>

                                    </View>

                                </Pressable>

                                {activeReminderId === reminder.id && (
                                    <View className="mt-2 self-end flex-row items-center rounded-full border border-[#ECEAF0] bg-white px-2 py-1 shadow">
                                        <Pressable onPress={() => deleteReminder(reminder)} className="flex-row items-center px-3 py-2">
                                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                                            <Text className="ml-1.5 text-xs font-semibold text-[#DC2626]">Delete</Text>
                                        </Pressable>
                                        <View className="h-5 w-px bg-[#ECEAF0]" />
                                        <Pressable onPress={() => openReminderEdit(reminder)} className="flex-row items-center px-3 py-2">
                                            <Ionicons name="create-outline" size={16} color="#52658F" />
                                            <Text className="ml-1.5 text-xs font-semibold text-[#52658F]">Edit</Text>
                                        </Pressable>
                                        <View className="h-5 w-px bg-[#ECEAF0]" />
                                        <Pressable onPress={() => markReminderDone(reminder)} className="flex-row items-center px-3 py-2">
                                            <Ionicons name={reminder.completed ? "arrow-undo-circle-outline" : "checkmark-circle-outline"} size={16} color="#43836C" />
                                            <Text className="ml-1.5 text-xs font-semibold text-[#43836C]">{reminder.completed ? "Undo" : "Done"}</Text>
                                        </Pressable>
                                    </View>
                                )}
                                </View>

                            ))}

                        </View>

                    )}

                </BottomSheetScrollView>

            </BottomSheet>}


            {/* EDIT REMINDER MODAL */}
            <Modal
                visible={!!editingReminder}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingReminder(null)}
            >
                <View className="flex-1 justify-center bg-black/40 px-5">
                    <View className="rounded-[26px] bg-white p-5">
                        <Text className="mb-4 text-lg font-bold text-[#252941]">Edit reminder</Text>
                        <TextInput
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Reminder title"
                            className="mb-4 rounded-xl border border-[#E8E8F0] px-4 py-3 text-[#252941]"
                        />
                        <View className="mb-5 flex-row gap-3">
                            {(["start", "end"] as const).map((part) => (
                                <Pressable
                                    key={part}
                                    onPress={() => setEditTimePicker(part)}
                                    className="flex-1 flex-row items-center justify-center rounded-xl border border-[#E8E8F0] px-2 py-3"
                                >
                                    <Ionicons name="time-outline" size={16} color="#7058E8" />
                                    <Text className="ml-2 text-sm text-[#30334A]">
                                        {formatTime(part === "start" ? editStartTime : editEndTime)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        {editTimePicker && (
                            <DateTimePicker
                                value={editTimePicker === "start" ? editStartTime : editEndTime}
                                mode="time"
                                display="default"
                                onChange={(_event, selected) => {
                                    if (selected && editTimePicker === "start") setEditStartTime(selected);
                                    if (selected && editTimePicker === "end") setEditEndTime(selected);
                                    setEditTimePicker(null);
                                }}
                            />
                        )}
                        <View className="flex-row gap-3">
                            <Pressable onPress={() => setEditingReminder(null)} className="flex-1 items-center rounded-xl bg-[#F3F2F6] py-3">
                                <Text className="font-semibold text-[#666B7D]">Cancel</Text>
                            </Pressable>
                            <Pressable onPress={saveReminderEdit} className="flex-1 items-center rounded-xl bg-[#7058E8] py-3">
                                <Text className="font-semibold text-white">Save changes</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* CREATE REMINDER MODAL */}

            <Modal
                visible={showCreate}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setShowCreate(false)}
            >

                <View className="flex-1 items-center justify-center bg-black/45 px-5">

                    <Pressable
                        className="absolute inset-0"
                        onPress={() => setShowCreate(false)}
                    />


                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        className="w-full items-center"
                    >

                        <View
                            className="w-full overflow-hidden rounded-[26px] border border-[#ECECF3] bg-[#F9F9FD]"
                            style={{
                                maxHeight: height * 0.68,
                            }}
                        >

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{
                                    padding: 22,
                                }}
                            >

                                {/* MODAL HEADER */}

                                <View className="mb-7 flex-row items-center justify-between">

                                    <View>

                                        <Text className="text-[21px] font-bold text-[#20243A]">
                                            New Reminder
                                        </Text>

                                        <Text className="mt-1 text-xs text-[#85899B]">
                                            Add something to your schedule
                                        </Text>

                                    </View>


                                    <Pressable
                                        onPress={() => setShowCreate(false)}
                                        className="h-9 w-9 items-center justify-center rounded-full bg-white"
                                    >

                                        <Ionicons
                                            name="close"
                                            size={20}
                                            color="#55596D"
                                        />

                                    </Pressable>

                                </View>


                                {/* TITLE INPUT */}

                                <Text className="mb-2 text-[11px] font-bold tracking-wider text-[#777B91]">
                                    REMINDER TITLE
                                </Text>

                                <TextInput
                                    value={reminderTitle}
                                    onChangeText={setReminderTitle}
                                    placeholder="What do you need to do?"
                                    placeholderTextColor="#A4A6B5"
                                    className="mb-6 rounded-xl border border-[#E8E8F0] bg-white px-4 py-4 text-sm text-[#252941]"
                                />


                                {/* TIME SELECTION */}

                                <Text className="mb-3 text-[11px] font-bold tracking-wider text-[#777B91]">
                                    TIME
                                </Text>


                                <View className="mb-6 flex-row gap-3">

                                    {/* FROM */}

                                    <View className="flex-1">

                                        <Text className="mb-2 text-xs font-medium text-[#85899B]">
                                            FROM
                                        </Text>

                                        <Pressable
                                            onPress={() => setActiveTimePicker("start")}
                                            className="flex-row items-center justify-center rounded-xl border border-[#E8E8F0] bg-white px-2 py-4"
                                        >

                                            <Ionicons
                                                name="time-outline"
                                                size={17}
                                                color="#7058E8"
                                            />

                                            <Text className="ml-2 text-sm font-semibold text-[#30334A]">
                                                {formatTime(startTime)}
                                            </Text>

                                        </Pressable>

                                    </View>


                                    {/* TO */}

                                    <View className="flex-1">

                                        <Text className="mb-2 text-xs font-medium text-[#85899B]">
                                            TO
                                        </Text>

                                        <Pressable
                                            onPress={() => setActiveTimePicker("end")}
                                            className="flex-row items-center justify-center rounded-xl border border-[#E8E8F0] bg-white px-2 py-4"
                                        >

                                            <Ionicons
                                                name="time-outline"
                                                size={17}
                                                color="#7058E8"
                                            />

                                            <Text className="ml-2 text-sm font-semibold text-[#30334A]">
                                                {formatTime(endTime)}
                                            </Text>

                                        </Pressable>

                                    </View>

                                </View>


                                {/* TIME PICKER */}

                                {activeTimePicker && (

                                    <DateTimePicker
                                        value={
                                            activeTimePicker === "start"
                                                ? startTime
                                                : endTime
                                        }
                                        mode="time"
                                        display="default"
                                        onChange={(event, selected) => {

                                            setActiveTimePicker(null);

                                            if (!selected) return;

                                            if (activeTimePicker === "start") {
                                                setStartTime(selected);
                                            } else {
                                                setEndTime(selected);
                                            }

                                        }}
                                    />

                                )}


                                {/* CATEGORY */}

                                <Text className="mb-3 text-[11px] font-bold tracking-wider text-[#777B91]">
                                    CATEGORY
                                </Text>


                                {/* HORIZONTAL CATEGORY SCROLLER */}

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-7"
                                    contentContainerStyle={{
                                        gap: 9,
                                        paddingRight: 5,
                                    }}
                                >

                                    {categories.map((category) => {

                                        const selected =
                                            selectedCategory.name === category.name;

                                        return (

                                            <Pressable
                                                key={category.name}
                                                onPress={() => setSelectedCategory(category)}
                                                className="flex-row items-center rounded-full px-4 py-3"
                                                style={{
                                                    backgroundColor: category.color,
                                                    borderWidth: selected ? 1.5 : 1,
                                                    borderColor: selected
                                                        ? category.textColor
                                                        : "transparent",
                                                }}
                                            >

                                                {selected && (

                                                    <Ionicons
                                                        name="checkmark"
                                                        size={14}
                                                        color={category.textColor}
                                                        style={{ marginRight: 5 }}
                                                    />

                                                )}

                                                <Text
                                                    className="text-xs font-semibold"
                                                    style={{
                                                        color: category.textColor,
                                                    }}
                                                >
                                                    {category.name}
                                                </Text>

                                            </Pressable>

                                        );

                                    })}


                                    {/* ADD CATEGORY */}

                                    <Pressable
                                        onPress={() => setShowNewCategory(true)}
                                        className="flex-row items-center rounded-full border border-dashed border-[#C9C8D5] bg-white px-4 py-3"
                                    >

                                        <Ionicons
                                            name="add"
                                            size={16}
                                            color="#7058E8"
                                        />

                                        <Text className="ml-1 text-xs font-semibold text-[#7058E8]">
                                            New
                                        </Text>

                                    </Pressable>

                                </ScrollView>


                                {/* TIME VALIDATION */}

                                {endTime.getHours() * 60 + endTime.getMinutes() <=
                                    startTime.getHours() * 60 + startTime.getMinutes() && (

                                    <Text className="mb-4 text-xs font-medium text-red-500">
                                        End time must be later than start time.
                                    </Text>

                                )}


                                {/* CREATE REMINDER BUTTON */}

                                <Pressable
                                    onPress={handleCreateReminder}
                                    disabled={
                                        !remindersReady ||
                                        !reminderTitle.trim() ||
                                        endTime.getHours() * 60 + endTime.getMinutes() <=
                                        startTime.getHours() * 60 + startTime.getMinutes()
                                    }
                                    className="flex-row items-center justify-center rounded-xl bg-[#7058E8] py-4 active:bg-[#5B43D0]"
                                    style={{
                                        opacity:
                                            reminderTitle.trim() &&
                                            remindersReady &&
                                            endTime.getHours() * 60 + endTime.getMinutes() >
                                            startTime.getHours() * 60 + startTime.getMinutes()
                                                ? 1
                                                : 0.5,
                                    }}
                                >

                                    <Ionicons
                                        name="add"
                                        size={20}
                                        color="white"
                                    />

                                    <Text className="ml-2 text-sm font-bold text-white">
                                        Create Reminder
                                    </Text>

                                </Pressable>

                            </ScrollView>

                        </View>

                    </KeyboardAvoidingView>


                    {/* CUSTOM CATEGORY MODAL */}

                    {showNewCategory && (

                        <View className="absolute inset-0 items-center justify-center bg-black/40 px-8">

                            <View className="w-full rounded-[24px] border border-[#ECECF3] bg-[#F9F9FD] p-5">

                                <View className="mb-5 flex-row items-center justify-between">

                                    <View>

                                        <Text className="text-lg font-bold text-[#20243A]">
                                            New Category
                                        </Text>

                                        <Text className="mt-1 text-xs text-[#85899B]">
                                            Create your own category
                                        </Text>

                                    </View>

                                    <Pressable
                                        onPress={() => setShowNewCategory(false)}
                                        className="h-9 w-9 items-center justify-center rounded-full bg-white"
                                    >
                                        <Ionicons
                                            name="close"
                                            size={19}
                                            color="#55596D"
                                        />
                                    </Pressable>

                                </View>


                                <Text className="mb-2 text-[11px] font-bold tracking-wider text-[#777B91]">
                                    CATEGORY NAME
                                </Text>

                                <TextInput
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    placeholder="e.g. Study, Fitness"
                                    placeholderTextColor="#A4A6B5"
                                    className="mb-5 rounded-xl border border-[#E8E8F0] bg-white px-4 py-4 text-sm text-[#252941]"
                                />


                                <Text className="mb-3 text-[11px] font-bold tracking-wider text-[#777B91]">
                                    SELECT COLOR
                                </Text>


                                <View className="mb-6 flex-row flex-wrap gap-3">

                                    {categoryColors.map((item) => (

                                        <Pressable
                                            key={item.bg}
                                            onPress={() => setNewCategoryColor(item)}
                                            className="h-10 w-10 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: item.bg,
                                                borderWidth:
                                                    newCategoryColor.bg === item.bg
                                                        ? 2
                                                        : 0,
                                                borderColor: item.text,
                                            }}
                                        >

                                            {newCategoryColor.bg === item.bg && (

                                                <Ionicons
                                                    name="checkmark"
                                                    size={19}
                                                    color={item.text}
                                                />

                                            )}

                                        </Pressable>

                                    ))}

                                </View>


                                <Pressable
                                    onPress={handleCreateCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="items-center rounded-xl bg-[#7058E8] py-3.5"
                                    style={{
                                        opacity: newCategoryName.trim() ? 1 : 0.5,
                                    }}
                                >

                                    <Text className="text-sm font-bold text-white">
                                        Add Category
                                    </Text>

                                </Pressable>

                            </View>

                        </View>

                    )}

                </View>

            </Modal>

        </>
    );
}
