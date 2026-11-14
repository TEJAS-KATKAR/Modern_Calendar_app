import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import {
    EVENT_CATEGORY_COLORS,
    EVENT_CATEGORY_ORDER,
    getCalendarEventDateKey,
    type CalendarEvent,
    type CalendarEventCategory,
} from "../../events/calendarEvents";
import { IMPORTANT_CATEGORY_COLORS } from "../../types/reminder";

interface Props {
    year: number;
    month: number;
    selectedDate: number;
    today: Date;
    events: CalendarEvent[];
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
    events = [],
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
    const eventCategoriesByDate = useMemo(() => {
        const categoriesByDate = new Map<string, Set<CalendarEventCategory>>();
        for (const event of events) {
            const categories = categoriesByDate.get(event.date) ?? new Set();
            categories.add(event.category);
            categoriesByDate.set(event.date, categories);
        }
        return categoriesByDate;
    }, [events]);
    const reminderDateSet = useMemo(() => new Set(reminderDates), [reminderDates]);
    const importantReminderDateSet = useMemo(
        () => new Set(importantReminderDates),
        [importantReminderDates]
    );

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
                        const reminderDateKey = new Date(
                            year,
                            month,
                            item.date
                        ).toDateString();
                        const eventCategories = item.current
                            ? EVENT_CATEGORY_ORDER.filter((category) =>
                                  eventCategoriesByDate.get(dateKey)?.has(category)
                              )
                            : [];
                        const hasReminder =
                            item.current &&
                            reminderDateSet.has(reminderDateKey);
                        const hasImportantReminder =
                            item.current &&
                            importantReminderDateSet.has(reminderDateKey);

                            const indicatorColors = [
                                ...eventCategories.map(
                                    (category) => EVENT_CATEGORY_COLORS[category].accent
                                ),
                                ...(hasImportantReminder
                                    ? [IMPORTANT_CATEGORY_COLORS.accent]
                                    : []),
                                ...(hasReminder ? ["#22C55E"] : []),
                            ];
                            
                            const visibleIndicators = indicatorColors.slice(0, 3);
                            const remainingIndicators = indicatorColors.length - 3;
                        return (
                            <View
                                key={dayIndex}
                                className="flex-1 p-[2px]"
                            >
                                <Pressable
                                    disabled={!item.current}
                                    onPress={() => onSelectDate(item.date)}
                                    className={`h-[76px] overflow-hidden rounded-xl border p-2 ${
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

                                    {item.current && indicatorColors.length > 0 && (
                                        <View className="mt-auto items-center gap-1">
                                            {visibleIndicators.map((color, index) => (
                                                <View
                                                    key={index}
                                                    className="mx-1 h-[6px] w-full rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}

                                            {remainingIndicators > 0 && (
                                                <Text className="text-[9px] font-bold text-slate-500">
                                                    +{remainingIndicators}
                                                </Text>
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
