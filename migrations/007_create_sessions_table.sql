-- Migration: Create sessions table for session management
-- Purpose: Track active user sessions and enable single-session-per-user enforcement

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, expires_at);

-- Comment
COMMENT ON TABLE sessions IS 'Tracks active user sessions for authentication and single-session enforcement';
COMMENT ON COLUMN sessions.session_token IS 'Unique token for this session (not the JWT)';
COMMENT ON COLUMN sessions.device_info IS 'User agent string from login request';
COMMENT ON COLUMN sessions.ip_address IS 'IP address from login request';
COMMENT ON COLUMN sessions.is_active IS 'False when session is invalidated (logout or new login)';
