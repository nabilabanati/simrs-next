# Rate Limiting - Remaining Attempts Issue

## Issue yang Dilaporkan

"Remaining attempts kadang tidak akurat - sudah 3 kali tapi masih 2, atau dari 2 remaining tiba-tiba jadi 4 remaining"

## Root Cause

Ini terjadi karena **username yang berbeda = counter yang berbeda**.

### Contoh dari Log:

```
🔍 Login attempt: imesh from ::1 (3 attempts remaining)
🚫 Failed login attempt 3/5 for imesh from ::1

🔍 Login attempt: imesh9 from ::1 (5 attempts remaining)  ← BEDA USERNAME!
🚫 Failed login attempt 1/5 for imesh9 from ::1

🔍 Login attempt: imesh from ::1 (2 attempts remaining)  ← KEMBALI KE imesh
🚫 Failed login attempt 4/5 for imesh from ::1
```

**Penjelasan:**
- `imesh` → Counter sendiri (attempt 3, 4, ...)
- `imesh9` → Counter baru (attempt 1, ...)
- `imeshoo` → Counter baru (attempt 1, ...)

**Ini BUKAN bug!** Ini adalah **fitur** - setiap kombinasi IP + Username punya counter sendiri.

---

## Kenapa Desain Seperti Ini?

### Scenario 1: Satu Counter untuk Semua Username (BAD)
```
User A coba login:
- Username: kasir1, Password: wrong → Attempt 1
- Username: kasir1, Password: wrong → Attempt 2
- Username: kasir1, Password: wrong → Attempt 3
- Username: kasir1, Password: wrong → Attempt 4
- Username: kasir1, Password: wrong → Attempt 5
- BLOCKED!

User B (legitimate) coba login:
- Username: loket1, Password: correct → BLOCKED! ❌
  (Karena IP sama, counter sudah 5)

MASALAH: User B kena block gara-gara User A!
```

### Scenario 2: Counter Per IP + Username (GOOD) ✅
```
User A coba login:
- Username: kasir1, Password: wrong → kasir1 counter: 1
- Username: kasir1, Password: wrong → kasir1 counter: 2
- Username: kasir1, Password: wrong → kasir1 counter: 3
- Username: kasir1, Password: wrong → kasir1 counter: 4
- Username: kasir1, Password: wrong → kasir1 counter: 5
- kasir1 BLOCKED!

User B (legitimate) coba login:
- Username: loket1, Password: correct → loket1 counter: 0
- LOGIN SUCCESS! ✅

BAGUS: User B tidak terpengaruh oleh User A!
```

---

## Test yang Benar

### ❌ Test yang Salah (Ganti-ganti Username):
```
Attempt 1: imesh + wrong → 4 remaining
Attempt 2: imesh9 + wrong → 4 remaining  ← Beda username!
Attempt 3: imeshoo + wrong → 4 remaining ← Beda username!
Attempt 4: imes + wrong → 4 remaining    ← Beda username!

"Kok tidak berkurang?" → Karena username beda-beda!
```

### ✅ Test yang Benar (Username Sama):
```
Attempt 1: imesho + wrong1 → 4 attempts remaining
Attempt 2: imesho + wrong2 → 3 attempts remaining
Attempt 3: imesho + wrong3 → 2 attempts remaining
Attempt 4: imesho + wrong4 → 1 attempt remaining
Attempt 5: imesho + wrong5 → 0 attempts remaining
Attempt 6: imesho + wrong6 → 🚫 BLOCKED! (429)

"Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 5 menit."
```

---

## Cara Test Manual

### Step 1: Pilih Username yang Konsisten
```bash
# Gunakan username yang SAMA untuk semua attempts
TEST_USERNAME="testuser123"
```

### Step 2: Coba 5x dengan Password Salah
```bash
# Attempt 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"wrong1"}'

# Response: "Invalid credentials. 4 attempts remaining."

# Attempt 2
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"wrong2"}'

# Response: "Invalid credentials. 3 attempts remaining."

# ... dan seterusnya
```

### Step 3: Attempt ke-6 Harus Blocked
```bash
# Attempt 6
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"wrong6"}'

# Response (429): "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 5 menit."
```

---

## Automated Test Script

Gunakan script yang sudah saya buat:

```bash
node test-rate-limiting.js
```

Script ini akan:
1. Test dengan username yang SAMA
2. Verify remaining attempts berkurang
3. Verify lockout setelah 5 attempts

---

## Monitoring di Production

### Log Format:
```
🔍 Login attempt: {username} from {ip} ({remaining} attempts remaining)
🚫 Failed login attempt {current}/{max} for {username} from {ip}
```

### Contoh Normal (Username Sama):
```
🔍 Login attempt: kasir1 from 192.168.1.100 (5 attempts remaining)
🚫 Failed login attempt 1/5 for kasir1 from 192.168.1.100

🔍 Login attempt: kasir1 from 192.168.1.100 (4 attempts remaining)
🚫 Failed login attempt 2/5 for kasir1 from 192.168.1.100

🔍 Login attempt: kasir1 from 192.168.1.100 (3 attempts remaining)
🚫 Failed login attempt 3/5 for kasir1 from 192.168.1.100
```

### Contoh Attack (Username Beda-beda):
```
🔍 Login attempt: kasir1 from 192.168.1.100 (5 attempts remaining)
🚫 Failed login attempt 1/5 for kasir1 from 192.168.1.100

🔍 Login attempt: kasir2 from 192.168.1.100 (5 attempts remaining)
🚫 Failed login attempt 1/5 for kasir2 from 192.168.1.100

🔍 Login attempt: kasir3 from 192.168.1.100 (5 attempts remaining)
🚫 Failed login attempt 1/5 for kasir3 from 192.168.1.100

← Ini adalah ATTACK PATTERN!
  Hacker coba banyak username berbeda
```

---

## Summary

**Remaining attempts "tidak konsisten" karena:**
- ✅ Setiap username punya counter sendiri
- ✅ Ini adalah FITUR, bukan bug
- ✅ Mencegah satu user memblokir user lain

**Cara test yang benar:**
- ✅ Gunakan username yang SAMA untuk semua attempts
- ✅ Lihat remaining berkurang: 5 → 4 → 3 → 2 → 1 → 0 → BLOCKED

**Rate limiting bekerja dengan sempurna!** ✅

---

## Next Steps

Jika ingin monitoring yang lebih baik:

### Option 1: Add IP-Level Rate Limiting (Additional)
```typescript
// Limit per IP (regardless of username)
// Max 20 attempts per IP per 5 minutes
// Prevents attacker from trying many usernames
```

### Option 2: Add Dashboard
```typescript
// Admin dashboard to see:
// - Active rate limit entries
// - Locked accounts
// - Suspicious patterns (many different usernames from same IP)
```

### Option 3: Alert on Suspicious Activity
```typescript
// Email admin if:
// - Same IP tries > 10 different usernames
// - Pattern indicates brute force attack
```

Tapi untuk sekarang, **rate limiting sudah bekerja dengan sempurna!** 🎉
