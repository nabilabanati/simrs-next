# Supabase Database Setup

## 1. Run Migrations (in order)

Execute these SQL scripts in your Supabase SQL Editor:

### Migration 1: Add is_active column
```sql
-- File: add_is_active_to_users.sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE public.users SET is_active = true WHERE is_active IS NULL;
```

### Migration 2: Insert Super Admin
```sql
-- File: 001_insert_superadmin.sql
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES (
  'superadmin', 
  '$2b$10$v5yhOGDBU.ZQnk/CCYHM4eP2IjYyYtrw62DI0Uv40ogbcXsp9z4A6', 
  'Super Administrator', 
  'superadmin', 
  true
)
ON CONFLICT (username) DO NOTHING;
```

## 2. Test Login Credentials

**Super Admin:**
- Username: `superadmin`
- Password: `passsuperadmin`

## 3. Verify User Created

```sql
SELECT id, username, nama, role, is_active, created_at
FROM public.users 
WHERE username = 'superadmin';
```

Expected result:
- username: `superadmin`
- nama: `Super Administrator`
- role: `superadmin`
- is_active: `true`

## 4. Generate More Users (Optional)

Use Node.js to generate bcrypt hashes for other test users:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10, (err, hash) => console.log(hash));"
```

Then insert manually:
```sql
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('yourusername', 'HASH_FROM_ABOVE', 'Full Name', 'dokter', true);
```

## Notes

- ✅ All passwords are now hashed with bcrypt (rounds: 10)
- ✅ Login API updated to use `bcrypt.compare()`
- ✅ Super Admin account is created with `is_active = true`
- ⚠️ Never use plain text passwords in production
