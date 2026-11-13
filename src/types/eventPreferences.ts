export interface EventPreferences {
    federalHolidays: boolean;
    culturalEvents: boolean;
    awarenessDays: boolean;
    moonPhases: boolean;
    seasons: boolean;
    astronomyEvents: boolean;
}

export type EventPreferenceKey = keyof EventPreferences;

export const DEFAULT_EVENT_PREFERENCES: EventPreferences = {
    federalHolidays: true,
    culturalEvents: true,
    awarenessDays: true,
    moonPhases: false,
    seasons: true,
    astronomyEvents: false,
};
