import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, get_company_tier_info

def run_test():
    client = app.test_client()

    sample_partially_correct_answer = "Binary Search Tree lookup is always O(log N) because at each step we divide the search space in half."

    payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Hard",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "topicFollowupCount": 0,
        "nextPlannedQuestion": "Explain how garbage collection works in Java or V8 Engine.",
        "conversationHistory": [
            {
                "role": "interviewer",
                "text": "Can you explain the worst-case time complexity for search operations in a Binary Search Tree?"
            },
            {
                "role": "candidate",
                "text": sample_partially_correct_answer
            }
        ]
    }

    print("=================== SENDING TEST PAYLOAD ===================")
    print("Question Asked: Can you explain the worst-case time complexity for search operations in a Binary Search Tree?")
    print(f"Candidate Spoken Answer: \"{sample_partially_correct_answer}\"")
    print("============================================================\n")

    res = client.post('/api/interview-followup', json=payload)
    data = res.get_json()

    print("=================== AI GENERATED RESPONSE ===================")
    print(f"HTTP Status: {res.status_code}")
    print(f"Action: {data.get('action')}")
    print(f"Question / Transition Text: {data.get('questionText')}")
    print(f"AI Reasoning: {data.get('reasoning')}")
    print("============================================================\n")

if __name__ == '__main__':
    run_test()
