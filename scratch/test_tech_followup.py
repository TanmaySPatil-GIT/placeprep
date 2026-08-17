import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def test_tech_interview_followup():
    client = app.test_client()

    sample_tech_answer = "I implemented Redis caching with a cache-aside pattern and set an LRU eviction policy with a 5-minute TTL to handle high-frequency read traffic."

    payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "experienceLevel": "Fresher",
        "experienceYears": "0-2",
        "difficultyLevel": "Medium",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": [
            {
                "role": "interviewer",
                "text": "How do you handle database caching and cache invalidation under high traffic?"
            },
            {
                "role": "candidate",
                "text": sample_tech_answer
            }
        ],
        "topicFollowupCount": 0,
        "nextPlannedQuestion": "Explain how garbage collection works in Java or V8 engine.",
        "recentQuestions": [
            "How do you handle database caching and cache invalidation under high traffic?",
            "Explain how garbage collection works in Java or V8 engine."
        ]
    }

    print("\n=================== [TESTING TECHNICAL INTERVIEW FOLLOW-UP API] ===================")
    print("Interview Type: Technical")
    print(f"Candidate Answer: \"{sample_tech_answer}\"")
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
    test_tech_interview_followup()
