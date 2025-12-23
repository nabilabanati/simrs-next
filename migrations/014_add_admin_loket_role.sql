-- Migration: Add admin_loket role to users table
-- This migration updates the role CHECK constraint to include the new admin_loket role

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new CHECK constraint with admin_loket included
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('superadmin', 'admin', 'dokter', 'nurse', 'loket', 'admin_loket', 'farmasi', 'kasir'));

-- Step 3: Verify the constraint
-- You can check with: SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check';

-- Note: This migration is safe to run multiple times (idempotent)
