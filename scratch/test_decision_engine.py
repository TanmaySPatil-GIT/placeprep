import os
import sys
import json
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, evaluate_decision_engine, check_navigation_intent

class TestDecisionEngineBackend(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_repeat_intent(self):
        res = evaluate_decision_engine({}, {}, "can you repeat the question please?")
        self.assertEqual(res['strategy'], 'repeat_question')
        self.assertFalse(res['topicAdvance'])

    def test_simplify_intent(self):
        res = evaluate_decision_engine({}, {}, "please simplify the question")
        self.assertEqual(res['strategy'], 'simplify_question')
        self.assertFalse(res['topicAdvance'])

    def test_hard_rule_depth_3(self):
        res = evaluate_decision_engine(
            {'verdict': 'partially_correct'},
            {'currentDepth': 3, 'difficultyLevel': 'medium'},
            "some answer"
        )
        self.assertEqual(res['strategy'], 'move_to_next_topic')
        self.assertTrue(res['topicAdvance'])

    def test_consecutive_weak_verdicts(self):
        res = evaluate_decision_engine(
            {'verdict': 'incorrect'},
            {
                'currentDepth': 1,
                'difficultyLevel': 'hard',
                'evaluationLog': [{'verdict': 'dont_know'}]
            },
            "wrong answer"
        )
        self.assertEqual(res['strategy'], 'drop_difficulty_offer_easier_related')
        self.assertTrue(res['topicAdvance'])
        self.assertEqual(res['newDifficultyLevel'], 'medium')

    def test_correct_high_confidence(self):
        res = evaluate_decision_engine(
            {'verdict': 'correct', 'confidenceOfStudent': 'high', 'conceptsMissing': []},
            {'currentDepth': 1, 'difficultyLevel': 'medium'},
            "great answer"
        )
        self.assertEqual(res['strategy'], 'increase_difficulty_or_new_topic')
        self.assertTrue(res['topicAdvance'])
        self.assertEqual(res['newDifficultyLevel'], 'hard')

    def test_correct_missing_nuance(self):
        res = evaluate_decision_engine(
            {'verdict': 'correct', 'confidenceOfStudent': 'high', 'conceptsMissing': ['polymorphism']},
            {'currentDepth': 1, 'difficultyLevel': 'medium'},
            "good answer"
        )
        self.assertEqual(res['strategy'], 'probe_missing_nuance')
        self.assertFalse(res['topicAdvance'])

    def test_partially_correct(self):
        res = evaluate_decision_engine(
            {'verdict': 'partially_correct'},
            {'currentDepth': 1, 'difficultyLevel': 'medium'},
            "partial answer"
        )
        self.assertEqual(res['strategy'], 'affirm_correct_part_and_crossquestion_wrong_part')
        self.assertFalse(res['topicAdvance'])

    def test_incorrect_depth1(self):
        res = evaluate_decision_engine(
            {'verdict': 'incorrect'},
            {'currentDepth': 1, 'difficultyLevel': 'medium'},
            "wrong answer"
        )
        self.assertEqual(res['strategy'], 'guiding_question_no_reveal')
        self.assertFalse(res['topicAdvance'])

    def test_incorrect_depth2(self):
        res = evaluate_decision_engine(
            {'verdict': 'incorrect'},
            {'currentDepth': 2, 'difficultyLevel': 'medium', 'evaluationLog': [{'verdict': 'partially_correct'}]},
            "wrong answer depth 2"
        )
        self.assertEqual(res['strategy'], 'gentle_correct_then_retest')
        self.assertFalse(res['topicAdvance'])

    def test_vague(self):
        res = evaluate_decision_engine(
            {'verdict': 'vague'},
            {'currentDepth': 0, 'difficultyLevel': 'medium'},
            "hand wavy"
        )
        self.assertEqual(res['strategy'], 'ask_narrower_version')

    def test_dont_know(self):
        res = evaluate_decision_engine(
            {'verdict': 'dont_know'},
            {'currentDepth': 0, 'difficultyLevel': 'medium'},
            "idk"
        )
        self.assertEqual(res['strategy'], 'simplify_or_hint')

    def test_api_endpoint(self):
        payload = {
            "evaluatorOutput": {"verdict": "partially_correct"},
            "sessionState": {"currentDepth": 1, "difficultyLevel": "medium"},
            "studentAnswer": "my answer"
        }
        response = self.client.post('/api/decide-next-step', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('strategy'), 'affirm_correct_part_and_crossquestion_wrong_part')

if __name__ == '__main__':
    unittest.main()
