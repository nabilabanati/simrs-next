-- Migration: Create user_loket_assignment table
-- This table maps users to specific lokets they are allowed to access

-- Create the assignment table
CREATE TABLE IF NOT EXISTS public.user_loket_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  loket_id integer NOT NULL CHECK (loket_id BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Prevent duplicate assignments
  UNIQUE(user_id, loket_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_loket_assignment_user_id ON public.user_loket_assignment(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loket_assignment_loket_id ON public.user_loket_assignment(loket_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_loket_assignment IS 'Maps users with role loket to specific loket counters they can access';
COMMENT ON COLUMN public.user_loket_assignment.user_id IS 'User ID from users table';
COMMENT ON COLUMN public.user_loket_assignment.loket_id IS 'Loket counter number (1-5)';
COMMENT ON COLUMN public.user_loket_assignment.created_by IS 'Admin user who created this assignment';

-- Example: Assign user to loket
-- INSERT INTO public.user_loket_assignment (user_id, loket_id, created_by)
-- VALUES ('user-uuid-here', 1, 'admin-uuid-here');
