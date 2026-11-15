-- AyurvedSiddhi PHASE 5 ONLY. Never attach or import previous question DBs.
-- All local identifiers below are mapping-only and NOT source IDs.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tag_categories (
  local_tag_id TEXT PRIMARY KEY,
  display_order INTEGER NOT NULL UNIQUE CHECK(display_order BETWEEN 1 AND 6),
  label_source_exact TEXT NOT NULL UNIQUE,
  expected_count INTEGER NOT NULL CHECK(expected_count >= 0),
  native_tag_id TEXT,
  source_path_verified TEXT,
  source_access_state TEXT NOT NULL DEFAULT 'unknown' CHECK(source_access_state IN ('unknown','authorized','restricted','unavailable')),
  ingestion_status TEXT NOT NULL DEFAULT 'mapping_only' CHECK(ingestion_status IN ('mapping_only','discovered','partial','verified','blocked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tag_native_id ON tag_categories(native_tag_id) WHERE native_tag_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fetch_runs (
  run_id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','complete','partial','failed','blocked')),
  observed_app_version TEXT,
  source_entrypoint_verified TEXT,
  fetched_pages INTEGER NOT NULL DEFAULT 0,
  questions_discovered INTEGER NOT NULL DEFAULT 0,
  questions_validated INTEGER NOT NULL DEFAULT 0,
  exception_summary TEXT
);

CREATE TABLE IF NOT EXISTS api_evidence (
  evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT REFERENCES fetch_runs(run_id),
  local_tag_id TEXT REFERENCES tag_categories(local_tag_id),
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  redacted_host_path TEXT NOT NULL,
  observed_http_method TEXT NOT NULL,
  request_schema_redacted TEXT,
  response_schema_redacted TEXT,
  pagination_evidence TEXT,
  source_native_tag_id TEXT,
  response_checksum_sha256 TEXT,
  source_app_version TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS fetch_pages (
  page_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  local_tag_id TEXT NOT NULL REFERENCES tag_categories(local_tag_id),
  evidence_id INTEGER REFERENCES api_evidence(evidence_id),
  cursor_or_page_redacted TEXT,
  request_fingerprint_sha256 TEXT NOT NULL,
  response_checksum_sha256 TEXT,
  source_advertised_count INTEGER,
  returned_count INTEGER CHECK(returned_count IS NULL OR returned_count >= 0),
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK(status IN ('success','retried','failed','blocked')),
  UNIQUE (run_id,local_tag_id,request_fingerprint_sha256)
);

CREATE TABLE IF NOT EXISTS tag_questions (
  question_uid TEXT PRIMARY KEY,
  source_namespace TEXT NOT NULL,
  source_question_id TEXT NOT NULL,
  stem_source_raw TEXT NOT NULL CHECK(length(trim(stem_source_raw)) > 0),
  source_question_type TEXT,
  structure_source_json TEXT,   -- matching/numerical/statement structures if source provides them
  answer_source_json TEXT,      -- source-authenticated answer only; do not guess
  explanation_source_raw TEXT,
  language_source TEXT,
  source_payload_sha256 TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK(validation_status IN ('pending','ready','quarantined','blocked')),
  answer_status TEXT NOT NULL DEFAULT 'unverified' CHECK(answer_status IN ('unverified','source_verified','absent','contradictory')),
  created_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  evidence_id INTEGER REFERENCES api_evidence(evidence_id),
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_namespace, source_question_id)
);

CREATE TABLE IF NOT EXISTS question_tag_assignments (
  question_uid TEXT NOT NULL REFERENCES tag_questions(question_uid) ON DELETE RESTRICT,
  local_tag_id TEXT NOT NULL REFERENCES tag_categories(local_tag_id) ON DELETE RESTRICT,
  source_assignment_proof TEXT NOT NULL,
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_uid,local_tag_id)
);
CREATE INDEX IF NOT EXISTS idx_tag_assignments ON question_tag_assignments(local_tag_id,question_uid);

CREATE TABLE IF NOT EXISTS question_options (
  question_uid TEXT NOT NULL REFERENCES tag_questions(question_uid) ON DELETE RESTRICT,
  option_position INTEGER NOT NULL CHECK(option_position >= 1),
  source_option_id TEXT,
  option_source_raw TEXT,
  option_media_json TEXT,
  is_correct_verified INTEGER CHECK(is_correct_verified IS NULL OR is_correct_verified IN (0,1)),
  PRIMARY KEY (question_uid, option_position),
  CHECK(option_source_raw IS NOT NULL OR option_media_json IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS question_media (
  media_uid TEXT PRIMARY KEY,
  question_uid TEXT NOT NULL REFERENCES tag_questions(question_uid) ON DELETE RESTRICT,
  kind TEXT NOT NULL,       -- stem, option, explanation, attachment
  source_media_id TEXT,
  protected_source_reference TEXT,
  permitted_storage_ref TEXT,
  mime_type TEXT,
  content_sha256 TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK(is_verified IN (0,1)),
  access_policy TEXT
);

CREATE TABLE IF NOT EXISTS quarantined_items (
  quarantine_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT REFERENCES fetch_runs(run_id),
  local_tag_id TEXT REFERENCES tag_categories(local_tag_id),
  source_question_id TEXT,
  source_payload_sha256 TEXT,
  reason_code TEXT NOT NULL,
  detail_redacted TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','blocked')),
  logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Count ready, verified source-assigned QUESTIONS per tag. This counts memberships,
-- not necessarily globally unique question identities across tags.
CREATE VIEW IF NOT EXISTS tag_ready_counts AS
SELECT c.local_tag_id, c.label_source_exact, c.expected_count,
  COUNT(q.question_uid) AS ready_count,
  c.expected_count - COUNT(q.question_uid) AS outstanding_count
FROM tag_categories c
LEFT JOIN question_tag_assignments a ON a.local_tag_id = c.local_tag_id
LEFT JOIN tag_questions q ON q.question_uid = a.question_uid
  AND q.validation_status = 'ready' AND q.answer_status = 'source_verified'
GROUP BY c.local_tag_id, c.label_source_exact, c.expected_count;
