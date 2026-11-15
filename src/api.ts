import {
  TagCategory, TagQuestion, TagwisePracticeSession, TagwiseScorecard, TagwiseReviewQuestion,
  PreviousYearGroup, PreviousYearTest, PYPExamQuestion, PYPScorecard, PYPReviewQuestion,
  SamhitaNode, SubjectNode, NodeDetail, PracticeSessionResponse, PracticeResult, CoverageReport
} from './types';

const BASE_URL = '/api';

export async function fetchSamhitas(): Promise<SamhitaNode[]> {
  const res = await fetch(`${BASE_URL}/samhitas`);
  if (!res.ok) throw new Error(`Failed to fetch samhitas: ${res.statusText}`);
  return res.json();
}

export async function fetchSubjects(): Promise<SubjectNode[]> {
  const res = await fetch(`${BASE_URL}/subjects`);
  if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
  return res.json();
}

export async function fetchSubject(id: string): Promise<NodeDetail & { display_name: string; expected_count: number }> {
  const res = await fetch(`${BASE_URL}/subjects/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch subject ${id}: ${res.statusText}`);
  return res.json();
}

export async function fetchNode(id: string): Promise<NodeDetail> {
  const res = await fetch(`${BASE_URL}/nodes/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch node ${id}: ${res.statusText}`);
  return res.json();
}

export async function fetchQuestionsForNode(
  nodeId: string, 
  limit = 50, 
  offset = 0, 
  search = '',
  reviewMode = false
): Promise<{ node_id: string; count: number; questions: any[] }> {
  const params = new URLSearchParams({
    node_id: nodeId,
    limit: limit.toString(),
    offset: offset.toString()
  });
  if (search) params.append('search', search);
  if (reviewMode) params.append('review_mode', 'true');
  const res = await fetch(`${BASE_URL}/questions?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.statusText}`);
  return res.json();
}

export async function startPractice(config: {
  mode: 'chapter' | 'division' | 'samhita' | 'mixed' | 'review' | 'direct';
  scope_node_id: string;
  count: number;
  shuffle: boolean;
  timed: boolean;
  duration_mins?: number;
}): Promise<PracticeSessionResponse> {
  const res = await fetch(`${BASE_URL}/practice/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to start practice: ${res.statusText}`);
  }
  return res.json();
}

export async function saveAnswer(
  sessionId: string,
  questionId: string,
  selectedOptionIds: string[],
  timeMs: number,
  isBookmarked: boolean
): Promise<void> {
  await fetch(`${BASE_URL}/practice/${sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      selected_option_ids: selectedOptionIds,
      time_ms: timeMs,
      is_bookmarked: isBookmarked ? 1 : 0
    })
  });
}

export async function fetchPracticeSession(sessionId: string): Promise<PracticeSessionResponse & { saved_answers?: Record<string, string[]>; saved_bookmarks?: Record<string, boolean> }> {
  const res = await fetch(`${BASE_URL}/practice/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`Failed to fetch practice session: ${res.statusText}`);
  return res.json();
}

export async function submitPractice(sessionId: string): Promise<PracticeResult> {
  const res = await fetch(`${BASE_URL}/practice/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to submit practice: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCoverage(): Promise<CoverageReport> {
  const res = await fetch(`${BASE_URL}/coverage`);
  if (!res.ok) throw new Error(`Failed to fetch coverage: ${res.statusText}`);
  return res.json();
}

export async function fetchBookmarks(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/bookmarks`);
  if (!res.ok) throw new Error(`Failed to fetch bookmarks: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/history`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
  return res.json();
}

// --- PHASE 4 TEST SERIES CLIENT APIs ---

export async function fetchTestSeriesSessions(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/test-series/sessions`);
  if (!res.ok) throw new Error('Failed to fetch test series sessions');
  return res.json();
}

export async function fetchTestSeries(session?: string): Promise<any[]> {
  const url = session ? `${BASE_URL}/test-series?session=${encodeURIComponent(session)}` : `${BASE_URL}/test-series`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch test series');
  return res.json();
}

export async function fetchTestSeriesDetail(seriesId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/${encodeURIComponent(seriesId)}`);
  if (!res.ok) throw new Error(`Failed to fetch series ${seriesId}`);
  return res.json();
}

export async function fetchTestDetail(testId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/tests/${encodeURIComponent(testId)}`);
  if (!res.ok) throw new Error(`Failed to fetch test ${testId}`);
  return res.json();
}

export async function fetchExamQuestions(testId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/tests/${encodeURIComponent(testId)}/questions`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch questions: ${res.statusText}`);
  }
  return res.json();
}

export async function startTestAttempt(testId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_id: testId })
  });
  if (!res.ok) throw new Error('Failed to start test attempt');
  return res.json();
}

export async function saveTestProgress(attemptId: string, answers: Record<string, number>, markedForReview: string[], timeSpentSeconds: number): Promise<void> {
  await fetch(`${BASE_URL}/test-series/attempts/${encodeURIComponent(attemptId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, marked_for_review: markedForReview, time_spent_seconds: timeSpentSeconds })
  });
}

export async function submitTestAttempt(attemptId: string, answers: Record<string, number>, timeSpentSeconds: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/attempts/${encodeURIComponent(attemptId)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, time_spent_seconds: timeSpentSeconds })
  });
  if (!res.ok) throw new Error('Failed to submit test attempt');
  return res.json();
}

export async function fetchTestResult(attemptId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/test-series/attempts/${encodeURIComponent(attemptId)}/result`);
  if (!res.ok) throw new Error('Failed to fetch test result');
  return res.json();
}

// -------------------------------------------------------------------
// PHASE 5: TAGWISE CLIENT METHODS (/api/tags & /api/tagwise)
// -------------------------------------------------------------------

export async function fetchTags(): Promise<{
  success: boolean;
  total_categories: number;
  total_expected_assignments: number;
  total_ready_assignments: number;
  categories: TagCategory[];
}> {
  const res = await fetch(`${BASE_URL}/tags`);
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.statusText}`);
  return res.json();
}

export async function fetchTagById(tagId: string): Promise<{ success: boolean; category: TagCategory }> {
  const res = await fetch(`${BASE_URL}/tags/${encodeURIComponent(tagId)}`);
  if (!res.ok) throw new Error(`Failed to fetch tag ${tagId}: ${res.statusText}`);
  return res.json();
}

export async function fetchTagQuestions(
  tagId: string,
  limit = 50,
  offset = 0,
  search = '',
  includeAnswers = false
): Promise<{
  success: boolean;
  tag_id: string;
  tag_label: string;
  total_questions: number;
  limit: number;
  offset: number;
  questions: TagQuestion[];
}> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  if (search) params.append('search', search);
  if (includeAnswers) params.append('include_answers', 'true');
  const res = await fetch(`${BASE_URL}/tags/${encodeURIComponent(tagId)}/questions?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.statusText}`);
  return res.json();
}

export async function startTagwisePractice(config: {
  tagId: string;
  questionCount: number;
  durationMinutes: number;
  shuffle?: boolean;
}): Promise<TagwisePracticeSession> {
  const res = await fetch(`${BASE_URL}/tagwise/practice/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start Tagwise practice');
  }
  return res.json();
}

export async function saveTagwiseAttempt(
  attemptId: string,
  answers: Record<string, number>,
  markedForReview: string[],
  timeSpentSeconds: number
): Promise<void> {
  await fetch(`${BASE_URL}/tagwise/practice/${encodeURIComponent(attemptId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, markedForReview, timeSpentSeconds })
  });
}

export async function submitTagwiseAttempt(
  attemptId: string,
  answers: Record<string, number>,
  markedForReview: string[],
  timeSpentSeconds: number
): Promise<TagwiseScorecard> {
  const res = await fetch(`${BASE_URL}/tagwise/practice/${encodeURIComponent(attemptId)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, markedForReview, timeSpentSeconds })
  });
  if (!res.ok) throw new Error('Failed to submit Tagwise practice attempt');
  return res.json();
}

export async function fetchTagwiseResults(attemptId: string): Promise<{
  success: boolean;
  attempt: TagwiseScorecard;
  questions: TagwiseReviewQuestion[];
}> {
  const res = await fetch(`${BASE_URL}/tagwise/practice/${encodeURIComponent(attemptId)}/results`);
  if (!res.ok) throw new Error('Failed to fetch Tagwise practice results');
  return res.json();
}

export async function fetchTagwiseAudit(): Promise<any> {
  const res = await fetch(`${BASE_URL}/tagwise/audit`);
  if (!res.ok) throw new Error('Failed to fetch Tagwise audit');
  return res.json();
}

// Phase 6: Previous Year Papers API
export async function fetchPreviousYearGroups(): Promise<{
  success: boolean;
  total_groups: number;
  total_expected_memberships: number;
  total_catalogued_memberships: number;
  total_ready_memberships: number;
  total_unique_tests: number;
  total_unique_questions: number;
  groups: PreviousYearGroup[];
}> {
  const res = await fetch(`${BASE_URL}/previous-years/groups`);
  if (!res.ok) throw new Error(`Failed to fetch PYP groups: ${res.statusText}`);
  return res.json();
}

export async function fetchPreviousYearGroup(groupId: string): Promise<{ success: boolean; group: PreviousYearGroup }> {
  const res = await fetch(`${BASE_URL}/previous-years/groups/${encodeURIComponent(groupId)}`);
  if (!res.ok) throw new Error(`Failed to fetch PYP group ${groupId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPreviousYearGroupTests(
  groupId: string,
  options: { search?: string; year?: string; limit?: number; offset?: number } = {}
): Promise<{
  success: boolean;
  group: PreviousYearGroup;
  total: number;
  available_years: string[];
  tests: PreviousYearTest[];
}> {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.year) params.append('year', options.year);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const res = await fetch(`${BASE_URL}/previous-years/groups/${encodeURIComponent(groupId)}/tests?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch tests for group ${groupId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPreviousYearTest(testId: string): Promise<{ success: boolean; test: PreviousYearTest }> {
  const res = await fetch(`${BASE_URL}/previous-years/tests/${encodeURIComponent(testId)}`);
  if (!res.ok) throw new Error(`Failed to fetch test ${testId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPreviousYearTestQuestions(
  testId: string,
  mode: 'exam' | 'study' = 'exam'
): Promise<{
  success: boolean;
  test_uid: string;
  test_title: string;
  mode: string;
  total_questions: number;
  duration_seconds: number;
  max_marks: number;
  negative_marking: string;
  questions: PYPExamQuestion[];
}> {
  const res = await fetch(`${BASE_URL}/previous-years/tests/${encodeURIComponent(testId)}/questions?mode=${mode}`);
  if (!res.ok) throw new Error(`Failed to fetch questions for test ${testId}: ${res.statusText}`);
  return res.json();
}

export async function startPYPAttempt(testUid: string): Promise<{
  success: boolean;
  attempt_id: string;
  test_uid: string;
  test_title: string;
  duration_seconds: number;
  status: string;
  started_at: string;
}> {
  const res = await fetch(`${BASE_URL}/previous-years/attempts/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_uid: testUid })
  });
  if (!res.ok) throw new Error('Failed to start test attempt');
  return res.json();
}

export async function savePYPAttempt(
  attemptId: string,
  data: {
    answers: Record<string, string>;
    marked_for_review?: string[];
    time_remaining_seconds?: number;
    time_spent_seconds?: number;
  }
): Promise<{ success: boolean; saved_at: string }> {
  const res = await fetch(`${BASE_URL}/previous-years/attempts/${encodeURIComponent(attemptId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to autosave attempt');
  return res.json();
}

export async function submitPYPAttempt(
  attemptId: string,
  data: {
    answers: Record<string, string>;
    time_spent_seconds?: number;
  }
): Promise<{
  success: boolean;
  attempt_id: string;
  score: number;
  max_marks: number;
  accuracy_percent: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  completed_at: string;
}> {
  const res = await fetch(`${BASE_URL}/previous-years/attempts/${encodeURIComponent(attemptId)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit test attempt');
  return res.json();
}

export async function fetchPYPResults(attemptId: string): Promise<{
  success: boolean;
  scorecard: PYPScorecard;
  questions: PYPReviewQuestion[];
}> {
  const res = await fetch(`${BASE_URL}/previous-years/attempts/${encodeURIComponent(attemptId)}/results`);
  if (!res.ok) throw new Error('Failed to fetch test results');
  return res.json();
}

export async function fetchPYPAudit(): Promise<any> {
  const res = await fetch(`${BASE_URL}/previous-years/audit`);
  if (!res.ok) throw new Error('Failed to fetch PYP audit');
  return res.json();
}
