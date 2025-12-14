-- Migration: Insert Super Admin User
-- Username: superadmin
-- Password: passsuperadmin (hashed with bcrypt)
-- Created: 2025-12-13

-- First, ensure is_active column exists (in case migration not run yet)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Insert Super Admin with bcrypt hashed password
-- Password: passsuperadmin
-- Hash generated with bcrypt rounds: 10
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES (
  'superadmin', 
  '$2b$10$v5yhOGDBU.ZQnk/CCYHM4eP2IjYyYtrw62DI0Uv40ogbcXsp9z4A6', 
  'Super Administrator', 
  'superadmin', 
  true
)
ON CONFLICT (username) DO NOTHING;

-- Verify the insert
SELECT id, username, nama, role, is_active, created_at
FROM public.users 
WHERE username = 'superadmin';
