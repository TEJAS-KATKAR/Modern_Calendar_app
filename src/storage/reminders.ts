import Storage from "expo-sqlite/kv-store";
import { IMPORTANT_CATEGORY_COLORS, type Reminder } from "../types/reminder";

const REMINDERS_STORAGE_KEY = "modern-calendar:reminders:v1";

type StoredReminder = Omit<Reminder, "startTime" | "endTime"> & {
    startTime: string;
    endTime: string;
};

export async function loadReminders(): Promise<Reminder[]> {
    const serialized = await Storage.getItem(REMINDERS_STORAGE_KEY);
    if (!serialized) return [];

    const stored = JSON.parse(serialized) as StoredReminder[];
    if (!Array.isArray(stored)) return [];

    return stored.map((reminder) => ({
        ...reminder,
        startTime: new Date(reminder.startTime),
        endTime: new Date(reminder.endTime),
        category:
            reminder.category.name === "Important"
                ? {
                      ...reminder.category,
                      color: IMPORTANT_CATEGORY_COLORS.background,
                      textColor: IMPORTANT_CATEGORY_COLORS.text,
                  }
                : reminder.category,
    }));
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
    const stored: StoredReminder[] = reminders.map((reminder) => ({
        ...reminder,
        startTime: reminder.startTime.toISOString(),
        endTime: reminder.endTime.toISOString(),
    }));

    await Storage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(stored));
}
