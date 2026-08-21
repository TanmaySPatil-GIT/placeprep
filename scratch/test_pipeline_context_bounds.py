import os
import sys
import json
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

class TestPipelineContextBounds(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_evaluator_and_generator_bounded_context(self):
        session_state = {
            "sessionId": "test_bounded_sess_99",
            "selectedCompany": "Microsoft",
            "selectedField": "sde",
            "roundType": "technical",
            "currentTopicId": "oop-inheritance",
            "currentDepth": 1,
            "historySummary": "Covered DBMS-Normalization: correctly explained 3NF and BCNF, but missed surrogate key trade-offs after 2 follow-ups.\nCovered Data Structures-Hash Tables: explained average O(1) lookup, but confused chaining with open addressing after 1 follow-up.\n",
            "recentTurns": [
                {"role": "interviewer", "text": "Explain how inheritance enables runtime polymorphism."},
                {"role": "student", "text": "Subclasses can override superclass methods to provide specific runtime behavior."}
            ]
        }

        # 1. Test Evaluator (Prompt 3)
        eval_payload = {
            "sessionId": session_state["sessionId"],
            "lastQuestionAsked": "Explain how inheritance enables runtime polymorphism.",
            "studentAnswer": "Subclasses can override superclass methods to provide specific runtime behavior.",
            "currentTopicId": "oop-inheritance",
            "sessionState": session_state
        }
        eval_resp = self.client.post('/api/evaluate-answer', data=json.dumps(eval_payload), content_type='application/json')
        self.assertEqual(eval_resp.status_code, 200)
        eval_data = json.loads(eval_resp.data)
        print("\n=== EVALUATOR BOUNDED CONTEXT TEST ===")
        print(json.dumps(eval_data, indent=2))
        self.assertIn("verdict", eval_data)

        # 2. Test Question Generator (Prompt 5)
        gen_payload = {
            "sessionId": session_state["sessionId"],
            "strategy": "probe_missing_nuance",
            "evaluatorOutput": eval_data,
            "currentTopicId": "oop-inheritance",
            "sessionState": session_state
        }
        gen_resp = self.client.post('/api/generate-question', data=json.dumps(gen_payload), content_type='application/json')
        self.assertEqual(gen_resp.status_code, 200)
        gen_data = json.loads(gen_resp.data)
        print("\n=== GENERATOR BOUNDED CONTEXT TEST ===")
        print(json.dumps(gen_data, indent=2))
        self.assertIn("interviewerResponse", gen_data)

if __name__ == '__main__':
    unittest.main()
