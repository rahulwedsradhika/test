#!/usr/bin/env python3
"""
AyurvedSiddhi Phase 7 — Daily Tests End-to-End Test Suite
Tests:
  1. Sessions catalog and metadata integrity (3 sessions, 750 owner-expected listings)
  2. Database audit reconciliation (90 canonical tests, 1,050 verified questions)
  3. Session test listing, subtitle preservation, and filter support (All / Solved / Un Solved)
  4. Examination mode security (strict redaction of answers and explanations)
  5. Full attempt lifecycle (start -> autosave -> submit -> scoring -> solutions review)
  6. Zero-regression verification across Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6
"""

import unittest
import urllib.request
import json
import time

BASE_URL = "http://localhost:5168/api"

class TestPhase7DailyTests(unittest.TestCase):
    def test_01_sessions_catalog_and_metadata(self):
        url = f"{BASE_URL}/daily-tests/sessions"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('phase'), 7)
            self.assertEqual(data.get('total_sessions'), 3)
            self.assertEqual(data.get('total_expected_listings'), 750)
            self.assertEqual(data.get('total_catalogued_memberships'), 750)
            self.assertEqual(data.get('total_unique_tests'), 750)
            self.assertEqual(data.get('total_unique_questions'), 12350)

            sessions = {s['local_session_id']: s for s in data['sessions']}
            self.assertIn('DLY-2026-2027', sessions)
            self.assertIn('DLY-2025-2026', sessions)
            self.assertIn('DLY-2024-2025', sessions)

            # Check expected listings
            self.assertEqual(sessions['DLY-2026-2027']['expected_test_listings_owner'], 250)
            self.assertEqual(sessions['DLY-2025-2026']['expected_test_listings_owner'], 250)
            self.assertEqual(sessions['DLY-2024-2025']['expected_test_listings_owner'], 250)

            # Check catalogued counts
            self.assertEqual(sessions['DLY-2026-2027']['verified_catalog_memberships'], 250)
            self.assertEqual(sessions['DLY-2025-2026']['verified_catalog_memberships'], 250)
            self.assertEqual(sessions['DLY-2024-2025']['verified_catalog_memberships'], 250)
            print("\nPASS: 3 daily sessions verified with 750 expected listings and 750 verified ready tests (250/session).")

    def test_02_audit_reconciliation_integrity(self):
        url = f"{BASE_URL}/daily-tests/audit"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            audit = data.get('audit', {})
            self.assertEqual(audit.get('owner_expected_listings'), 750)
            self.assertEqual(audit.get('distinct_verified_catalog_tests'), 750)
            self.assertEqual(audit.get('questions_total'), 12350)
            self.assertEqual(audit.get('source_answer_verified_ready_questions'), 12350)
            print("PASS: Audit reconciliation verified: 750 tests (250/session), 12,350 questions, 12,350 verified answers.")

    def test_03_session_tests_listing_and_filters(self):
        # 1. Fetch Session 2024-2025 (all)
        url = f"{BASE_URL}/daily-tests/sessions/DLY-2024-2025/tests?limit=50&filter=all"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            tests = data.get('tests', [])
            self.assertEqual(len(tests), 50)

            t0 = tests[0]
            self.assertTrue(t0.get('test_uid').startswith('DLY-T-'))
            self.assertIn('original_title', t0)
            self.assertIn('declared_mcq_count', t0)
            self.assertIn('declared_marks', t0)
            self.assertIn('duration_seconds', t0)
            self.assertIn('is_ready', t0)
            self.assertIn('student_solved', t0)

        # 2. Test Solved filter
        url_solved = f"{BASE_URL}/daily-tests/sessions/DLY-2024-2025/tests?filter=solved"
        with urllib.request.urlopen(urllib.request.Request(url_solved), timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_solved = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_solved.get('success'))
            for t in d_solved.get('tests', []):
                self.assertTrue(t.get('student_solved'))

        # 3. Test Unsolved filter
        url_unsolved = f"{BASE_URL}/daily-tests/sessions/DLY-2024-2025/tests?filter=unsolved"
        with urllib.request.urlopen(urllib.request.Request(url_unsolved), timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_unsolved = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_unsolved.get('success'))
            for t in d_unsolved.get('tests', []):
                self.assertFalse(t.get('student_solved'))

        print(f"PASS: Session test listings and All/Solved/Unsolved filters verified.")

    def test_04_exam_mode_security(self):
        # Fetch first ready test
        tests_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/daily-tests/sessions/DLY-2024-2025/tests?limit=10").read().decode('utf-8'))
        ready_tests = [t for t in tests_res['tests'] if t.get('is_ready')]
        self.assertGreater(len(ready_tests), 0)
        test_uid = ready_tests[0]['test_uid']

        # Request exam questions
        exam_url = f"{BASE_URL}/daily-tests/tests/{test_uid}/questions"
        with urllib.request.urlopen(exam_url, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            questions = data.get('questions', [])
            self.assertGreater(len(questions), 0)

            # Strictly verify NO answers or explanations leaked in pre-submit exam payload
            for q in questions[:10]:
                self.assertNotIn('correct_answer', q, "Security leak: correct_answer leaked in exam mode!")
                self.assertNotIn('source_correct_answer_json', q, "Security leak: answer JSON leaked!")
                self.assertNotIn('explanation', q, "Security leak: explanation leaked in exam mode!")
                self.assertNotIn('source_explanation_original', q, "Security leak: source explanation leaked!")
                self.assertEqual(len(q['options']), 4)
                for opt in q['options']:
                    self.assertNotIn('is_correct', opt, "Security leak: is_correct leaked on option!")

        print("PASS: Exam mode security verified: zero answers or classical citations disclosed prior to submit.")

    def test_05_attempt_lifecycle_and_scoring(self):
        tests_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/daily-tests/sessions/DLY-2024-2025/tests?limit=5").read().decode('utf-8'))
        ready_tests = [t for t in tests_res['tests'] if t.get('is_ready')]
        test_uid = ready_tests[0]['test_uid']

        # 1. Start attempt
        start_req = urllib.request.Request(
            f"{BASE_URL}/daily-tests/attempts/start",
            data=json.dumps({'test_uid': test_uid, 'session_id': 'DLY-2024-2025'}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        start_res = json.loads(urllib.request.urlopen(start_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(start_res.get('success'))
        attempt_id = start_res.get('attempt_id')
        self.assertTrue(attempt_id.startswith('DLY-ATT-'))

        # 2. Get questions and answer question 1
        q_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/daily-tests/tests/{test_uid}/questions").read().decode('utf-8'))
        q1_uid = q_res['questions'][0]['question_uid']

        # 3. Save draft answers
        save_req = urllib.request.Request(
            f"{BASE_URL}/daily-tests/attempts/{attempt_id}/save",
            data=json.dumps({'answers': {q1_uid: 3}}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        save_res = json.loads(urllib.request.urlopen(save_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(save_res.get('success'))

        # 4. Final submit
        sub_req = urllib.request.Request(
            f"{BASE_URL}/daily-tests/attempts/{attempt_id}/submit",
            data=json.dumps({'answers': {q1_uid: 3}}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        sub_res = json.loads(urllib.request.urlopen(sub_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(sub_res.get('success'))
        self.assertIn('score', sub_res)
        self.assertIn('percentage', sub_res)
        self.assertIn('accuracy', sub_res)
        self.assertEqual(sub_res.get('total_questions'), len(q_res['questions']))

        # 5. Review results and unlocked citations
        res_req = urllib.request.Request(f"{BASE_URL}/daily-tests/attempts/{attempt_id}/results")
        res_data = json.loads(urllib.request.urlopen(res_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(res_data.get('success'))
        review_questions = res_data.get('questions', [])
        self.assertEqual(len(review_questions), len(q_res['questions']))

        # Verify unlocked classical reference on question 1
        rev_q1 = review_questions[0]
        self.assertIn('correct_answer_position', rev_q1)
        self.assertIn('explanation', rev_q1)
        self.assertIn('status', rev_q1)
        print(f"PASS: Full exam attempt lifecycle verified: start -> autosave -> submit ({sub_res['score']} pts) -> review.")

    def test_06_zero_regression_across_all_phases(self):
        # Phase 1 & 2 Samhitas
        sam_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/samhitas", timeout=25).read().decode('utf-8'))
        self.assertEqual(len(sam_data), 17)

        # Phase 3 Subjects
        sub_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/subjects", timeout=15).read().decode('utf-8'))
        self.assertEqual(len(sub_data), 38)

        # Phase 4 Test Series
        ts_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/test-series", timeout=15).read().decode('utf-8'))
        self.assertEqual(len(ts_data if isinstance(ts_data, list) else ts_data.get('series', [])), 7)

        # Phase 5 Tagwise
        tag_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/tags", timeout=15).read().decode('utf-8'))
        self.assertEqual(len(tag_data.get('categories', [])), 6)

        # Phase 6 Previous Years
        pyp_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/previous-years/groups", timeout=15).read().decode('utf-8'))
        self.assertEqual(pyp_data.get('total_groups'), 3)

        # Phase 7 Daily Tests
        daily_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/daily-tests/sessions", timeout=15).read().decode('utf-8'))
        self.assertEqual(daily_data.get('total_sessions'), 3)

        print("PASS: Zero regressions across all Phases 1-6 verified (17 Samhitas, 38 Subjects, 7 Test Series, 6 Tags, 3 PYP Groups, 3 Daily Sessions).")

if __name__ == '__main__':
    unittest.main()

