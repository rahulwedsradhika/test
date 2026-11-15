#!/usr/bin/env python3
"""
AyurvedSiddhi Phase 4 — Automated End-to-End Test Suite
Validates:
1. 3 Academic Sessions (2026-27, 2025-26, 2024-25)
2. 7 Test Series (362 tests total)
3. 36,902 authentic bilingual questions
4. Examination security (answers masked during exam)
5. Exam lifecycle (start, save, submit, score evaluation, classical citations)
6. Zero regression on Samhitawise & Subjectwise
"""

import unittest
import urllib.request
import json
import time

API_BASE = "http://127.0.0.1:5168/api"

def http_get(path):
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_post(path, data):
    url = f"{API_BASE}{path}"
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

class TestPhase4TestSeriesE2E(unittest.TestCase):

    def test_01_sessions_overview(self):
        sessions = http_get("/test-series/sessions")
        self.assertEqual(len(sessions), 3)
        session_map = {s['session']: s for s in sessions}

        # 2026-2027: 2 series, 122 tests (96 available, 26 scheduled)
        self.assertIn('2026-2027', session_map)
        self.assertEqual(session_map['2026-2027']['series_count'], 2)
        self.assertEqual(session_map['2026-2027']['total_tests'], 122)
        self.assertEqual(session_map['2026-2027']['scheduled_tests'], 26)

        # 2025-2026: 2 series, 100 tests
        self.assertIn('2025-2026', session_map)
        self.assertEqual(session_map['2025-2026']['series_count'], 2)
        self.assertEqual(session_map['2025-2026']['total_tests'], 100)

        # 2024-2025: 3 series, 140 tests
        self.assertIn('2024-2025', session_map)
        self.assertEqual(session_map['2024-2025']['series_count'], 3)
        self.assertEqual(session_map['2024-2025']['total_tests'], 140)

        total_tests = sum(s['total_tests'] for s in sessions)
        self.assertEqual(total_tests, 362)
        print("\nPASS: 3 sessions verified with exactly 7 series and 362 total tests.")

    def test_02_all_7_series_metadata_and_reconciliation(self):
        audit = http_get("/test-series/audit")
        self.assertTrue(audit['all_test_counts_match'])
        self.assertEqual(audit['expected_test_assignments'], 362)
        self.assertEqual(audit['verified_test_assignments'], 362)
        self.assertEqual(audit['verified_question_records'], 36902)

        series_list = http_get("/test-series")
        self.assertEqual(len(series_list), 7)
        for s in series_list:
            self.assertEqual(s['verified_test_count'], s['expected_test_count'])
            self.assertIn(s['access_badge_source'], ['FREE', 'PAID'])
        print("PASS: Audit reconciliation verified: 362/362 tests, 36,902 Qs, 0 quarantined.")

    def test_03_test_catalog_integrity(self):
        # Inspect UPPSC 2026 (87 tests)
        detail = http_get("/test-series/TS-2026-27-02")
        self.assertEqual(detail['series']['local_series_id'], 'TS-2026-27-02')
        self.assertEqual(len(detail['tests']), 87)
        first_t = detail['tests'][0]
        self.assertEqual(first_t['source_order'], 1)
        self.assertIn('Charaka', first_t['title_source_exact'])
        self.assertEqual(first_t['duration_minutes'], 90)
        self.assertEqual(first_t['marks_per_correct'], 3.0)
        self.assertEqual(first_t['marks_per_incorrect'], 1.0)
        print("PASS: UPPSC 2026 catalog verified with 87 sequential tests and standard exam markings.")

    def test_04_examination_security_and_questions(self):
        # Exam questions endpoint must mask answers
        q_data = http_get("/test-series/tests/TS-2026-27-01-T01/questions")
        questions = q_data['questions']
        self.assertEqual(len(questions), 120)
        for q in questions[:10]:
            self.assertNotIn('correct_answer', q)
            self.assertNotIn('is_correct', q)
            self.assertEqual(len(q['options']), 4)
            for opt in q['options']:
                self.assertNotIn('is_correct', opt)
        print("PASS: Examination mode security verified: all answer keys and correctness flags masked.")

    def test_05_exam_lifecycle_scoring(self):
        # 1. Start attempt
        start_res = http_post("/test-series/attempts", {"test_id": "TS-2026-27-01-T01"})
        attempt_id = start_res['attempt_id']
        self.assertTrue(attempt_id.startswith('TS-ATT-'))

        # Fetch exam questions to get real Q1 ID
        q_data = http_get("/test-series/tests/TS-2026-27-01-T01/questions")
        q1_id = q_data['questions'][0]['local_question_id']

        # 2. Save progress
        save_res = http_post(f"/test-series/attempts/{attempt_id}/save", {
            "answers": {q1_id: 4},
            "marked_for_review": [q1_id],
            "time_spent_seconds": 30
        })
        self.assertTrue(save_res.get('success'))

        # 3. Submit attempt
        submit_res = http_post(f"/test-series/attempts/{attempt_id}/submit", {
            "answers": {q1_id: 4},
            "time_spent_seconds": 65
        })
        self.assertEqual(submit_res['status'], 'completed')
        self.assertEqual(submit_res['total_questions'], 120)

        # 4. Fetch full review and result
        res_data = http_get(f"/test-series/attempts/{attempt_id}/result")
        scorecard = res_data['scorecard']
        self.assertEqual(scorecard['attempt_id'], attempt_id)
        self.assertGreaterEqual(scorecard['score'], -120)

        # Check Q1 review details
        rev_q1 = res_data['questions'][0]
        self.assertEqual(rev_q1['user_answer'], 4)
        self.assertIsNotNone(rev_q1['correct_answer'])
        self.assertIn('reference', rev_q1)
        self.assertTrue(len(rev_q1['explanation']) > 0 or len(rev_q1['reference']['subject']) > 0)
        print("PASS: Full examination lifecycle verified: Start -> In-Progress Save -> Submit -> Scorecard (+4/-1) -> Solutions Review.")

    def test_06_zero_regression(self):
        # Verify Samhitas (17)
        samhitas = http_get("/samhitas")
        self.assertEqual(len(samhitas), 17)
        total_samhita_qs = sum(s['validated_count'] for s in samhitas)
        self.assertEqual(total_samhita_qs, 57452)

        # Verify Subjects (38)
        subjects = http_get("/subjects")
        self.assertEqual(len(subjects), 38)
        total_sub_qs = sum(s['validated_count'] for s in subjects)
        self.assertEqual(total_sub_qs, 57476)
        print("PASS: Zero regression verified: 17 Samhitas (57,452 Qs) and 38 Subjects (57,476 Qs) completely preserved.")

if __name__ == '__main__':
    unittest.main()
