import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_test():
    client = app.test_client()

    opening_question = "Hi! Welcome to your Google mock interview for the Software Development track. Tell me about a technical project you built and the key architecture decisions you made."

    # Test Run 1: Detailed Technical Answer
    detailed_answer = "In my final year capstone project, I built a real-time collaborative document editor using Node.js, WebSockets, and Redis Pub/Sub. We used Operational Transformation (OT) to resolve concurrent editing conflicts and implemented a Redis caching layer that reduced database query latency by 45% under 1,000 concurrent user sessions."

    payload_detailed = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "topicFollowupCount": 0,
        "conversationHistory": [
            {"role": "interviewer", "text": opening_question},
            {"role": "candidate", "text": detailed_answer}
        ]
    }

    # Test Run 2: One-Word Non-Answer
    one_word_answer = "Fine."

    payload_one_word = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "topicFollowupCount": 0,
        "conversationHistory": [
            {"role": "interviewer", "text": opening_question},
            {"role": "candidate", "text": one_word_answer}
        ]
    }

    print("\n========================================================")
    print("TEST RUN 1: DETAILED TECHNICAL ANSWER")
    print(f"Opening Question: \"{opening_question}\"")
    print(f"Candidate Answer: \"{detailed_answer}\"")
    print("========================================================")

    res1 = client.post('/api/interview-followup', json=payload_detailed)
    data1 = res1.get_json()

    print(f"HTTP Status: {res1.status_code}")
    print(f"AI Action Chosen: {data1.get('action')}")
    print(f"AI Spoken Turn (`questionText`):\n\"{data1.get('questionText')}\"")
    print(f"AI Reasoning: {data1.get('reasoning')}")

    print("\n========================================================")
    print("TEST RUN 2: ONE-WORD NON-ANSWER ('Fine.')")
    print(f"Opening Question: \"{opening_question}\"")
    print(f"Candidate Answer: \"{one_word_answer}\"")
    print("========================================================")

    res2 = client.post('/api/interview-followup', json=payload_one_word)
    data2 = res2.get_json()

    print(f"HTTP Status: {res2.status_code}")
    print(f"AI Action Chosen: {data2.get('action')}")
    print(f"AI Spoken Turn (`questionText`):\n\"{data2.get('questionText')}\"")
    print(f"AI Reasoning: {data2.get('reasoning')}")
    print("========================================================\n")

if __name__ == '__main__':
    run_test()
