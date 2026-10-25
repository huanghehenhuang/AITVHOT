CREATE INDEX CONCURRENTLY IF NOT EXISTS login_tokens_ip_created_idx ON login_tokens (created_ip, created_at);
