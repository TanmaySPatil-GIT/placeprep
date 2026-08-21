import os
import sys
import json
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

class TestQuestionGeneratorEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_repeat_question_strategy(self):
        payload = {
            "sessionId": "test_gen_1",
            "strategy": "repeat_question",
            "evaluatorOutput": {"verdict": "vague"},
            "currentTopicId": "oop-inheritance",
            "sessionState": {"selectedCompany": "Amazon", "selectedField": "sde"}
        }
        resp = self.client.post('/api/generate-question', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        print("\n=== TEST RESULT: REPEAT QUESTION STRATEGY ===")
        print(json.dumps(data, indent=2))
        self.assertIn("interviewerResponse", data)
        self.assertTrue(len(data["interviewerResponse"]) > 10)

    def test_guiding_question_no_reveal_strategy(self):
        payload = {
            "sessionId": "test_gen_2",
            "strategy": "guiding_question_no_reveal",
            "evaluatorOutput": {
                "verdict": "incorrect",
                "conceptsWrong": ["Confused overriding with overloading"],
                "conceptsMissing": ["Runtime polymorphism"]
            },
            "currentTopicId": "oop-inheritance",
            "sessionState": {"selectedCompany": "Google", "selectedField": "sde"}
        }
        resp = self.client.post('/api/generate-question', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        print("\n=== TEST RESULT: GUIDING QUESTION NO REVEAL STRATEGY ===")
        print(json.dumps(data, indent=2))
        self.assertIn("interviewerResponse", data)

    def test_affirm_and_crossquestion_strategy(self):
        payload = {
            "sessionId": "test_gen_3",
            "strategy": "affirm_correct_part_and_crossquestion_wrong_part",
            "evaluatorOutput": {
                "verdict": "partially_correct",
                "conceptsCorrect": ["Inheritance is-a relationship"],
                "conceptsMissing": ["Composition fragile base class problem"]
            },
            "currentTopicId": "oop-inheritance",
            "sessionState": {"selectedCompany": "Microsoft", "selectedField": "sde"}
        }
        resp = self.client.post('/api/generate-question', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        print("\n=== TEST RESULT: AFFIRM & CROSS-QUESTION STRATEGY ===")
        print(json.dumps(data, indent=2))
        self.assertIn("interviewerResponse", data)

    def test_turn_pipeline_endpoint(self):
        payload = {
            "sessionState": {
                "sessionId": "test_pipeline_sess",
                "selectedCompany": "Uber",
                "selectedField": "sde",
                "currentTopicId": "oop-inheritance",
                "currentDepth": 0
            },
            "question": "Explain the difference between Inheritance and Composition.",
            "studentAnswer": "Inheritance is method overloading, while composition is private members."
        }
        resp = self.client.post('/api/interview-session-turn', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        print("\n=== TEST RESULT: FULL 3-STAGE TURN PIPELINE ===")
        print(json.dumps(data, indent=2))
        self.assertIn("evaluatorOutput", data)
        self.assertIn("decisionOutput", data)
        self.assertIn("interviewerResponse", data)

if __name__ == '__main__':
    unittest.main()
