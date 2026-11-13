import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    DEFAULT_EVENT_PREFERENCES,
    type EventPreferenceKey,
    type EventPreferences,
} from "../types/eventPreferences";
import {
    loadEventPreferences,
    saveEventPreferences,
} from "../storage/eventPreferences";

interface EventPreferencesContextValue {
    preferences: EventPreferences;
    ready: boolean;
    setPreference: (key: EventPreferenceKey, value: boolean) => void;
}

const EventPreferencesContext =
    createContext<EventPreferencesContextValue | null>(null);

export function EventPreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState(DEFAULT_EVENT_PREFERENCES);
    const [ready, setReady] = useState(false);
    const preferencesRef = useRef(preferences);
    const saveQueue = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        let isMounted = true;

        loadEventPreferences()
            .then((savedPreferences) => {
                if (!isMounted) return;
                preferencesRef.current = savedPreferences;
                setPreferences(savedPreferences);
            })
            .catch((error) => {
                console.error("Failed to load event preferences", error);
            })
            .finally(() => {
                if (isMounted) setReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const setPreference = useCallback(
        (key: EventPreferenceKey, value: boolean) => {
            if (!ready) return;

            const nextPreferences = {
                ...preferencesRef.current,
                [key]: value,
            };
            preferencesRef.current = nextPreferences;
            setPreferences(nextPreferences);

            saveQueue.current = saveQueue.current
                .catch(() => undefined)
                .then(() => saveEventPreferences(nextPreferences))
                .catch((error) => {
                    console.error("Failed to save event preferences", error);
                });
        },
        [ready]
    );

    return (
        <EventPreferencesContext.Provider
            value={{ preferences, ready, setPreference }}
        >
            {children}
        </EventPreferencesContext.Provider>
    );
}

export function useEventPreferences() {
    const context = useContext(EventPreferencesContext);
    if (!context) {
        throw new Error(
            "useEventPreferences must be used inside EventPreferencesProvider"
        );
    }
    return context;
}
