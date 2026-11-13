import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEventPreferences } from "../context/EventPreferencesContext";

const PURPLE = "#7058E8";

type SettingRowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
};

function SettingRow({
    icon,
    title,
    description,
    value,
    onValueChange,
    disabled = false,
}: SettingRowProps) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={19} color="#656A80" />
            </View>

            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {description && (
                    <Text style={styles.settingDescription}>
                        {description}
                    </Text>
                )}
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: "#E4E5EB", true: "#C7BBFF" }}
                thumbColor={value ? PURPLE : "#FFFFFF"}
                ios_backgroundColor="#E4E5EB"
            />
        </View>
    );
}

type SectionProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
};

function Section({ title, description, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {description && (
                    <Text style={styles.sectionDescription}>
                        {description}
                    </Text>
                )}
            </View>

            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

export default function Settings() {
    const {
        preferences: eventSettings,
        ready: eventSettingsReady,
        setPreference,
    } = useEventPreferences();

    // Calendar preferences
    const [calendarSettings, setCalendarSettings] = useState({
        showAdjacentDates: true,
        showEventIndicators: true,
        highlightToday: true,
        showSeasonalHeader: true,
    });

    // Reminder preferences
    const [reminderSettings, setReminderSettings] = useState({
        enableReminders: true,
        reminderNotifications: true,
    });

    // Notification preferences
    const [notificationSettings, setNotificationSettings] = useState({
        eventNotifications: false,
        reminderNotifications: true,
    });

    const [weekStart, setWeekStart] = useState<"Sunday" | "Monday">("Sunday");

    const [theme, setTheme] = useState<"System" | "Light" | "Dark">("System");

    const updateCalendar = (
        key: keyof typeof calendarSettings,
        value: boolean
    ) => {
        setCalendarSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateReminders = (
        key: keyof typeof reminderSettings,
        value: boolean
    ) => {
        setReminderSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateNotifications = (
        key: keyof typeof notificationSettings,
        value: boolean
    ) => {
        setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar style="dark" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.headerSubtitle}>
                            Customize your calendar experience
                        </Text>
                    </View>

                    <View style={styles.headerIcon}>
                        <Ionicons
                            name="settings-outline"
                            size={23}
                            color={PURPLE}
                        />
                    </View>
                </View>

                {/* Calendar Events */}
                <Section
                    title="Calendar Events"
                    description="Choose which events appear in your calendar."
                >
                    <SettingRow
                        icon="flag-outline"
                        title="Federal Holidays"
                        description="Official US federal holidays"
                        value={eventSettings.federalHolidays}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("federalHolidays", v)}
                    />
                    <Divider />

                    <SettingRow
                        icon="color-palette-outline"
                        title="Cultural Events"
                        description="Cultural and traditional celebrations"
                        value={eventSettings.culturalEvents}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("culturalEvents", v)}
                    />
                    <Divider />

                    <SettingRow
                        icon="globe-outline"
                        title="Awareness Days"
                        description="International and awareness observances"
                        value={eventSettings.awarenessDays}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("awarenessDays", v)}
                    />
                    <Divider />

                    <SettingRow
                        icon="moon-outline"
                        title="Moon Phases"
                        description="New moon, full moon and other phases"
                        value={eventSettings.moonPhases}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("moonPhases", v)}
                    />
                    <Divider />

                    <SettingRow
                        icon="leaf-outline"
                        title="Seasons"
                        description="Astronomical seasonal changes"
                        value={eventSettings.seasons}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("seasons", v)}
                    />
                    <Divider />

                    <SettingRow
                        icon="telescope-outline"
                        title="Astronomy Events"
                        description="Eclipses and meteor showers"
                        value={eventSettings.astronomyEvents}
                        disabled={!eventSettingsReady}
                        onValueChange={(v) => setPreference("astronomyEvents", v)}
                    />
                </Section>

                {/* Calendar Preferences */}
                <Section
                    title="Calendar Preferences"
                    description="Adjust how your calendar is displayed."
                >
                    <View style={styles.optionRow}>
                        <View style={styles.optionInfo}>
                            <Text style={styles.settingTitle}>
                                Start Week On
                            </Text>
                            <Text style={styles.settingDescription}>
                                Choose the first day of your week
                            </Text>
                        </View>

                        <View style={styles.segmentedControl}>
                            {(["Sunday", "Monday"] as const).map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    onPress={() => setWeekStart(day)}
                                    style={[
                                        styles.segment,
                                        weekStart === day &&
                                            styles.segmentActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.segmentText,
                                            weekStart === day &&
                                                styles.segmentTextActive,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Divider />

                    <SettingRow
                        icon="calendar-outline"
                        title="Adjacent Month Dates"
                        description="Show dates from previous and next months"
                        value={calendarSettings.showAdjacentDates}
                        onValueChange={(v) =>
                            updateCalendar("showAdjacentDates", v)
                        }
                    />
                    <Divider />

                    <SettingRow
                        icon="ellipse-outline"
                        title="Event Indicators"
                        description="Show small markers below calendar dates"
                        value={calendarSettings.showEventIndicators}
                        onValueChange={(v) =>
                            updateCalendar("showEventIndicators", v)
                        }
                    />
                    <Divider />

                    <SettingRow
                        icon="today-outline"
                        title="Highlight Today"
                        description="Highlight the current date"
                        value={calendarSettings.highlightToday}
                        onValueChange={(v) =>
                            updateCalendar("highlightToday", v)
                        }
                    />
                    <Divider />

                    <SettingRow
                        icon="image-outline"
                        title="Seasonal Header"
                        description="Show seasonal images in the calendar header"
                        value={calendarSettings.showSeasonalHeader}
                        onValueChange={(v) =>
                            updateCalendar("showSeasonalHeader", v)
                        }
                    />
                </Section>

                {/* Reminders */}
                <Section
                    title="Reminders"
                    description="Manage your personal reminders."
                >
                    <SettingRow
                        icon="alarm-outline"
                        title="Enable Reminders"
                        description="Show your personal reminders in the calendar"
                        value={reminderSettings.enableReminders}
                        onValueChange={(v) =>
                            updateReminders("enableReminders", v)
                        }
                    />
                    <Divider />

                    <SettingRow
                        icon="notifications-outline"
                        title="Reminder Notifications"
                        description="Receive notifications for your reminders"
                        value={reminderSettings.reminderNotifications}
                        onValueChange={(v) =>
                            updateReminders("reminderNotifications", v)
                        }
                    />
                </Section>

                {/* Notifications */}
                <Section
                    title="Notifications"
                    description="Choose which notifications you receive."
                >
                    <SettingRow
                        icon="calendar-clear-outline"
                        title="Event Notifications"
                        description="Get notified about upcoming calendar events"
                        value={notificationSettings.eventNotifications}
                        onValueChange={(v) =>
                            updateNotifications("eventNotifications", v)
                        }
                    />
                    <Divider />

                    <SettingRow
                        icon="notifications-outline"
                        title="Reminder Alerts"
                        description="Receive alerts before scheduled reminders"
                        value={notificationSettings.reminderNotifications}
                        onValueChange={(v) =>
                            updateNotifications("reminderNotifications", v)
                        }
                    />
                </Section>

                {/* Appearance */}
                <Section
                    title="Appearance"
                    description="Personalize the look of your calendar."
                >
                    <View style={styles.optionRow}>
                        <View style={styles.settingIcon}>
                            <Ionicons
                                name="contrast-outline"
                                size={19}
                                color="#656A80"
                            />
                        </View>

                        <View style={styles.optionInfo}>
                            <Text style={styles.settingTitle}>Theme</Text>
                            <Text style={styles.settingDescription}>
                                Choose your preferred appearance
                            </Text>
                        </View>
                    </View>

                    <View style={styles.themeOptions}>
                        {(["System", "Light", "Dark"] as const).map(
                            (option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => setTheme(option)}
                                    style={[
                                        styles.themeButton,
                                        theme === option &&
                                            styles.themeButtonActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            option === "System"
                                                ? "phone-portrait-outline"
                                                : option === "Light"
                                                  ? "sunny-outline"
                                                  : "moon-outline"
                                        }
                                        size={17}
                                        color={
                                            theme === option
                                                ? PURPLE
                                                : "#777B8E"
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.themeText,
                                            theme === option &&
                                                styles.themeTextActive,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </Section>

                {/* About */}
                <Section title="About">
                    <TouchableOpacity style={styles.aboutRow}>
                        <View style={styles.settingIcon}>
                            <Ionicons
                                name="information-circle-outline"
                                size={19}
                                color="#656A80"
                            />
                        </View>
                        <Text style={styles.settingTitle}>About Calendar</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#A0A3B2"
                        />
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity style={styles.aboutRow}>
                        <View style={styles.settingIcon}>
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={19}
                                color="#656A80"
                            />
                        </View>
                        <Text style={styles.settingTitle}>Privacy Policy</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#A0A3B2"
                        />
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity style={styles.aboutRow}>
                        <View style={styles.settingIcon}>
                            <Ionicons
                                name="share-social-outline"
                                size={19}
                                color="#656A80"
                            />
                        </View>
                        <Text style={styles.settingTitle}>Share App</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#A0A3B2"
                        />
                    </TouchableOpacity>
                </Section>

                <Text style={styles.versionText}>Calendar · Version 1.0.0</Text>
                <Text style={styles.footerText}>
                    Made to keep your days organized.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8FC",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 35,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#20243A",
        letterSpacing: -0.6,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#85899B",
        marginTop: 5,
    },
    headerIcon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: "#EFECFF",
        justifyContent: "center",
        alignItems: "center",
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        marginBottom: 12,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#292D43",
    },
    sectionDescription: {
        fontSize: 12,
        color: "#9295A5",
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "#F0F0F5",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 67,
        paddingVertical: 10,
    },
    settingIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F5F4FA",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
        paddingRight: 8,
    },
    settingTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#303449",
    },
    settingDescription: {
        fontSize: 11,
        color: "#9295A5",
        marginTop: 4,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F4",
        marginLeft: 50,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 66,
    },
    optionInfo: {
        flex: 1,
    },
    segmentedControl: {
        flexDirection: "row",
        backgroundColor: "#F4F3F8",
        padding: 3,
        borderRadius: 10,
    },
    segment: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: "#FFFFFF",
    },
    segmentText: {
        fontSize: 11,
        color: "#85899B",
        fontWeight: "500",
    },
    segmentTextActive: {
        color: PURPLE,
        fontWeight: "700",
    },
    themeOptions: {
        flexDirection: "row",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 12,
    },
    themeButton: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingVertical: 11,
        borderRadius: 11,
        backgroundColor: "#F7F7FA",
        borderWidth: 1,
        borderColor: "#F0F0F4",
    },
    themeButtonActive: {
        backgroundColor: "#F0EDFF",
        borderColor: "#DCD5FF",
    },
    themeText: {
        fontSize: 11,
        color: "#85899B",
        fontWeight: "600",
    },
    themeTextActive: {
        color: PURPLE,
    },
    aboutRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 57,
    },
    versionText: {
        textAlign: "center",
        fontSize: 12,
        color: "#85899B",
        marginTop: 5,
    },
    footerText: {
        textAlign: "center",
        fontSize: 11,
        color: "#B0B2BE",
        marginTop: 6,
    },
});
