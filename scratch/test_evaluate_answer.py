import os
import sys
import json
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

class TestEvaluateAnswerEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_overriding_overloading_misconception(self):
        """Test isolated evaluation of candidate confusing overriding with overloading on oop-inheritance."""
        payload = {
            "sessionId": "test_session_wrong",
            "lastQuestionAsked": "Explain the concept of Inheritance in OOP, contrast it with Composition, and describe a scenario where inheriting from a class would be an anti-pattern.",
            "studentAnswer": "Inheritance is method overloading where a subclass changes method signatures, and private members of parent class are directly inherited and accessible.",
            "currentTopicId": "oop-inheritance"
        }

        response = self.client.post('/api/evaluate-answer', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        print("\n=== TEST RESULT: OVERRIDING/OVERLOADING CONFUSION ===")
        print(json.dumps(data, indent=2))

        self.assertIn(data.get('verdict'), ['incorrect', 'partially_correct'])
        self.assertTrue(len(data.get('conceptsWrong', [])) > 0 or len(data.get('conceptsMissing', [])) > 0)
        self.assertIn('reason', data)
        print("PASS: Misconception correctly flagged by Evaluator!")

    def test_dont_know_answer(self):
        """Test isolated evaluation of candidate stating 'I don't know'."""
        payload = {
            "sessionId": "test_session_idk",
            "lastQuestionAsked": "Explain database normalization and 3NF rules.",
            "studentAnswer": "I don't know, I'm not really sure about normalization rules.",
            "currentTopicId": "dbms-normalization"
        }

        response = self.client.post('/api/evaluate-answer', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        print("\n=== TEST RESULT: 'DON'T KNOW' RESPONSE ===")
        print(json.dumps(data, indent=2))

        self.assertEqual(data.get('verdict'), 'dont_know')
        self.assertEqual(data.get('confidenceOfStudent'), 'low')
        self.assertTrue(data.get('followUpWorthy'))
        print("PASS: 'dont_know' verdict correctly returned!")

    def test_correct_answer(self):
        """Test isolated evaluation of a strong, correct candidate answer."""
        payload = {
            "sessionId": "test_session_correct",
            "lastQuestionAsked": "Explain the concept of Inheritance in OOP and contrast it with Composition.",
            "studentAnswer": "Inheritance enables a subclass to derive fields and methods from a superclass establishing an is-a relationship. Composition establishes a has-a relationship where a class contains references to other objects, which is often preferred over inheritance to avoid tight coupling and fragile base class problems.",
            "currentTopicId": "oop-inheritance"
        }

        response = self.client.post('/api/evaluate-answer', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        print("\n=== TEST RESULT: CORRECT ANSWER ===")
        print(json.dumps(data, indent=2))

        self.assertIn(data.get('verdict'), ['correct', 'partially_correct'])
        self.assertTrue(len(data.get('conceptsCorrect', [])) > 0)
        print("PASS: Correct/partially correct answer evaluated accurately!")

if __name__ == '__main__':
    unittest.main()
