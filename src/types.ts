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
