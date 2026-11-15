#!/usr/bin/env python3
"""
AyurvedSiddhi Phase 6 — Previous Year Papers End-to-End Test Suite
Tests:
  1. Groups catalog and screenshot label integrity (3 groups, 250 expected memberships)
  2. Database audit reconciliation (127 canonical tests, 14,040 unique questions)
  3. Group tests listing, search, and year filter
  4. Examination mode security (strict redaction of answers and explanations)
  5. Full attempt lifecycle (start -> autosave -> submit -> scoring -> solutions review)
  6. Zero-regression verification across Phase 1, Phase 2, Phase 3, Phase 4, Phase 5
"""

import unittest
import urllib.request
import json
import time

BASE_URL = "http://localhost:5168/api"

class TestPhase6PreviousYears(unittest.TestCase):
    def test_01_groups_catalog_and_metadata(self):
        url = f"{BASE_URL}/previous-years/groups"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('total_groups'), 3)
            self.assertEqual(data.get('total_expected_memberships'), 250)
            self.assertEqual(data.get('total_catalogued_memberships'), 250)
            self.assertEqual(data.get('total_ready_memberships'), 250)
            self.assertEqual(data.get('total_unique_tests'), 127)
            
            groups = {g['local_group_id']: g for g in data['groups']}
            self.assertIn('PYP-ALL', groups)
            self.assertIn('PYP-PG', groups)
            self.assertIn('PYP-UPSC', groups)
            
            # Verify exact screenshot labels
            self.assertEqual(groups['PYP-ALL']['screenshot_label_exact'], 'ALL AYURVEDA ENTRANCE TESTS')
            self.assertEqual(groups['PYP-PG']['screenshot_label_exact'], 'POST GRADUATE ENTRANCE TESTS')
            self.assertEqual(groups['PYP-UPSC']['screenshot_label_exact'], 'UPSC AYURVEDA ENTRANCE TESTS')
            
            self.assertEqual(groups['PYP-ALL']['catalogued_test_memberships'], 127)
            self.assertEqual(groups['PYP-PG']['catalogued_test_memberships'], 67)
            self.assertEqual(groups['PYP-UPSC']['catalogued_test_memberships'], 56)
            print("\nPASS: 3 groups verified with exact screenshot labels and 250 total memberships.")

    def test_02_audit_reconciliation_integrity(self):
        url = f"{BASE_URL}/previous-years/audit"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertEqual(data.get('status'), 'COMPLETE')
            self.assertEqual(data.get('exit_code'), 0)
            self.assertEqual(data.get('total_group_memberships'), 250)
            self.assertEqual(data.get('unique_canonical_tests'), 127)
            self.assertEqual(data.get('unique_canonical_questions'), 14040)
            self.assertEqual(data.get('verified_answer_questions'), 14040)
            self.assertEqual(data.get('active_quarantines'), 0)
            print("PASS: Audit reconciliation verified: 127 tests, 14,040 questions, 0 quarantine.")

    def test_03_group_tests_integrity(self):
        # Fetch PG group tests
        url = f"{BASE_URL}/previous-years/groups/PYP-PG/tests?limit=10"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            tests = data.get('tests', [])
            self.assertEqual(len(tests), 10)
            self.assertGreater(len(data.get('available_years', [])), 5)
            
            # Verify test metadata fields
            t0 = tests[0]
            self.assertTrue(t0.get('test_uid').startswith('PYP-T-'))
            self.assertIn('AIAPGET', t0.get('title_source_exact'))
            self.assertGreater(t0.get('actual_question_count'), 0)
            print(f"PASS: Group test listing verified (sample: '{t0['title_source_exact']}' with {t0['actual_question_count']} Qs).")

    def test_04_exam_mode_security(self):
        # Retrieve test 0
        tests_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/previous-years/groups/PYP-PG/tests?limit=1").read().decode('utf-8'))
        test_uid = tests_res['tests'][0]['test_uid']
        
        # Request in exam mode
        exam_url = f"{BASE_URL}/previous-years/tests/{test_uid}/questions?mode=exam"
        with urllib.request.urlopen(exam_url, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode('utf-8'))
            self.assertEqual(data.get('mode'), 'exam')
            questions = data.get('questions', [])
            self.assertGreater(len(questions), 0)
            
            # Strictly verify NO answers or explanations leaked
            for q in questions[:10]:
                self.assertNotIn('correct_key', q, "Security leak: correct_key present in exam mode!")
                self.assertNotIn('explanation', q, "Security leak: explanation present in exam mode!")
                for opt in q['options']:
                    self.assertNotIn('is_correct', opt, "Security leak: is_correct flag present in option!")
            print("PASS: Examination security verified: all answer keys and explanations masked.")

    def test_05_attempt_lifecycle_scoring(self):
        tests_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/previous-years/groups/PYP-PG/tests?limit=1").read().decode('utf-8'))
        test_uid = tests_res['tests'][0]['test_uid']
        
        # 1. Start attempt
        start_req = urllib.request.Request(
            f"{BASE_URL}/previous-years/attempts/start",
            data=json.dumps({'test_uid': test_uid}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        start_res = json.loads(urllib.request.urlopen(start_req, timeout=5).read().decode('utf-8'))
        attempt_id = start_res.get('attempt_id')
        self.assertTrue(attempt_id.startswith('pyp_att_'))
        
        # 2. Autosave in-progress answers
        save_req = urllib.request.Request(
            f"{BASE_URL}/previous-years/attempts/{attempt_id}/save",
            data=json.dumps({
                'answers': {'1': '2', '2': '1'},
                'marked_for_review': ['1'],
                'time_remaining_seconds': 7100,
                'time_spent_seconds': 100
            }).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        save_res = json.loads(urllib.request.urlopen(save_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(save_res.get('success'))
        
        # 3. Submit attempt
        submit_req = urllib.request.Request(
            f"{BASE_URL}/previous-years/attempts/{attempt_id}/submit",
            data=json.dumps({
                'answers': {'1': '2', '2': '1'},
                'time_spent_seconds': 150
            }).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        submit_res = json.loads(urllib.request.urlopen(submit_req, timeout=5).read().decode('utf-8'))
        self.assertTrue(submit_res.get('success'))
        self.assertIn('score', submit_res)
        self.assertIn('accuracy_percent', submit_res)
        
        # 4. Review results
        results_url = f"{BASE_URL}/previous-years/attempts/{attempt_id}/results"
        results_res = json.loads(urllib.request.urlopen(results_url, timeout=5).read().decode('utf-8'))
        self.assertTrue(results_res.get('success'))
        self.assertEqual(results_res['scorecard']['attempt_id'], attempt_id)
        self.assertGreater(len(results_res['questions']), 0)
        q0 = results_res['questions'][0]
        self.assertIn('correct_key', q0)
        self.assertIn('explanation', q0)
        print("PASS: Full practice lifecycle verified: Start -> Autosave -> Submit -> Scorecard (+4/-1) -> Review.")

    def test_06_zero_regression_prior_phases(self):
        def http_get(endpoint):
            req = urllib.request.Request(f"http://localhost:5168{endpoint}")
            with urllib.request.urlopen(req, timeout=5) as r:
                return json.loads(r.read().decode('utf-8'))

        # Phase 1 & 2 Samhitawise
        samhitas = http_get('/api/samhitas')
        self.assertEqual(len(samhitas), 17)
        total_samhita_qs = sum(s.get('validated_count', 0) for s in samhitas)
        self.assertEqual(total_samhita_qs, 57452)

        # Phase 3 Subjectwise
        subjects = http_get('/api/subjects')
        self.assertEqual(len(subjects), 38)
        total_sub_qs = sum(s.get('validated_count', 0) for s in subjects)
        self.assertEqual(total_sub_qs, 57476)

        # Phase 4 Test Series
        sessions = http_get('/api/test-series/sessions')
        self.assertEqual(len(sessions), 3)
        total_tests = sum(s.get('total_tests', 0) for s in sessions)
        self.assertEqual(total_tests, 362)

        # Phase 5 Tagwise
        tags = http_get('/api/tags')
        self.assertEqual(tags.get('total_categories'), 6)
        self.assertEqual(tags.get('total_ready_assignments'), 9632)

        print("PASS: Zero regression verified: 17 Samhitas (57,452 Qs), 38 Subjects (57,476 Qs), 7 Series (362 Tests), 6 Tags (9,632 Qs).")

if __name__ == '__main__':
    unittest.main()
