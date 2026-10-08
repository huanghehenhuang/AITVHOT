-- The source cost overview reads live attempts across services in a time window. The existing
-- service-first index serves budgets; this one avoids scanning the entire receipt history.
CREATE INDEX receipt_attempts_live_time_idx ON receipt_attempts (started_at, receipt_id) WHERE origin = 'live';
