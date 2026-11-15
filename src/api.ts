import { SamhitaNode, SubjectNode, NodeDetail, PracticeSessionResponse, PracticeResult, CoverageReport } from './types';

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
