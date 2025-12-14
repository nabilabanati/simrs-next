import { useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return initial;
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : initial;
    });

    const set = (val: T) => {
        setValue(val);
        if (typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(val));
        }
    };

    return [value, set] as const;
}
