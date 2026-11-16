export interface LeafNode {
  id: string;
  name_en: string;
  name_hi: string | null;
  type: 'chapter' | 'miscellaneous' | string;
  chapter_number: number | null;
  expected_count: number | null;
  validated_count: number;
  coverage_percent: number;
  is_ready: boolean;
  status: 'ready' | 'partial' | 'pending';
}

export interface DivisionNode {
  id: string;
  name_en: string;
  name_hi: string | null;
  type: 'division' | 'miscellaneous_group' | 'sthana' | string;
  expected_count: number | null;
  validated_count: number;
  chapter_count: number;
  coverage_percent: number;
  status: 'ready' | 'partial' | 'pending';
}

export interface SamhitaNode {
  id: string;
  name_en: string;
  name_hi: string;
  expected_count: number | null;
  validated_count: number;
  coverage_percent: number;
  status: 'ready' | 'partial' | 'pending';
  last_sync?: string | null;
  navigation_type?: string;
  is_direct?: boolean;
  is_sthana_direct?: boolean;
  category_group?: string;
  division_count?: number;
  divisions: DivisionNode[];
}

export interface SubjectNode {
  id: string;
  display_order: number;
  name_en: string;
  name_hi: string | null;
  display_name: string;
  expected_count: number;
  validated_count: number;
  chapter_count: number;
  coverage_percent: number;
  is_ready: boolean;
  status: 'ready' | 'partial' | 'pending';
  navigation_type: 'direct_questions';
  category_group: string;
}

export interface NodeDetail {
  id: string;
  name_en: string;
  name_hi: string | null;
  type: string;
  chapter_number: number | null;
  expected_count: number | null;
  validated_count: number;
  coverage_percent: number;
  is_ready: boolean;
  navigation_type?: string;
  breadcrumbs: {
    id: string;
    name_en: string;
    name_hi: string | null;
    type: string;
  }[];
  children: LeafNode[];
}

export interface Option {
  option_id: string;
  position: number;
  text: string;
  is_correct?: boolean;
}

export interface PracticeQuestion {
  question_id: string;
  source_qid: string;
  stem: string;
  options: Option[];
}

export interface ReviewQuestion extends PracticeQuestion {
  explanation?: string;
  selected_options: string[];
  is_correct: boolean;
  is_unattempted: boolean;
}

export interface PracticeSessionResponse {
  session_id: string;
  mode: string;
  scope_node_id: string;
  total_questions: number;
  timed: boolean;
  duration_seconds: number | null;
  questions: PracticeQuestion[];
}

export interface PracticeResult {
  session_id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  total_score: number;
  max_score: number;
  accuracy_percent: number;
  total_time_seconds: number;
  review: ReviewQuestion[];
}

export interface CoverageNode {
  node_id: string;
  parent_node_id: string | null;
  type: string;
  name_en: string;
  name_hi: string | null;
  chapter_number: number | null;
  expected_count: number | null;
  validated_count: number;
  discrepancy: number | null;
  status: 'MATCH' | 'PARTIAL' | 'PENDING' | 'OVERFLOW' | 'RESOLVED_VERIFIED';
}

export interface CoverageReport {
  total_nodes: number;
  total_expected_questions: number;
  total_validated_questions: number;
  coverage_percent: number;
  subjectwise_total?: number;
  subjectwise_expected?: number;
  nodes: CoverageNode[];
}

export interface TestSeriesSession {
  session: string;
  series_count: number;
  total_tests: number;
  available_tests: number;
  scheduled_tests: number;
  total_questions: number;
}

export interface TestSeriesCard {
  local_series_id: string;
  session: string;
  title_source_exact: string;
  expected_test_count: number;
  start_date_iso: string;
  end_date_iso: string;
  students_enrolled_source: number;
  access_badge_source: 'FREE' | 'PAID';
  exam_button_label_source: string;
  action_button_label_source: string;
  verified_test_count: number;
  available_test_count: number;
  scheduled_test_count: number;
  questions_count: number;
  description?: string;
}

export interface SeriesTestItem {
  local_test_id: string;
  source_test_id: string;
  title_source_exact: string;
  source_order: number;
  scheduled_at_source: string;
  duration_minutes: number;
  source_question_count: number;
  marks_per_correct: number;
  marks_per_incorrect: number;
  availability_status: 'available' | 'scheduled';
  validation_status: string;
  questions_count: number;
}

export interface ExamQuestion {
  local_question_id: string;
  question_position: number;
  question_text: string;
  original_language: string;
  options: {
    position: number;
    option_text: string;
  }[];
}

export interface ExamScorecard {
  attempt_id: string;
  test_id: string;
  test_title: string;
  series_title: string;
  session: string;
  status: string;
  started_at: string;
  submitted_at: string;
  time_spent_seconds: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  score: number;
  total_marks: number;
  accuracy_percent: number;
}

export interface ExamReviewQuestion {
  local_question_id: string;
  question_position: number;
  question_text: string;
  user_answer: number | null;
  correct_answer: number;
  is_correct: boolean;
  is_attempted: boolean;
  explanation: string;
  reference: {
    samhita: string;
    sthana: string;
    subject: string;
  };
  options: {
    position: number;
    option_text: string;
    is_correct: boolean;
  }[];
}

export interface TagCategory {
  local_tag_id: string;
  display_order: number;
  label_source_exact: string;
  expected_count: number;
  native_tag_id: string;
  source_path_verified: string;
  source_access_state: string;
  ingestion_status: string;
  ready_count: number;
  outstanding_count: number;
}

export interface TagQuestion {
  question_uid: string;
  source_question_id: string;
  stem: string;
  options: {
    option_position: number;
    option_source_raw: string;
    is_correct_verified?: number;
  }[];
  media?: {
    media_uid: string;
    kind: string;
    mime_type: string;
    content_sha256: string;
  }[];
  explanation?: string;
}

export interface TagwisePracticeSession {
  success: boolean;
  attempt_id: string;
  tag_id: string;
  tag_label: string;
  total_questions: number;
  duration_minutes: number;
  questions: {
    index: number;
    question_uid: string;
    source_question_id: string;
    stem: string;
    options: {
      option_position: number;
      option_source_raw: string;
    }[];
  }[];
}

export interface TagwiseScorecard {
  attempt_id: string;
  tag_id: string;
  tag_label: string;
  started_at: string;
  submitted_at: string;
  time_spent_seconds: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  score: number;
  total_marks: number;
  accuracy_percent: number;
}

export interface TagwiseReviewQuestion {
  index: number;
  question_uid: string;
  source_question_id: string;
  stem: string;
  explanation: string | null;
  options: {
    position: number;
    text: string;
    is_correct: boolean;
  }[];
  selected_position: number | null;
  correct_position: number | null;
  is_correct: boolean;
  is_marked_for_review: boolean;
}

// Phase 6: Previous Year Papers Types
export interface PreviousYearGroup {
  local_group_id: string;
  display_order: number;
  screenshot_label_exact: string;
  screenshot_description_exact: string;
  user_description_alias: string;
  expected_test_count: number;
  native_group_id: string;
  source_entitlement_state: string;
  ingestion_status: string;
  catalogued_test_memberships: number;
  ready_test_memberships: number;
}

export interface PreviousYearTest {
  test_uid: string;
  source_native_test_id: string;
  title_source_exact: string;
  exam_year_source: string | null;
  exam_type_source: string | null;
  scheduled_date_source: string;
  duration_seconds_source: number;
  max_marks_source: number;
  negative_marking_source: string;
  expected_question_count_source: number;
  availability_source: string;
  access_state: string;
  validation_state: string;
  source_position: number;
  actual_question_count: number;
  instructions_source_raw?: string;
  memberships?: {
    local_group_id: string;
    screenshot_label_exact: string;
    source_position: number;
  }[];
}

export interface PYPExamQuestion {
  position: number;
  question_uid: string;
  stem: string;
  question_type: string;
  structure: Record<string, any>;
  correct_key?: string;
  explanation?: string;
  options: {
    position: number;
    key: string;
    text: string;
    is_correct?: boolean;
  }[];
}

export interface PYPScorecard {
  attempt_id: string;
  test_uid: string;
  test_title: string;
  exam_year: string | null;
  score: number;
  max_marks: number;
  accuracy_percent: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at: string;
}

export interface PYPReviewQuestion {
  position: number;
  question_uid: string;
  stem: string;
  structure: Record<string, any>;
  options: {
    position: number;
    key: string;
    text: string;
    is_correct: boolean;
  }[];
  user_choice: string | null;
  correct_key: string;
  is_correct: boolean;
  is_attempted: boolean;
  explanation: string;
}

// Phase 7: Daily Tests Types
export interface DailySession {
  local_session_id: string;
  display_order: number;
  session_year: string;
  expected_test_listings_owner: number;
  expected_count_origin: string;
  original_route_hint: string;
  route_verified: number;
  native_session_id: string | null;
  source_advertised_test_count: number | null;
  ingestion_status: string;
  verified_catalog_memberships: number;
  ready_tests: number;
  restricted_tests: number;
  difference_from_owner_expected: number;
}

export interface DailyTestCatalogItem {
  test_uid: string;
  source_namespace: string;
  native_test_id: string;
  original_title: string;
  original_subtitle: string | null;
  original_description: string | null;
  source_date_text: string | null;
  source_badge_text: string | null;
  source_display_order: number | null;
  declared_mcq_count: number | null;
  declared_marks: number | null;
  duration_seconds: number | null;
  access_state: 'authorized' | 'restricted' | 'unavailable' | string;
  validation_state: 'questions_verified' | 'catalog_verified' | string;
  session_position: number;
  actual_question_count: number;
  is_ready: boolean;
  student_solved: boolean;
}

export interface DailyExamQuestion {
  question_uid: string;
  position: number;
  stem: string;
  question_type: string | null;
  marks: number | null;
  options: {
    option_uid: string;
    position: number;
    text: string;
  }[];
}

export interface DailyAttemptSummary {
  attempt_id: string;
  test_uid: string;
  test_title: string;
  test_subtitle: string | null;
  started_at: string;
  completed_at: string;
  score: number;
  max_marks: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  percentage: number;
  accuracy: number;
}

export interface DailyReviewQuestion {
  question_uid: string;
  position: number;
  stem: string;
  question_type: string | null;
  marks: number | null;
  options: {
    option_uid: string;
    position: number;
    text: string;
  }[];
  student_selected_position: number | null;
  correct_answer_position: number | null;
  explanation: string | null;
  status: 'correct' | 'incorrect' | 'unattempted';
}

