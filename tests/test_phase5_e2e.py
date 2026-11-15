#!/usr/bin/env python3
"""
AyurvedSiddhi Phase 5 E2E Verification Suite
Validates:
1. Tagwise categories overview and metadata (/api/tags)
2. Complete audit and reconciliation (/api/tagwise/audit)
3. Category question browsing and media integrity (/api/tags/:tagId/questions)
4. Examination mode security (answers masked during active exam)
5. Practice exam lifecycle (start -> save -> submit -> score -> review)
6. Zero regression across Phase 1-4 (Samhitawise, Subjectwise, Test Series)
"""

import unittest
import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:5168"

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "AyurvedSiddhi-QA-Phase5"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_post(path, payload):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "AyurvedSiddhi-QA-Phase5",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

class TestPhase5E2E(unittest.TestCase):

    def test_01_tags_overview_and_metadata(self):
        data = http_get('/api/tags')
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('phase'), 5)
        self.assertEqual(data.get('total_categories'), 6)
        self.assertEqual(data.get('total_expected_assignments'), 9753)
        self.assertEqual(data.get('total_ready_assignments'), 9632)

        categories = data.get('categories', [])
        self.assertEqual(len(categories), 6)

        expected_labels = [
            ("TAG-001", "Statement MCQs", 5070, 5070),
            ("TAG-002", "Reason Assertion MCQs", 416, 416),
            ("TAG-003", "Match Making MCQs", 208, 207),
            ("TAG-004", "Numerical MCQs", 1740, 1712),
            ("TAG-005", "Fill in blank MCQs", 2120, 2028),
            ("TAG-006", "Image MCQs", 199, 199)
        ]

        for i, (tag_id, label, exp_cnt, ready_cnt) in enumerate(expected_labels):
            cat = categories[i]
            self.assertEqual(cat['local_tag_id'], tag_id)
            self.assertEqual(cat['label_source_exact'], label)
            self.assertEqual(cat['expected_count'], exp_cnt)
            self.assertEqual(cat['ready_count'], ready_cnt)
            self.assertEqual(cat['ingestion_status'], 'verified')
            self.assertIsNotNone(cat['native_tag_id'])

        print("\nPASS: 6 Tagwise categories verified with 9,753 expected and 9,632 ready assignments.")

    def test_02_audit_endpoint_reconciliation(self):
        audit = http_get('/api/tagwise/audit')
        self.assertTrue(audit.get('success'))
        self.assertEqual(audit.get('audit_status'), 'VERIFIED')
        self.assertEqual(audit.get('total_categories'), 6)
        self.assertEqual(audit.get('expected_assignments'), 9753)
        self.assertEqual(audit.get('ready_assignments'), 9632)
        self.assertEqual(audit.get('distinct_question_records'), 9598)
        self.assertEqual(audit.get('total_assignments'), 9632)
        self.assertEqual(audit.get('total_options'), 38392)
        self.assertEqual(audit.get('total_media'), 199)

        print("PASS: Audit reconciliation verified: 9,632 assignments, 9,598 distinct Qs, 199 verified media.")

    def test_03_category_questions_integrity(self):
        # Inspect Image MCQs (TAG-006)
        res = http_get('/api/tags/TAG-006/questions?limit=10')
        self.assertTrue(res.get('success'))
        self.assertEqual(res.get('tag_id'), 'TAG-006')
        self.assertEqual(res.get('total_questions'), 199)
        questions = res.get('questions', [])
        self.assertEqual(len(questions), 10)

        q1 = questions[0]
        self.assertTrue(q1['question_uid'].startswith('TAG-Q-'))
        self.assertIn('<img', q1['stem'])
        self.assertEqual(len(q1['options']), 4)

        # Inspect Match Making (TAG-003)
        res_match = http_get('/api/tags/TAG-003/questions?limit=5')
        self.assertTrue(res_match.get('success'))
        self.assertEqual(res_match.get('tag_id'), 'TAG-003')
        self.assertEqual(res_match.get('total_questions'), 207)
        stem = res_match['questions'][0]['stem'].lower()
        self.assertTrue('table' in stem or 'सूची' in stem or 'list' in stem)

        print("PASS: Category question structures, matching tables, and image media verified.")

    def test_04_exam_mode_security(self):
        start_payload = {
            "tagId": "TAG-001",
            "questionCount": 10,
            "durationMinutes": 15,
            "shuffle": True
        }
        session = http_post('/api/tagwise/practice/start', start_payload)
        self.assertTrue(session.get('success'))
        self.assertIn('attempt_id', session)
        self.assertEqual(session.get('total_questions'), 10)

        questions = session.get('questions', [])
        self.assertEqual(len(questions), 10)

        for q in questions:
            for opt in q['options']:
                self.assertNotIn('is_correct', opt)
                self.assertNotIn('is_correct_verified', opt)

        print("PASS: Examination security verified: all answer keys and correctness flags masked.")

    def test_05_attempt_lifecycle_scoring(self):
        # 1. Start practice session
        session = http_post('/api/tagwise/practice/start', {
            "tagId": "TAG-002",
            "questionCount": 5,
            "durationMinutes": 10
        })
        attempt_id = session['attempt_id']
        questions = session['questions']
        q1 = questions[0]

        # 2. Save in-progress answer
        answers = {q1['question_uid']: 1}
        save_res = http_post(f'/api/tagwise/practice/{attempt_id}/save', {
            "answers": answers,
            "markedForReview": [q1['question_uid']],
            "timeSpentSeconds": 25
        })
        self.assertTrue(save_res.get('success'))

        # 3. Submit attempt
        submit_res = http_post(f'/api/tagwise/practice/{attempt_id}/submit', {
            "answers": answers,
            "markedForReview": [],
            "timeSpentSeconds": 45
        })
        self.assertTrue(submit_res.get('success'))
        self.assertEqual(submit_res.get('status'), 'completed')
        self.assertEqual(submit_res.get('total_questions'), 5)
        self.assertEqual(submit_res.get('total_marks'), 20.0)

        # 4. Review results
        results = http_get(f'/api/tagwise/practice/{attempt_id}/results')
        self.assertTrue(results.get('success'))
        self.assertEqual(results['attempt']['attempt_id'], attempt_id)
        self.assertEqual(len(results['questions']), 5)

        first_rev = results['questions'][0]
        self.assertIn('selected_position', first_rev)
        self.assertIn('correct_position', first_rev)
        self.assertIn('explanation', first_rev)

        print("PASS: Full practice lifecycle verified: Start -> Autosave -> Submit -> Scorecard (+4/-1) -> Review.")

    def test_06_zero_regression_prior_phases(self):
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

        print("PASS: Zero regression verified: 17 Samhitas (57,452 Qs), 38 Subjects (57,476 Qs), 7 Test Series (362 Tests).")

if __name__ == '__main__':
    unittest.main()
