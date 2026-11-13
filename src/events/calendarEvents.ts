import astronomyData from "./astronomyEvents.json";
import awarenessData from "./awarenessDays.json";
import culturalData from "./culturalEvents.json";
import federalHolidayData from "./federalHolidays.json";
import moonPhaseData from "./moonPhases.json";
import moonPhaseDates from "./moonPhaseDates.json";
import seasonData from "./seasons.json";
import type { EventPreferenceKey } from "../types/eventPreferences";

export type CalendarEventCategory =
    | "Federal holiday"
    | "Cultural event"
    | "Awareness day"
    | "Astronomy"
    | "Moon phase"
    | "Season";

export interface CalendarEvent {
    id: string;
    name: string;
    date: string;
    category: CalendarEventCategory;
    preferenceKey: EventPreferenceKey;
    description?: string;
    details?: string;
    extraInfo?: string;
    timeUtc?: string;
    symbol?: string;
}

interface EventRecord {
    id: string;
    name: string;
    date?: string;
    dates?: Record<string, string>;
    endDate?: string;
    startsAtUtc?: string;
    peakDate?: string;
    recurrence?: string;
    description?: string;
    details?: string;
    category?: string;
    observanceType?: string;
    type?: string;
    season?: string;
    eclipseType?: string;
    visibility?: string;
    actualDate?: string;
    isObservedDate?: boolean;
}

interface MoonPhaseOccurrence {
    id: string;
    phase: string;
    date: string;
    timeUtc: string;
}

const supportedYears = [2026, 2027, 2028, 2029, 2030];

function expandDateRange(startDate: string, endDate?: string): string[] {
    if (!endDate || endDate < startDate) return [startDate];

    const dates: string[] = [];
    const current = new Date(`${startDate}T00:00:00Z`);
    const last = new Date(`${endDate}T00:00:00Z`);

    while (current <= last) {
        dates.push(current.toISOString().slice(0, 10));
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
}

function getRecordDates(record: EventRecord): string[] {
    if (record.dates) return Object.values(record.dates);
    if (record.date) return [record.date];
    if (record.startsAtUtc) return [record.startsAtUtc.slice(0, 10)];

    if (record.recurrence === "yearly" && record.peakDate) {
        return supportedYears.map((year) => `${year}-${record.peakDate}`);
    }

    return [];
}

function formatExtraInfo(record: EventRecord): string | undefined {
    const parts = [
        record.observanceType?.replaceAll("_", " "),
        record.eclipseType ? `${record.eclipseType} eclipse` : undefined,
        record.season,
        record.visibility ? `Visible from ${record.visibility}` : undefined,
        record.isObservedDate && record.actualDate
            ? `Observed date; actual holiday date ${record.actualDate}`
            : undefined,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" · ") : undefined;
}

function normalizeRecords(
    records: EventRecord[],
    category: CalendarEventCategory,
    preferenceKey: EventPreferenceKey
): CalendarEvent[] {
    return records.flatMap((record) =>
        getRecordDates(record).flatMap((startDate) =>
            expandDateRange(startDate, record.endDate).map((date) => ({
                id: `${record.id}-${date}`,
                name: record.name,
                date,
                category,
                preferenceKey,
                description: record.description,
                details: record.details,
                extraInfo: formatExtraInfo(record),
            }))
        )
    );
}

const moonPhasesByName = new Map(
    moonPhaseData.map((phase) => [phase.name, phase])
);

const datedMoonPhases: CalendarEvent[] = (
    moonPhaseDates as MoonPhaseOccurrence[]
).flatMap((occurrence) => {
    const phase = moonPhasesByName.get(occurrence.phase);
    if (!phase) return [];

    return [{
        id: occurrence.id,
        name: `${phase.symbol} ${phase.name}`,
        date: occurrence.date,
        category: "Moon phase",
        preferenceKey: "moonPhases",
        description: phase.description,
        details: phase.details,
        extraInfo: `${phase.appearance} · ${phase.illumination}`,
        timeUtc: occurrence.timeUtc,
        symbol: phase.symbol,
    }];
});

export const calendarEvents: CalendarEvent[] = [
    ...normalizeRecords(
        federalHolidayData as EventRecord[],
        "Federal holiday",
        "federalHolidays"
    ),
    ...normalizeRecords(
        culturalData as EventRecord[],
        "Cultural event",
        "culturalEvents"
    ),
    ...normalizeRecords(
        awarenessData as EventRecord[],
        "Awareness day",
        "awarenessDays"
    ),
    ...normalizeRecords(
        astronomyData as EventRecord[],
        "Astronomy",
        "astronomyEvents"
    ),
    ...datedMoonPhases,
    ...normalizeRecords(seasonData as EventRecord[], "Season", "seasons"),
].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

export function getCalendarEventDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}
