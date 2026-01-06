/**
 * Quick Fix for Login Page Infinite Reload
 * 
 * Copy this useEffect to replace the existing one in pages/login.tsx
 */

useEffect(() => {
    // IMPORTANT: Wait for router to be ready
    // This prevents the effect from running with stale/undefined query params
    if (!router.isReady) return;

    // Check for error/logout reasons FIRST (before checking user)
    // This prevents redirect loop when user is logged out
    const { reason } = router.query;
    if (reason) {
        const messages: Record<string, string> = {
            session_expired: "Sesi Anda telah berakhir. Silakan login kembali.",
            session_invalidated: "Anda telah login dari perangkat lain. Silakan login kembali.",
            unauthorized: "Sesi Anda tidak valid. Silakan login kembali.",
            invalid_response: "Terjadi kesalahan. Silakan login kembali.",
        };

        const message = messages[reason as string];
        if (message) {
            setError(message);
        }
        return; // STOP HERE - don't check user if there's a logout reason
    }

    // Only check for existing user if there's NO logout reason
    const user = localStorage.getItem("user");

    if (user) {
        try {
            const userData = JSON.parse(user);
            redirectByRole(userData.role, userData.id);
        } catch (error) {
            // Invalid JSON in localStorage, clear it
            console.error("Invalid user data in localStorage:", error);
            localStorage.removeItem("user");
        }
    }
}, [router.isReady, router.query]); // Changed from [router] to prevent infinite loop
