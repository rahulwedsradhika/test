-- AyurvedSiddhi Phase 7 Daily Tests: independent fresh SQLite database.
-- NEVER ATTACH or import old Samhitawise/Subjectwise/TestSeries/Tagwise/PYQ databases.
-- Seed ONLY 3 sessions; no test, question, answer or option records are supplied here.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS daily_sessions (
  local_session_id TEXT PRIMARY KEY,
  display_order INTEGER NOT NULL UNIQUE CHECK(display_order BETWEEN 1 AND 3),
  session_year TEXT NOT NULL UNIQUE,
  expected_test_listings_owner INTEGER NOT NULL CHECK(expected_test_listings_owner=250),
  expected_count_origin TEXT NOT NULL DEFAULT 'owner_provided',
  original_route_hint TEXT NOT NULL,
  route_verified INTEGER NOT NULL DEFAULT 0 CHECK(route_verified IN (0,1)),
  native_session_id TEXT,
  source_advertised_test_count INTEGER CHECK(source_advertised_test_count IS NULL OR source_advertised_test_count >= 0),
  ingestion_status TEXT NOT NULL DEFAULT 'mapping_only' CHECK(ingestion_status IN ('mapping_only','discovered','partial','verified','blocked')),
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fetch_runs (
  run_id TEXT PRIMARY KEY,
  run_started_at TEXT NOT NULL,
  run_finished_at TEXT,
  app_version_observed TEXT,
  api_host_redacted TEXT,
  authorization_scope_redacted TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','completed','partial','failed','blocked')),
  listing_rows_fetched INTEGER NOT NULL DEFAULT 0 CHECK(listing_rows_fetched>=0),
  distinct_tests_verified INTEGER NOT NULL DEFAULT 0 CHECK(distinct_tests_verified>=0),
  questions_fetched INTEGER NOT NULL DEFAULT 0 CHECK(questions_fetched>=0),
  questions_verified INTEGER NOT NULL DEFAULT 0 CHECK(questions_verified>=0),
  error_summary_redacted TEXT
);

CREATE TABLE IF NOT EXISTS source_evidence (
  evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  local_session_id TEXT REFERENCES daily_sessions(local_session_id),
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_method_observed TEXT NOT NULL,
  upstream_route_redacted TEXT NOT NULL,
  response_content_type TEXT,
  request_shape_redacted_json TEXT,
  response_shape_redacted_json TEXT,
  source_app_version TEXT,
  response_sha256 TEXT NOT NULL CHECK(length(response_sha256)=64),
  access_scope_redacted TEXT,
  pagination_observed_json TEXT,
  source_native_session_id TEXT,
  notes_redacted TEXT
);

CREATE TABLE IF NOT EXISTS fetch_page_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  local_session_id TEXT NOT NULL REFERENCES daily_sessions(local_session_id),
  request_fingerprint_sha256 TEXT NOT NULL CHECK(length(request_fingerprint_sha256)=64),
  page_or_cursor_redacted TEXT,
  http_status INTEGER,
  raw_listings_count INTEGER CHECK(raw_listings_count IS NULL OR raw_listings_count>=0),
  source_advertised_total INTEGER CHECK(source_advertised_total IS NULL OR source_advertised_total>=0),
  next_page_observed TEXT,
  response_sha256 TEXT CHECK(response_sha256 IS NULL OR length(response_sha256)=64),
  evidence_id INTEGER REFERENCES source_evidence(evidence_id),
  status TEXT NOT NULL CHECK(status IN ('success','failed','retried','blocked')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fetch_run_id,local_session_id,request_fingerprint_sha256)
);

-- Canonical source test IDs: an original test may genuinely appear in multiple sessions.
CREATE TABLE IF NOT EXISTS daily_tests (
  test_uid TEXT PRIMARY KEY,
  source_namespace TEXT NOT NULL,
  native_test_id TEXT NOT NULL,
  original_title TEXT NOT NULL CHECK(length(trim(original_title))>0),
  original_subtitle TEXT,
  original_description TEXT,
  source_date_text TEXT,
  parsed_test_date TEXT,
  parsed_test_timezone TEXT,
  source_badge_text TEXT,
  badge_semantics_verified TEXT,
  source_display_order INTEGER,
  declared_mcq_count INTEGER CHECK(declared_mcq_count IS NULL OR declared_mcq_count>=0),
  declared_marks REAL,
  duration_seconds INTEGER CHECK(duration_seconds IS NULL OR duration_seconds>0),
  original_instructions TEXT,
  scoring_rules_source_json TEXT,
  access_state TEXT NOT NULL DEFAULT 'unknown' CHECK(access_state IN ('unknown','authorized','restricted','unavailable')),
  validation_state TEXT NOT NULL DEFAULT 'catalog_pending' CHECK(validation_state IN ('catalog_pending','catalog_verified','questions_verified','blocked','quarantined')),
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  evidence_id INTEGER NOT NULL REFERENCES source_evidence(evidence_id),
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_namespace,native_test_id)
);

CREATE TABLE IF NOT EXISTS daily_test_session_memberships (
  test_uid TEXT NOT NULL REFERENCES daily_tests(test_uid),
  local_session_id TEXT NOT NULL REFERENCES daily_sessions(local_session_id),
  source_display_order INTEGER,
  membership_evidence_id INTEGER NOT NULL REFERENCES source_evidence(evidence_id),
  PRIMARY KEY(test_uid,local_session_id)
);
CREATE INDEX IF NOT EXISTS idx_daily_test_session_membership ON daily_test_session_memberships(local_session_id,source_display_order);

CREATE TABLE IF NOT EXISTS daily_questions (
  question_uid TEXT PRIMARY KEY,
  source_namespace TEXT NOT NULL,
  native_question_id TEXT NOT NULL,
  stem_original TEXT NOT NULL CHECK(length(trim(stem_original))>0),
  question_type_source TEXT,
  stem_structure_source_json TEXT,
  source_correct_answer_json TEXT,
  source_explanation_original TEXT,
  source_marks REAL,
  answer_verified INTEGER NOT NULL DEFAULT 0 CHECK(answer_verified IN (0,1)),
  validation_state TEXT NOT NULL DEFAULT 'pending' CHECK(validation_state IN ('pending','ready','quarantined','blocked')),
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(run_id),
  evidence_id INTEGER NOT NULL REFERENCES source_evidence(evidence_id),
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_namespace,native_question_id)
);

CREATE TABLE IF NOT EXISTS daily_test_questions (
  test_uid TEXT NOT NULL REFERENCES daily_tests(test_uid),
  question_uid TEXT NOT NULL REFERENCES daily_questions(question_uid),
  position INTEGER NOT NULL CHECK(position>0),
  membership_evidence_id INTEGER NOT NULL REFERENCES source_evidence(evidence_id),
  PRIMARY KEY(test_uid,position),
  UNIQUE(test_uid,question_uid)
);
CREATE INDEX IF NOT EXISTS idx_daily_questions_test ON daily_test_questions(test_uid,position);

CREATE TABLE IF NOT EXISTS daily_question_options (
  option_uid TEXT PRIMARY KEY,
  question_uid TEXT NOT NULL REFERENCES daily_questions(question_uid),
  source_native_option_id TEXT,
  position INTEGER NOT NULL CHECK(position>0),
  option_text_original TEXT NOT NULL CHECK(length(trim(option_text_original))>0),
  source_option_structure_json TEXT,
  UNIQUE(question_uid,position)
);
CREATE INDEX IF NOT EXISTS idx_daily_options_question ON daily_question_options(question_uid,position);

CREATE TABLE IF NOT EXISTS daily_media (
  media_uid TEXT PRIMARY KEY,
  question_uid TEXT NOT NULL REFERENCES daily_questions(question_uid),
  source_media_ref TEXT NOT NULL,
  media_kind TEXT,
  source_position INTEGER,
  permitted_local_path TEXT,
  content_sha256 TEXT CHECK(content_sha256 IS NULL OR length(content_sha256)=64),
  license_or_rights_note TEXT,
  verified_loading INTEGER NOT NULL DEFAULT 0 CHECK(verified_loading IN (0,1))
);

CREATE TABLE IF NOT EXISTS daily_quarantine (
  quarantine_id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetch_run_id TEXT REFERENCES fetch_runs(run_id),
  local_session_id TEXT REFERENCES daily_sessions(local_session_id),
  native_test_id TEXT,
  native_question_id TEXT,
  reason_code TEXT NOT NULL,
  redacted_details TEXT,
  evidence_id INTEGER REFERENCES source_evidence(evidence_id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

-- Read-only completeness audit; do NOT infer that the number 250 means all questions are ready.
CREATE VIEW IF NOT EXISTS daily_session_coverage AS
 SELECT s.local_session_id,s.session_year,s.expected_test_listings_owner,
        s.source_advertised_test_count,
        COUNT(m.test_uid) AS verified_catalog_memberships,
        SUM(CASE WHEN t.validation_state='questions_verified' AND t.access_state='authorized' THEN 1 ELSE 0 END) AS ready_tests,
        SUM(CASE WHEN t.access_state='restricted' THEN 1 ELSE 0 END) AS restricted_tests,
        s.expected_test_listings_owner-COUNT(m.test_uid) AS difference_from_owner_expected
 FROM daily_sessions s
 LEFT JOIN daily_test_session_memberships m ON m.local_session_id=s.local_session_id
 LEFT JOIN daily_tests t ON t.test_uid=m.test_uid
 GROUP BY s.local_session_id;
