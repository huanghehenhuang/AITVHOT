-- One-shot magic-link tokens, hashed at rest; also the rate-limit ledger (recent rows per email,
-- per sending IP, and in all). Spent rows stay a week and then the worker's users.cleanup removes them.
CREATE TABLE login_tokens (
  id_hash text PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
