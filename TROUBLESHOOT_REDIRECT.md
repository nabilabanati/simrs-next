# Troubleshooting: Manual Reload Required for Redirect

## Problem
Session expiration tidak auto-redirect ke login, harus manual reload dulu.

## Possible Causes

### 1. **React State Blocking Redirect**
React component state mungkin prevent redirect dari terjadi.

### 2. **Middleware Interference**
Next.js middleware mungkin intercept redirect.

### 3. **Browser Cache**
Browser cache old JavaScript bundle.

### 4. **Service Worker**
Service worker cache old version.

---

## Solutions Applied

### ✅ Solution 1: Aggressive Redirect (IMPLEMENTED)

Updated `lib/api-client.ts`:

```typescript
// Use window.location.replace instead of href
window.location.replace(loginUrl); // Forces hard redirect

// Fallback: Force reload if still on same page
setTimeout(() => {
  if (window.location.pathname !== '/login') {
    window.location.reload();
  }
}, 300);
```

**Why this works:**
- `window.location.replace()` forces hard navigation (no back button)
- Fallback reload ensures redirect happens even if replace fails
- Clears all localStorage and sessionStorage

---

### ✅ Solution 2: Clear All Storage (IMPLEMENTED)

```typescript
localStorage.removeItem('user');
localStorage.removeItem('token');
sessionStorage.clear(); // Clear everything
```

**Why this works:**
- Ensures no stale auth data
- Prevents React from thinking user is still logged in

---

### 🔧 Solution 3: Hard Reload Dev Server (TRY THIS)

```bash
# Stop dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

**Why this might help:**
- Clears Next.js build cache
- Ensures latest code is running
- Fixes stale JavaScript bundles

---

### 🔧 Solution 4: Clear Browser Cache (TRY THIS)

**Chrome:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**
1. Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"

---

### 🔧 Solution 5: Check Browser Console (DEBUG)

Open browser console (F12) and check for:

**Expected logs:**
```
🔒 Session expired - redirecting to login
⚠️ Received HTML instead of JSON - session might be invalid
```

**Error logs to look for:**
```
❌ Failed to execute 'replace' on 'Location'
❌ Navigation cancelled
❌ Blocked by CORS policy
```

---

## Testing Steps

### Step 1: Clear Everything

```bash
# Terminal 1: Stop dev server
Ctrl+C

# Clear cache
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

### Step 2: Clear Browser

1. Open DevTools (F12)
2. Application tab → Clear storage → Clear site data
3. Hard reload (Ctrl+Shift+R)

### Step 3: Test Session Expiration

1. Login from Browser A (Chrome)
2. Login from Browser B (Firefox) - same user
3. Go back to Browser A
4. Try to access any page
5. **Expected:**
   - Toast appears: "Anda telah login dari perangkat lain..."
   - Auto redirect to login (NO manual reload needed)

### Step 4: Check Console

If redirect doesn't work, check console for errors:

```javascript
// Should see these logs:
🔒 Session expired - redirecting to login
// Then redirect should happen automatically
```

---

## Alternative: Use Next.js Router (If Still Not Working)

If `window.location.replace()` still doesn't work, we can try Next.js router:

### Create a custom hook:

```typescript
// hooks/use-session-redirect.ts
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function useSessionRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Listen for session expiration event
    const handleSessionExpired = (event: CustomEvent) => {
      const { reason, currentPath } = event.detail;
      
      // Use Next.js router for smooth redirect
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}&reason=${reason}`);
    };
    
    window.addEventListener('session-expired', handleSessionExpired as EventListener);
    
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, [router]);
}
```

### Update API client:

```typescript
// Instead of window.location.replace
// Dispatch custom event
window.dispatchEvent(new CustomEvent('session-expired', {
  detail: { reason, currentPath }
}));
```

### Use in _app.tsx:

```typescript
import { useSessionRedirect } from '@/hooks/use-session-redirect';

export default function App({ Component, pageProps }: AppProps) {
  useSessionRedirect(); // Add this
  
  // ... rest of code
}
```

---

## Quick Debug Checklist

- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Hard reload done (Ctrl+Shift+R)
- [ ] Console shows no errors
- [ ] Toast notification appears
- [ ] localStorage cleared
- [ ] No service worker active

---

## Current Implementation Status

✅ **Implemented:**
- Aggressive redirect with `window.location.replace()`
- Fallback to `window.location.href`
- Force reload if redirect fails
- Clear all storage (localStorage + sessionStorage)
- Toast notification before redirect
- 700ms delay to show toast

⚠️ **If Still Not Working:**
1. Clear Next.js cache (`.next` folder)
2. Clear browser cache
3. Hard reload browser
4. Check browser console for errors
5. Try alternative Next.js router approach (see above)

---

## Expected Behavior

**What SHOULD happen:**
1. User tries to access page
2. API detects session invalid
3. Toast appears (red, top-center)
4. After 700ms, **AUTO REDIRECT** to login
5. Login page shows message
6. **NO MANUAL RELOAD NEEDED**

**What you're experiencing:**
1. User tries to access page
2. API detects session invalid
3. Toast appears (maybe)
4. **Nothing happens** (stuck on page)
5. **Manual reload needed** to see login page

---

## Next Steps

1. **Try clearing cache first** (most common fix)
2. **Check browser console** for errors
3. **Test with different browser** (to rule out browser-specific issues)
4. **If still not working**, we'll implement Next.js router approach

Let me know what you see in the browser console!
