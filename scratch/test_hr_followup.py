import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def test_hr_interview_followup():
    client = app.test_client()

    sample_hr_answer = "I focus on open communication, active listening, and aligning team priorities with project milestones. When conflicts arise, I organize 1-on-1 discussions to address concerns early."

    payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "hr",
        "difficultyLevel": "Medium",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": [
            {
                "role": "interviewer",
                "text": "Welcome to Stage 6 of your Google placement drive — the HR & Culture Fit Interview. How do you handle workplace conflict within a cross-functional team?"
            },
            {
                "role": "candidate",
                "text": sample_hr_answer
            }
        ],
        "topicFollowupCount": 0,
        "nextPlannedQuestion": "Tell me about a time when you had to adapt to a sudden change in project priorities.",
        "recentQuestions": [
            "How do you handle workplace conflict within a cross-functional team?",
            "Tell me about a time when you had to adapt to a sudden change in project priorities."
        ]
    }

    print("\n=================== [TESTING HR INTERVIEW FOLLOW-UP API] ===================")
    print("Interview Type: HR")
    print(f"Candidate Answer: \"{sample_hr_answer}\"")
    print("Payload sent to /api/interview-followup:")
    print(json.dumps(payload, indent=2))
    print("-----------------------------------------------------------------------------")

    res = client.post('/api/interview-followup', json=payload)
    data = res.get_json()

    print("\n=================== [BACKEND RESPONSE RECEIVED] ===================")
    print(f"HTTP Status: {res.status_code}")
    print(f"Action: {data.get('action')}")
    print(f"Question Text: \"{data.get('questionText')}\"")
    print(f"Reasoning: \"{data.get('reasoning')}\"")
    print("================================================--------------------\n")

if __name__ == '__main__':
    test_hr_interview_followup()
