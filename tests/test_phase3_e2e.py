import urllib.request, json, unittest

BASE_API = "http://127.0.0.1:5168/api"

def api_get(endpoint):
    req = urllib.request.Request(f"{BASE_API}{endpoint}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_post(endpoint, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_API}{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

class TestPhase3EndToEnd(unittest.TestCase):

    def test_01_all_38_subjects_returned(self):
        subs = api_get("/subjects")
        self.assertEqual(len(subs), 38, f"Expected 38 subjects, got {len(subs)}")
        
        # Verify first and last
        self.assertEqual(subs[0]["id"], "SUB-001")
        self.assertEqual(subs[0]["display_name"], "Kayachikitsa")
        self.assertEqual(subs[0]["validated_count"], 6759)
        self.assertEqual(subs[0]["status"], "ready")

        self.assertEqual(subs[-1]["id"], "SUB-038")
        self.assertEqual(subs[-1]["display_name"], "Orthopaedics")
        self.assertEqual(subs[-1]["validated_count"], 8)
        self.assertEqual(subs[-1]["status"], "ready")

        total_validated = sum(s["validated_count"] for s in subs)
        self.assertEqual(total_validated, 57476, f"Expected 57,476 total subject assignments, got {total_validated}")
        print(f"PASS: 38 subjects verified with total {total_validated} validated questions.")

    def test_02_single_subject_detail(self):
        sub = api_get("/subjects/SUB-038")
        self.assertEqual(sub["id"], "SUB-038")
        self.assertEqual(sub["display_name"], "Orthopaedics")
        self.assertEqual(sub["validated_count"], 8)
        self.assertTrue(len(sub["breadcrumbs"]) >= 3)
        print("PASS: Single subject detail and breadcrumbs verified.")

    def test_03_questions_list_for_subject(self):
        qdata = api_get("/questions?node_id=SUB-038&limit=10&offset=0&review_mode=true")
        self.assertEqual(qdata["node_id"], "SUB-038")
        self.assertEqual(len(qdata["questions"]), 8)
        
        q0 = qdata["questions"][0]
        self.assertTrue(len(q0["stem"]) > 0)
        self.assertEqual(len(q0["options"]), 4)
        self.assertTrue(any(opt.get("is_correct") for opt in q0["options"]))
        print("PASS: Subject questions list, options, and answers verified.")

    def test_04_subject_practice_session_lifecycle(self):
        # 1. Start practice test
        session = api_post("/practice/start", {
            "mode": "chapter",
            "scope_node_id": "SUB-038",
            "count": 5,
            "shuffle": True,
            "timed": True,
            "duration_mins": 10
        })
        self.assertIn("session_id", session)
        self.assertEqual(session["total_questions"], 5)
        self.assertEqual(len(session["questions"]), 5)
        sess_id = session["session_id"]
        q0 = session["questions"][0]

        # 2. Answer question 1
        ans_opt_id = q0["options"][0]["option_id"]
        ans_res = api_post(f"/practice/{sess_id}/answer", {
            "question_id": q0["question_id"],
            "selected_option_ids": [ans_opt_id],
            "time_ms": 3500,
            "is_bookmarked": True
        })
        self.assertTrue(ans_res.get("success"))

        # 3. Retrieve session for resume
        retrieved = api_get(f"/practice/{sess_id}")
        self.assertEqual(retrieved["session_id"], sess_id)
        self.assertIn(q0["question_id"], retrieved["saved_answers"])
        self.assertTrue(retrieved["saved_bookmarks"].get(q0["question_id"]))

        # 4. Submit practice test
        result = api_post(f"/practice/{sess_id}/submit", {})
        self.assertEqual(result["session_id"], sess_id)
        self.assertEqual(result["total_questions"], 5)
        self.assertEqual(result["correct_count"] + result["incorrect_count"] + result["unattempted_count"], 5)
        self.assertEqual(len(result["review"]), 5)
        print("PASS: Full subject practice session lifecycle verified.")

    def test_05_samhitawise_zero_regression(self):
        # Ensure Phase 1 and Phase 2 Samhitawise continue to work without a hitch
        samhitas = api_get("/samhitas")
        self.assertEqual(len(samhitas), 17)
        total_samhita_validated = sum(s["validated_count"] for s in samhitas)
        self.assertEqual(total_samhita_validated, 57452)

        # Check Charaka Sutrasthana
        charaka_su = api_get("/nodes/SAM-01-STH-01")
        self.assertEqual(charaka_su["id"], "SAM-01-STH-01")
        self.assertTrue(len(charaka_su["children"]) >= 30)

        # Check Charaka Sutra Chapter 1 questions
        ch1_qdata = api_get("/questions?node_id=SAM-01-STH-01-CH-01&limit=5")
        self.assertEqual(ch1_qdata["node_id"], "SAM-01-STH-01-CH-01")
        self.assertEqual(len(ch1_qdata["questions"]), 5)
        print(f"PASS: Samhitawise zero-regression verified (17 Samhitas, {total_samhita_validated} validated questions).")

if __name__ == "__main__":
    unittest.main()
