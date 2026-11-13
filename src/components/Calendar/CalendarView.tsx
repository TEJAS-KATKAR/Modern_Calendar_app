import { View, Text, Pressable } from "react-native";
import { getCalendarEventDateKey } from "../../events/calendarEvents";

interface Props {
    year: number;
    month: number;
    selectedDate: number;
    today: Date;
    eventDates: string[];
    reminderDates: string[];
    importantReminderDates: string[];
    onSelectDate: (date: number) => void;
}

const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarView({
    year,
    month,
    selectedDate,
    today = new Date(),
    eventDates = [],
    reminderDates = [],
    importantReminderDates = [],
    onSelectDate,
}: Props) {

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    // Always generate 42 cells (7 columns × 6 rows)
    const dates = Array.from({ length: 42 }, (_, index) => {
        const day = index - firstDay + 1;

        if (day < 1) {
            return {
                date: previousMonthDays + day,
                current: false,
            };
        }

        if (day > totalDays) {
            return {
                date: day - totalDays,
                current: false,
            };
        }

        return {
            date: day,
            current: true,
        };
    });

    // Divide dates into six weeks
    const weeks = Array.from({ length: 6 }, (_, index) =>
        dates.slice(index * 7, index * 7 + 7)
    );
    const eventDateSet = new Set(eventDates);
    const reminderDateSet = new Set(reminderDates);
    const importantReminderDateSet = new Set(importantReminderDates);

    return (
        <View className="mx-3 rounded-3xl bg-[#FFFAF9] py-1 shadow-lg border border-1">

            {/* Weekday Header */}
            <View className="flex-row mb-2">
                {weekdays.map((day, index) => (
                    <View
                        key={day}
                        className="flex-1 items-center justify-center py-2"
                    >
                        <Text
                            className={`text-[14px] font-bold ${
                                index === 0 || index === 6
                                    ? "text-red-600"
                                    : "text-slate-700"
                            }`}
                        >
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Calendar Weeks */}
            {weeks.map((week, weekIndex) => (
                <View key={weekIndex} className="flex-row">

                    {week.map((item, dayIndex) => {
                        const isSelected =
                            item.current && item.date === selectedDate;
                        const isToday =
                            item.current &&
                            year === today.getFullYear() &&
                            month === today.getMonth() &&
                            item.date === today.getDate();

                        const dateKey = getCalendarEventDateKey(
                            new Date(year, month, item.date)
                        );
                        const hasEvent = item.current && eventDateSet.has(dateKey);
                        const hasReminder =
                            item.current &&
                            reminderDateSet.has(new Date(year, month, item.date).toDateString());
                        const hasImportantReminder =
                            item.current && importantReminderDateSet.has(dateKey);
                        return (
                            <View
                                key={dayIndex}
                                className="flex-1 p-[2px]"
                            >
                                <Pressable
                                    disabled={!item.current}
                                    onPress={() => onSelectDate(item.date)}
                                    className={`h-[76px] rounded-xl border p-2 ${
                                        isToday
                                            ? "border-2 border-blue-600 bg-blue-100"
                                            : isSelected
                                            ? "border-2 border-violet-600 bg-purple-100"
                                            : item.current
                                            ? "border-[#EAE0E0] bg-white active:bg-purple-50"
                                            : "border-transparent bg-[#F1E9E9]"
                                    }`}
                                >
                                    <Text
                                        className={`text-[14px] font-bold ${
                                            item.current
                                                ? "text-slate-900"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {item.date}
                                    </Text>

                                    {item.current && (hasEvent || hasReminder) && (
                                        <View className="mt-auto gap-1">
                                            {hasEvent && (
                                                <View className="mx-1 h-1.5 rounded-full bg-red-500" />
                                            )}
                                            {hasImportantReminder && (
                                                <View className="mx-1 h-1.5 rounded-full bg-blue-500" />
                                            )}
                                            {hasReminder && (
                                                <View className="mx-1 h-1.5 rounded-full bg-green-500" />
                                            )}
                                        </View>
                                    )}
                                </Pressable>
                            </View>
                        );
                    })}

                </View>
            ))}
        </View>
    );
}
