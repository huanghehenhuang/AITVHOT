-- Visitor sessions: hashed opaque tokens like the admin's (0004), a separate table and cookie; the
-- binding is the per-request HMAC re-check, so a rotated SESSION_SECRET signs every session out.
CREATE TABLE user_sessions (
  id_hash text PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  user_agent text,
  auth_method text NOT NULL CHECK (auth_method IN ('magic', 'google')),
  auth_binding text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
