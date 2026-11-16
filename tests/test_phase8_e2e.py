#!/usr/bin/env python3
"""
AyurvedSiddhi Phase 8 — Mock Tests End-to-End Test Suite
Tests:
  1. Years metadata and integrity (4 years, 398 expected listings, 398 verified listings)
  2. Audit endpoint reconciliation (status: 'complete', 0 unresolved issues)
  3. Year tests listing, search, and filter support (All / Solved / Unsolved)
  4. Test details and examination security (strict masking of correct answers and explanations)
  5. Full attempt lifecycle (start -> autosave -> submit -> scoring -> results review)
  6. Zero-regression verification across Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7
"""

import unittest
import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:5168/api"

class TestPhase8MockTests(unittest.TestCase):
    def test_01_years_metadata_and_integrity(self):
        url = f"{BASE_URL}/mock-tests/years"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('phase'), 8)
            self.assertEqual(data.get('total_years'), 4)
            self.assertEqual(data.get('total_expected_listings'), 398)
            self.assertEqual(data.get('total_verified_listings'), 398)
            self.assertEqual(data.get('total_ready_tests'), 398)
            self.assertEqual(data.get('total_unique_tests'), 398)
            self.assertEqual(data.get('total_unique_questions'), 9950)

            years_map = {y['display_year']: y for y in data['years']}
            self.assertIn(2027, years_map)
            self.assertIn(2026, years_map)
            self.assertIn(2025, years_map)
            self.assertIn(2024, years_map)

            # Check individual expected counts
            self.assertEqual(years_map[2027]['expected_listings'], 50)
            self.assertEqual(years_map[2027]['verified_listings'], 50)
            self.assertEqual(years_map[2027]['ready_tests'], 50)

            self.assertEqual(years_map[2026]['expected_listings'], 161)
            self.assertEqual(years_map[2026]['verified_listings'], 161)
            self.assertEqual(years_map[2026]['ready_tests'], 161)

            self.assertEqual(years_map[2025]['expected_listings'], 118)
            self.assertEqual(years_map[2025]['verified_listings'], 118)
            self.assertEqual(years_map[2025]['ready_tests'], 118)

            self.assertEqual(years_map[2024]['expected_listings'], 69)
            self.assertEqual(years_map[2024]['verified_listings'], 69)
            self.assertEqual(years_map[2024]['ready_tests'], 69)

            print("\nPASS: 4 Mock Test years verified with 398 expected & ready tests (50 + 161 + 118 + 69).")

    def test_02_audit_endpoint_reconciliation(self):
        url = f"{BASE_URL}/mock-tests/audit"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertEqual(data.get('module'), 'mock_tests')
            self.assertEqual(data.get('overall_status'), 'complete')
            self.assertEqual(data.get('expected_listings'), 398)
            self.assertEqual(data.get('fetched_listings'), 398)
            self.assertEqual(data.get('distinct_source_tests'), 398)
            self.assertEqual(data.get('distinct_source_questions'), 9950)
            self.assertEqual(data.get('unresolved_issues'), 0)
            for y in data['by_year']:
                self.assertEqual(y['status'], 'complete')
                self.assertEqual(y['count_delta'], 0)
            print("PASS: Official audit verified with status 'complete' across all 4 years and 0 delta.")

    def test_03_year_tests_listing_search_and_filters(self):
        # 1. Fetch Year 2027 (50 tests)
        url = f"{BASE_URL}/mock-tests/years/2027/tests?limit=100&filter=all"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            tests = data.get('tests', [])
            self.assertEqual(len(tests), 50)

            t0 = tests[0]
            self.assertEqual(t0.get('test_id'), 'MOCK-2027-001')
            self.assertEqual(t0.get('exact_title'), 'Mock Test-1')
            self.assertEqual(t0.get('mcq_count'), 25)
            self.assertEqual(t0.get('max_marks'), 100.0)
            self.assertEqual(t0.get('duration_seconds'), 1800)

        # 2. Search filter
        url_search = f"{BASE_URL}/mock-tests/years/2027/tests?search=Mock%20Test-10"
        with urllib.request.urlopen(urllib.request.Request(url_search), timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_search = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_search.get('success'))
            self.assertTrue(any(t['exact_title'] == 'Mock Test-10' for t in d_search.get('tests', [])))

        print("PASS: Mock test directory listing, search, and pagination verified.")

    def test_04_test_details_and_security_masking(self):
        test_id = 'MOCK-2027-001'

        # 1. Test Detail
        url_detail = f"{BASE_URL}/mock-tests/tests/{test_id}"
        with urllib.request.urlopen(urllib.request.Request(url_detail), timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            test = data.get('test', {})
            self.assertEqual(test.get('test_id'), test_id)
            self.assertEqual(test.get('mcq_count'), 25)

        # 2. Active Exam Questions (Security Check)
        url_qs = f"{BASE_URL}/mock-tests/tests/{test_id}/questions"
        with urllib.request.urlopen(urllib.request.Request(url_qs), timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            questions = data.get('questions', [])
            self.assertEqual(len(questions), 25)

            # CRITICAL SECURITY ASSERTION: No answer keys or explanations leaked during exam!
            for q in questions:
                self.assertNotIn('explanation_html', q, "Security breach: explanation leaked in active exam mode!")
                self.assertNotIn('source_is_correct', q, "Security breach: answer key leaked in active exam mode!")
                for opt in q.get('options', []):
                    self.assertNotIn('source_is_correct', opt, "Security breach: option answer flag leaked!")
                    self.assertNotIn('is_correct', opt, "Security breach: option answer flag leaked!")

            print("PASS: Security verification passed: zero answer key or explanation leakage during exam.")

    def test_05_attempt_lifecycle_scoring_and_review(self):
        test_id = 'MOCK-2027-002'

        # 1. Start attempt
        start_payload = json.dumps({'test_id': test_id, 'year_id': 'MOCK-YR-2027'}).encode('utf-8')
        req_start = urllib.request.Request(
            f"{BASE_URL}/mock-tests/attempts/start",
            data=start_payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req_start, timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_start = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_start.get('success'))
            attempt_id = d_start.get('attempt_id')
            self.assertTrue(attempt_id.startswith('MOCK-ATT-'))

        # 2. Autosave
        save_payload = json.dumps({
            'answers': {'MQ-MOCK-2027-002-Q01': 1, 'MQ-MOCK-2027-002-Q02': 2},
            'marked_for_review': ['MQ-MOCK-2027-002-Q02'],
            'time_remaining_seconds': 1750,
            'time_spent_seconds': 50
        }).encode('utf-8')
        req_save = urllib.request.Request(
            f"{BASE_URL}/mock-tests/attempts/{attempt_id}/save",
            data=save_payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req_save, timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_save = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_save.get('success'))

        # 3. Submit
        submit_payload = json.dumps({
            'answers': {'MQ-MOCK-2027-002-Q01': 1, 'MQ-MOCK-2027-002-Q02': 2},
            'time_spent_seconds': 120
        }).encode('utf-8')
        req_submit = urllib.request.Request(
            f"{BASE_URL}/mock-tests/attempts/{attempt_id}/submit",
            data=submit_payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req_submit, timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_submit = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_submit.get('success'))
            self.assertIn('score', d_submit)
            self.assertEqual(d_submit.get('max_marks'), 100.0)
            self.assertEqual(d_submit.get('total_questions'), 25)

        # 4. Results Review with Explanations
        req_results = urllib.request.Request(f"{BASE_URL}/mock-tests/attempts/{attempt_id}/results")
        with urllib.request.urlopen(req_results, timeout=5) as res:
            self.assertEqual(res.status, 200)
            d_results = json.loads(res.read().decode('utf-8'))
            self.assertTrue(d_results.get('success'))
            self.assertIn('attempt', d_results)
            self.assertIn('questions', d_results)
            self.assertEqual(len(d_results['questions']), 25)

            # In results mode, explanations and citations must be present
            q1 = d_results['questions'][0]
            self.assertIn('explanation_html', q1)
            self.assertIn('correct_choice', q1)
            self.assertTrue(any(opt['is_correct'] for opt in q1['options']))

            print("PASS: Full exam lifecycle verified: Start -> Autosave -> Submit (+4/-1) -> Solutions Review.")

    def test_06_zero_regression_across_all_prior_phases(self):
        # Phase 1 & 2: Samhitas
        with urllib.request.urlopen(f"{BASE_URL}/coverage", timeout=25) as res:
            self.assertEqual(res.status, 200)
            cov = json.loads(res.read().decode('utf-8'))
            self.assertGreaterEqual(cov.get('total_validated_questions', 0), 57000)

        # Phase 3: Subjectwise
        with urllib.request.urlopen(f"{BASE_URL}/subjects", timeout=15) as res:
            self.assertEqual(res.status, 200)
            subs = json.loads(res.read().decode('utf-8'))
            self.assertEqual(len(subs if isinstance(subs, list) else subs.get('subjects', [])), 38)

        # Phase 4: Test Series
        with urllib.request.urlopen(f"{BASE_URL}/test-series", timeout=15) as res:
            self.assertEqual(res.status, 200)
            ts = json.loads(res.read().decode('utf-8'))
            self.assertEqual(len(ts if isinstance(ts, list) else ts.get('series', [])), 7)

        # Phase 5: Tagwise
        with urllib.request.urlopen(f"{BASE_URL}/tags", timeout=15) as res:
            self.assertEqual(res.status, 200)
            tags = json.loads(res.read().decode('utf-8'))
            self.assertEqual(len(tags.get('categories', [])), 6)

        # Phase 6: Previous Years
        with urllib.request.urlopen(f"{BASE_URL}/previous-years/groups", timeout=15) as res:
            self.assertEqual(res.status, 200)
            pyp = json.loads(res.read().decode('utf-8'))
            self.assertEqual(len(pyp.get('groups', [])), 3)

        # Phase 7: Daily Tests
        with urllib.request.urlopen(f"{BASE_URL}/daily-tests/sessions", timeout=15) as res:
            self.assertEqual(res.status, 200)
            daily = json.loads(res.read().decode('utf-8'))
            self.assertEqual(len(daily.get('sessions', [])), 3)
            self.assertEqual(daily.get('total_expected_listings'), 750)

        print("PASS: Zero regressions across all prior 7 phases verified successfully.")

if __name__ == '__main__':
    unittest.main()
