CREATE TABLE IF NOT EXISTS publication_translations (
  source_hash text NOT NULL,
  language text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  receipt_id bigint REFERENCES receipts(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, language)
);
