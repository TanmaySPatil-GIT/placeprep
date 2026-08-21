import os
import sys
import json
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

class TestReportEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_generate_final_report_from_session_state(self):
        session_state = {
            "sessionId": "session_py_test_888",
            "selectedCompany": "Amazon",
            "selectedField": "sde",
            "roundType": "technical",
            "historySummary": "Covered OOP - Inheritance: correctly explained code reuse via superclasses, but confused overriding with overloading after 2 follow-ups.\n",
            "topicPlan": [
                {"topicId": "oop-inheritance", "topicName": "OOP - Inheritance", "status": "completed", "mastery": 85},
                {"topicId": "dbms-normalization", "topicName": "DBMS - Normalization", "status": "completed", "mastery": 65}
            ],
            "evaluationLog": [
                {
                    "turnIndex": 1,
                    "topicId": "oop-inheritance",
                    "topicName": "OOP - Inheritance",
                    "score": 75,
                    "verdict": "partially_correct",
                    "conceptsCorrect": ["Code reuse via inheritance"],
                    "conceptsWrong": ["Confused method overriding with method overloading"],
                    "conceptsMissing": ["Runtime polymorphism"]
                },
                {
                    "turnIndex": 2,
                    "topicId": "oop-inheritance",
                    "topicName": "OOP - Inheritance",
                    "score": 95,
                    "verdict": "correct",
                    "conceptsCorrect": ["Runtime polymorphism via method overriding"],
                    "conceptsWrong": [],
                    "conceptsMissing": []
                },
                {
                    "turnIndex": 3,
                    "topicId": "dbms-normalization",
                    "topicName": "DBMS - Normalization",
                    "score": 50,
                    "verdict": "incorrect",
                    "conceptsCorrect": [],
                    "conceptsWrong": ["Thinking 3NF eliminates all redundancy"],
                    "conceptsMissing": ["BCNF determinant rule"]
                }
            ]
        }

        resp = self.client.post('/api/generate-final-report', data=json.dumps({"sessionState": session_state}), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        print("\n=== FLASK GENERATE FINAL REPORT TEST ===")
        print(json.dumps(data, indent=2))
        self.assertIn("topicMastery", data)
        self.assertIn("consolidatedMisconceptions", data)
        self.assertIn("suggestedRevisionAreas", data)

if __name__ == '__main__':
    unittest.main()
