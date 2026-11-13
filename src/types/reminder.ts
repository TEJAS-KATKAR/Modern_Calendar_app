export interface ReminderCategory {
    name: string;
    color: string;
    textColor: string;
}

export const IMPORTANT_CATEGORY_COLORS = {
    background: "#DBEAFE",
    text: "#3B82F6",
};

export interface Reminder {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    category: ReminderCategory;
    dateKey: string;
}
