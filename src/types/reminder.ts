export interface ReminderCategory {
    name: string;
    color: string;
    textColor: string;
}

export const IMPORTANT_CATEGORY_COLORS = {
    background: "#FEE2E2",
    text: "#DC2626",
    accent: "#FCA5A5",
};

export interface Reminder {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    category: ReminderCategory;
    dateKey: string;
    completed?: boolean;
}
