import os
import sys
import json
from unittest.mock import patch

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_tests():
    client = app.test_client()
    print("=================== RUNNING DEGRADED STATE VERIFICATION ===================")

    # 1. Test /api/analyze-resume with forced Gemini failure
    print("\n--- Test 1: /api/analyze-resume forced failure ---")
    from unittest.mock import MagicMock
    import io

    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Candidate Resume: Senior Software Engineer with 4 years experience in Python, React, Cloud, Distributed Systems at Top Tech."

    with patch('pdfplumber.open') as mock_open, patch('app.call_gemini_with_model', return_value=(None, 'gemini-1.5-flash-test')):
        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_open.return_value.__enter__.return_value = mock_pdf
        data = {
            'resume': (io.BytesIO(b"%PDF-1.4 mock pdf text content"), 'resume.pdf'),
            'company': 'Google',
            'field': 'Software Development'
        }
        res = client.post('/api/analyze-resume', data=data, content_type='multipart/form-data')
        print(f"Status Code: {res.status_code}")
        body = res.get_json()
        print("Response degraded flag:", body.get('degraded'))
        print("Response degradedReason:", body.get('degradedReason'))
        print("Response atsScore:", body.get('atsScore'))
        assert body.get('degraded') is True, "Expected degraded to be True"
        assert body.get('atsScore') is None, "Expected atsScore to be None (not fabricated)"
        assert "couldn't fully analyze" in body.get('degradedReason', '').lower(), "Expected proper degradedReason"

    # 2. Test /api/recommendations with forced Gemini failure
    print("\n--- Test 2: /api/recommendations forced failure ---")
    with patch('app.call_gemini_with_model', return_value=(None, 'gemini-1.5-flash-test')):
        res = client.post('/api/recommendations', json={
            'fieldId': 'sde',
            'targetField': 'Software Development',
            'companyName': 'Google',
            'weakAreas': ['DSA'],
            'missingKeywords': ['Docker']
        })
        print(f"Status Code: {res.status_code}")
        body = res.get_json()
        print("Response degraded flag:", body.get('degraded'))
        print("Response degradedReason:", body.get('degradedReason'))
        assert body.get('degraded') is True, "Expected degraded to be True"
        assert "general recommendations" in body.get('degradedReason', '').lower(), "Expected general recommendations notice"
        assert len(body.get('recommendations', [])) > 0, "Expected catalog recommendations returned"

    # 3. Test /api/evaluate-answer with forced failure
    print("\n--- Test 3: /api/evaluate-answer forced failure ---")
    with patch('app.call_gemini_with_model', return_value=(None, 'gemini-1.5-flash-test')):
        res = client.post('/api/evaluate-answer', json={
            'sessionId': 'test_sess',
            'lastQuestionAsked': 'What is polymorphism?',
            'studentAnswer': 'It is when an object takes on multiple forms.',
            'currentTopicId': 'oop-polymorphism'
        })
        print(f"Status Code: {res.status_code}")
        body = res.get_json()
        print("Response verdict:", body.get('verdict'))
        print("Response evidenceQuote:", body.get('evidenceQuote'))
        print("Response degraded flag:", body.get('degraded'))
        assert body.get('verdict') == 'evaluation_unavailable', "Expected verdict 'evaluation_unavailable'"
        assert body.get('evidenceQuote') is None, "Expected evidenceQuote to be None"
        assert body.get('degraded') is True, "Expected degraded to be True"

    # 4. Test /api/generate-question with forced failure
    print("\n--- Test 4: /api/generate-question forced failure ---")
    with patch('app.call_gemini', return_value=None):
        res = client.post('/api/generate-question', json={
            'sessionId': 'test_sess',
            'strategy': 'simplify_question',
            'currentTopicId': 'oop-polymorphism',
            'evaluatorOutput': {'verdict': 'evaluation_unavailable'}
        })
        print(f"Status Code: {res.status_code}")
        body = res.get_json()
        print("Response isFallback flag:", body.get('isFallback'))
        print("Response interviewerResponse:", body.get('interviewerResponse'))
        assert body.get('isFallback') is True, "Expected isFallback to be True"
        assert body.get('degraded') is True, "Expected degraded to be True"

    # 5. Test /api/generate-final-report with excluded turns & fallback questions
    print("\n--- Test 5: /api/generate-final-report with excluded turns ---")
    eval_log = [
        {
            'turnIndex': 1,
            'topicId': 'oop-inheritance',
            'verdict': 'correct',
            'score': 100,
            'evidenceQuote': 'Classes inherit attributes from base classes.',
            'conceptsCorrect': ['inheritance', 'code reusability'],
            'conceptsWrong': [],
            'conceptsMissing': [],
            'isFallbackQuestion': False
        },
        {
            'turnIndex': 2,
            'topicId': 'oop-inheritance',
            'verdict': 'evaluation_unavailable',
            'score': None,
            'evidenceQuote': None,
            'conceptsCorrect': [],
            'conceptsWrong': [],
            'conceptsMissing': [],
            'isFallbackQuestion': True
        },
        {
            'turnIndex': 3,
            'topicId': 'oop-polymorphism',
            'verdict': 'evaluation_unavailable',
            'score': None,
            'evidenceQuote': None,
            'conceptsCorrect': [],
            'conceptsWrong': [],
            'conceptsMissing': [],
            'isFallbackQuestion': True
        }
    ]

    with patch('app.call_gemini', return_value=None):
        res = client.post('/api/generate-final-report', json={
            'selectedField': {'name': 'Software Development'},
            'selectedCompany': {'name': 'Google'},
            'sessionState': {
                'evaluationLog': eval_log,
                'topicPlan': [
                    {'topicId': 'oop-inheritance', 'topicName': 'Object-Oriented Inheritance', 'status': 'completed'},
                    {'topicId': 'oop-polymorphism', 'topicName': 'Polymorphism & Dynamic Dispatch', 'status': 'completed'}
                ]
            }
        })
        print(f"Status Code: {res.status_code}")
        body = res.get_json()
        print("excludedTurnsCount:", body.get('excludedTurnsCount'))
        print("fallbackQuestionsCount:", body.get('fallbackQuestionsCount'))
        print("degradedEvaluationsNotice:", body.get('degradedEvaluationsNotice'))
        print("fallbackQuestionsNotice:", body.get('fallbackQuestionsNotice'))
        print("Dimension tech correctness score:", body.get('dimensionScores', {}).get('technicalCorrectness', {}).get('score'))

        assert body.get('excludedTurnsCount') == 2, f"Expected 2 excluded turns, got {body.get('excludedTurnsCount')}"
        assert body.get('fallbackQuestionsCount') == 2, f"Expected 2 fallback questions, got {body.get('fallbackQuestionsCount')}"
        assert "2 response(s) could not be evaluated" in body.get('degradedEvaluationsNotice', '')
        assert "2 question(s) in this session used a fallback" in body.get('fallbackQuestionsNotice', '')
        # Since turn 1 was 'correct' (100) and turns 2 and 3 were excluded, tech score should be 100, NOT diluted by zeros or neutral!
        tech_score = body.get('dimensionScores', {}).get('technicalCorrectness', {}).get('score')
        assert tech_score == 100.0, f"Expected tech_score 100.0 for excluded turns, got {tech_score}"

    print("\n=================== ALL DEGRADED STATE TESTS PASSED SUCCESSFULLY! ===================")

if __name__ == '__main__':
    run_tests()
