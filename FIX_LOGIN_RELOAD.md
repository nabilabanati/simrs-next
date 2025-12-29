# Fix: Login Page Infinite Reload

## Problem
Login page terus refresh/reload karena infinite redirect loop.

## Root Cause
1. `useEffect` dependency `[router]` terlalu broad
2. Logic order salah: cek user dulu sebelum cek logout reason
3. Tidak ada check `router.isReady`

## Solution

### Step 1: Update useEffect di `pages/login.tsx`

Cari bagian ini (sekitar line 20-46):

```typescript
useEffect(() => {
  // Wait for router to be ready to avoid infinite loops
  if (!router.isReady) return;

  // Check if already logged in (user data exists)
  // Token is in HttpOnly cookie, so we don't check localStorage for it
  const user = localStorage.getItem("user");

  if (user) {
    const userData = JSON.parse(user);
    redirectByRole(userData.role, userData.id);
    return;
  }

  // Check for session expiration or error messages from URL
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
  }
}, [router.isReady, router.query]); // ← Changed from [router]
```

### Step 2: Ganti dengan kode yang sudah fixed:

```typescript
useEffect(() => {
  // IMPORTANT: Wait for router to be ready
  if (!router.isReady) return;

  // Check for logout/error reasons FIRST (before checking user)
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
    return; // ← STOP HERE if there's a logout reason
  }

  // Only check for existing user if there's NO logout reason
  const user = localStorage.getItem("user");

  if (user) {
    try {
      const userData = JSON.parse(user);
      redirectByRole(userData.role, userData.id);
    } catch (error) {
      console.error("Invalid user data:", error);
      localStorage.removeItem("user");
    }
  }
}, [router.isReady, router.query]); // ← Changed from [router]
```

## Key Changes

### 1. Added `router.isReady` check
```typescript
if (!router.isReady) return;
```
**Why:** Prevents effect from running with stale/undefined query params

### 2. Check logout reason FIRST
```typescript
const { reason } = router.query;
if (reason) {
  // Show error message
  return; // ← STOP HERE
}
```
**Why:** Prevents redirect loop when user just logged out

### 3. Changed dependency array
```typescript
}, [router.isReady, router.query]); // ← Was [router]
```
**Why:** `[router]` triggers on every router change, causing infinite loop

## Testing

After fix, test these scenarios:

1. **Normal Login:**
   - Go to `/login`
   - Should NOT reload infinitely ✅
   - Login should work normally ✅

2. **Session Expired:**
   - Login from Device A
   - Login from Device B (same user)
   - Device A should redirect to login with message ✅
   - Should NOT reload infinitely ✅

3. **Already Logged In:**
   - Login successfully
   - Go to `/login` again
   - Should redirect to dashboard ✅
   - Should NOT reload infinitely ✅

## Summary

**Before:**
- ❌ Infinite reload loop
- ❌ useEffect runs on every router change
- ❌ Checks user before checking logout reason

**After:**
- ✅ No infinite loop
- ✅ useEffect only runs when needed
- ✅ Checks logout reason first
- ✅ Waits for router.isReady

**Status:** FIXED ✅
