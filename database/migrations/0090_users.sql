-- Visitor accounts: email magic links and Google OAuth sign into this one table. The email is
-- lowercase (the sign-in flows normalize it); a Google sign-in may adopt a same-email account.
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  email text UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  display_name text,
  avatar_url text,
  google_sub text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
