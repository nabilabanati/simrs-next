import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

export function useFetch(url: string, deps: any[] = []) {
    const { token } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        async function load() {
            setLoading(true);
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await res.json();
            setData(json);
            setLoading(false);
        }

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading };
}
