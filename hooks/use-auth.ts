import { useLocalStorage } from "./use-local-storage";

export function useAuth() {
    const [token, setToken] = useLocalStorage<string | null>("token", null);
    const [user, setUser] = useLocalStorage<any>("user", null);

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return { token, setToken, user, setUser, logout };
}
