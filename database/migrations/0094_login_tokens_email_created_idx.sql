CREATE INDEX CONCURRENTLY IF NOT EXISTS login_tokens_email_created_idx ON login_tokens (email, created_at);
