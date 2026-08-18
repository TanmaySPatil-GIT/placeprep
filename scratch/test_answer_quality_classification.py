import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_test():
    client = app.test_client()

    opening_question = "Hi! Welcome to your Google mock interview. Can you explain how database indexing works and how a B-Tree index optimizes lookup queries?"

    base_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "topicFollowupCount": 0
    }

    test_cases = [
        {
            "name": "1. REAL TECHNICAL ATTEMPT (SUBSTANTIVE)",
            "answer": "A B-Tree index organizes data in a balanced tree structure where node keys are kept sorted. Lookups take O(log N) time because at each node we perform a comparison to pick the sub-tree branch, minimizing disk I/O reads.",
            "expected_quality": "substantive"
        },
        {
            "name": "2. OFF-TOPIC / NON-ANSWER ('I am fine')",
            "answer": "I am fine",
            "expected_quality": "off_topic"
        },
        {
            "name": "3. EXPLICIT UNCERTAINTY ('I don't know this one')",
            "answer": "I don't know this one, can we move on?",
            "expected_action": "acknowledge_and_move_on"
        },
        {
            "name": "4. SILENCE / EMPTY TRANSCRIPT",
            "answer": "",
            "expected_action": "clarify"
        }
    ]

    print("\n==========================================================================")
    print("RUNNING EXPLICIT ANSWER QUALITY CLASSIFICATION VERIFICATION TESTS")
    print("==========================================================================\n")

    for tc in test_cases:
        payload = dict(base_payload)
        payload["conversationHistory"] = [
            {"role": "interviewer", "text": opening_question},
            {"role": "candidate", "text": tc["answer"]}
        ]

        res = client.post('/api/interview-followup', json=payload)
        data = res.get_json() or {}

        print(f"--- TEST CASE: {tc['name']} ---")
        print(f"Candidate Spoken Answer: \"{tc['answer']}\"")
        print(f"HTTP Status: {res.status_code}")
        print(f"Parsed JSON -> answerQuality: '{data.get('answerQuality')}', action: '{data.get('action')}'")
        print(f"AI Spoken Response (`questionText`):\n\"{data.get('questionText')}\"")
        print(f"AI Reasoning: {data.get('reasoning')}\n")

if __name__ == '__main__':
    run_test()
