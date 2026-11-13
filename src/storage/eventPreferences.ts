import Storage from "expo-sqlite/kv-store";
import {
    DEFAULT_EVENT_PREFERENCES,
    type EventPreferences,
} from "../types/eventPreferences";

const EVENT_PREFERENCES_STORAGE_KEY = "modern-calendar:event-preferences:v1";

export async function loadEventPreferences(): Promise<EventPreferences> {
    const serialized = await Storage.getItem(EVENT_PREFERENCES_STORAGE_KEY);
    if (!serialized) return DEFAULT_EVENT_PREFERENCES;

    const saved = JSON.parse(serialized) as Partial<EventPreferences>;
    const preferences = { ...DEFAULT_EVENT_PREFERENCES };

    for (const key of Object.keys(preferences) as (keyof EventPreferences)[]) {
        if (typeof saved[key] === "boolean") {
            preferences[key] = saved[key];
        }
    }

    return preferences;
}

export async function saveEventPreferences(
    preferences: EventPreferences
): Promise<void> {
    await Storage.setItem(
        EVENT_PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences)
    );
}
