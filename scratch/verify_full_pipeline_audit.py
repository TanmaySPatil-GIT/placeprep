import os
import sys
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, validate_evidence_quote

class FullArchitectureAuditTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_01_evaluator_output_schema_and_evidence_quote(self):
        """Requirement 1 & 2: Output schema has all required fields and evidenceQuote is grounded."""
        transcript = "In Java, an interface can only have method signatures and no instance state. But abstract classes can have constructors and member variables."
        payload = {
            "topicId": "oop-inheritance",
            "topicName": "OOP - Inheritance",
            "question": "Explain the architectural difference between an interface and an abstract class in Java.",
            "transcript": transcript,
            "sessionHistory": ""
        }

        resp = self.client.post('/api/evaluate-answer', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200, f"Evaluator failed: {resp.data}")
        data = json.loads(resp.data)

        # 1. Output schema validation
        required_fields = [
            "verdict",
            "conceptsCorrect",
            "conceptsWrong",
            "conceptsMissing",
            "evidenceQuote",
            "rubricVersion",
            "modelUsed",
            "uncertainty",
            "reason"
        ]
        for field in required_fields:
            self.assertIn(field, data, f"Evaluator output missing required field: {field}")

        self.assertIn(data["verdict"], ["correct", "partially_correct", "incorrect", "vague", "off_topic", "dont_know"])
        self.assertIn(data["uncertainty"], ["low", "medium", "high"])
        self.assertTrue(isinstance(data["rubricVersion"], str) and len(data["rubricVersion"]) > 0)
        self.assertTrue(isinstance(data["modelUsed"], str) and len(data["modelUsed"]) > 0)

        # 2. Grounding validation: evidenceQuote must be traceable to transcript
        quote = data.get("evidenceQuote", "")
        self.assertTrue(len(quote) > 0, "evidenceQuote should not be empty for non-empty transcript")
        self.assertTrue(
            validate_evidence_quote(quote, transcript),
            f"evidenceQuote '{quote}' failed validation against transcript '{transcript}'"
        )
        print(f"[OK] Evaluator Schema & Grounding Verified. Model: {data['modelUsed']}, Rubric: {data['rubricVersion']}, Quote: '{quote}'")

    def test_02_evidence_quote_validator_rejects_hallucinations(self):
        """Requirement 2: Reject fabricated quotes not in transcript."""
        transcript = "I use hash maps for O(1) lookups in memory."
        hallucinated_quote = "I use Red-Black trees for O(log N) balance and memory guarantees."
        self.assertFalse(validate_evidence_quote(hallucinated_quote, transcript))

        real_quote = "hash maps for O(1) lookups"
        self.assertTrue(validate_evidence_quote(real_quote, transcript))
        print("[OK] Evidence Quote Validator correctly rejects ungrounded hallucinations")

    def test_03_deterministic_scoring_and_report_traceability(self):
        """Requirements 3, 4, 5, 6: Deterministic formula (v1.0-scoring), confidence badges, and traceable evidence."""
        transcript_1 = "I think 3NF eliminates all data redundancy and we never need BCNF."
        transcript_2 = "A deadlock occurs when processes hold resources while waiting for circular chains."

        session_state = {
            "sessionId": "audit_full_session_999",
            "selectedCompany": "Google",
            "selectedField": "sde",
            "roundType": "technical",
            "historySummary": "Interview covered normalization and concurrency.",
            "topicPlan": [
                {"topicId": "dbms-normalization", "topicName": "DBMS - Normalization", "status": "completed", "mastery": 50},
                {"topicId": "os-concurrency", "topicName": "OS - Concurrency", "status": "completed", "mastery": 90}
            ],
            "evaluationLog": [
                {
                    "turnIndex": 1,
                    "topicId": "dbms-normalization",
                    "topicName": "DBMS - Normalization",
                    "verdict": "incorrect",
                    "conceptsCorrect": [],
                    "conceptsWrong": ["Believing 3NF eliminates all redundancy"],
                    "conceptsMissing": ["BCNF multi-attribute candidate keys", "Decomposition trade-offs"],
                    "evidenceQuote": "3NF eliminates all data redundancy",
                    "transcript": transcript_1,
                    "uncertainty": "medium",
                    "rubricVersion": "v1.0-interviewRubrics",
                    "modelUsed": "gemini-2.5-flash",
                    "reason": "Candidate claimed 3NF removes all redundancy."
                },
                {
                    "turnIndex": 2,
                    "topicId": "os-concurrency",
                    "topicName": "OS - Concurrency",
                    "verdict": "correct",
                    "conceptsCorrect": ["Circular wait condition", "Mutual exclusion lock tracking"],
                    "conceptsWrong": [],
                    "conceptsMissing": [],
                    "evidenceQuote": "processes hold resources while waiting for circular chains",
                    "transcript": transcript_2,
                    "uncertainty": "low",
                    "rubricVersion": "v1.0-interviewRubrics",
                    "modelUsed": "gemini-2.5-flash",
                    "reason": "Clear explanation of Coffman conditions."
                }
            ]
        }

        payload = {
            "sessionState": session_state,
            "dsaOrTechnicalResults": {
                "score": 80,
                "aiAnalysis": {
                    "timeComplexity": "O(N log N)",
                    "spaceComplexity": "O(1)",
                    "correctness": True
                }
            },
            "interviewResults": {
                "speechTelemetry": {
                    "fillerWordCount": 2,
                    "wpm": 135
                }
            }
        }

        resp = self.client.post('/api/generate-final-report', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200, f"Report generation failed: {resp.data}")
        report = json.loads(resp.data)

        # Requirement 3: Deterministic Scoring Formula v1.0-scoring
        self.assertEqual(report.get("scoringFormulaVersion"), "v1.0-scoring")
        self.assertEqual(report.get("scoringFormulaName"), "deterministic-composite-readiness")
        self.assertIn("dimensionScores", report)

        dims = report["dimensionScores"]
        self.assertIn("technicalCorrectness", dims)
        self.assertIn("problemSolving", dims)
        self.assertIn("codingCorrectnessComplexity", dims)
        self.assertIn("communicationClarity", dims)

        # Expected score computation:
        # Technical correctness: 1 correct (100) + 1 incorrect (10) -> avg 55.0
        # Problem solving: 2 correct vs (2 correct + 2 missing) -> 2/4 = 50.0
        # Coding: score 80 + pass/O(N log N) -> ~80.0
        # Communication: 2 fillers, 135 WPM -> ~82.0
        # Composite = 0.35 * 55.0 + 0.25 * 50.0 + 0.25 * 80.0 + 0.15 * 82.0 = 19.25 + 12.5 + 20.0 + 12.3 = 64.05 -> ~64
        expected_composite = round(
            dims["technicalCorrectness"]["score"] * 0.35 +
            dims["problemSolving"]["score"] * 0.25 +
            dims["codingCorrectnessComplexity"]["score"] * 0.25 +
            dims["communicationClarity"]["score"] * 0.15
        )
        self.assertEqual(
            report["readinessScore"],
            expected_composite,
            f"Readiness score {report['readinessScore']} does not match deterministic formula calculation {expected_composite}"
        )
        print(f"[OK] Deterministic Composite Score Verified: {report['readinessScore']}% (Formula {report['scoringFormulaVersion']})")

        # Requirement 4 & 6: Traceable evidence quotes for every flagged weakness and misconception
        misconceptions = report.get("consolidatedMisconceptions", [])
        self.assertTrue(len(misconceptions) > 0, "Expected at least one consolidated misconception")

        for item in misconceptions:
            self.assertIn("evidenceQuote", item, f"Misconception item missing evidenceQuote: {item}")
            quote = item["evidenceQuote"]
            self.assertTrue(len(quote) > 0, f"Misconception evidenceQuote is empty: {item}")
            # Verify quote traces back to the candidate's actual words
            self.assertTrue(
                quote in transcript_1 or quote in transcript_2,
                f"Flagged quote '{quote}' not found in any session transcript!"
            )
            print(f"[OK] Traceable Feedback Verified: You said: '{quote}' -- relates to {item.get('misconception')}")

        # Requirement 5: Confidence indicator aggregation across turns
        # Turn 1 had uncertainty 'medium', turn 2 had 'low' -> avg uncertainty ~ 1.5 -> hasLowerConfidence flag
        self.assertTrue(dims["technicalCorrectness"]["hasLowerConfidence"] or dims["technicalCorrectness"]["uncertainty"] in ["medium", "high"])
        print("[OK] Visible Confidence Indicator Flagging Verified (medium uncertainty detected and exposed)")

if __name__ == '__main__':
    unittest.main()
