import { useState, useEffect } from "react";

/**
 * Hook that returns raw Date object updated every second.
 * Use this if you need Date object for manipulation.
 * For formatted date-time string, use useDateTime from './use-date-time'
 */
export function useDateTimeRaw() {
    const [dateTime, setDateTime] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setDateTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return dateTime;
}
