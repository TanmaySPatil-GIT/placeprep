import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_test():
    client = app.test_client()

    opening_question = "Hi! Welcome to your Google technical interview. Can you explain the difference between a clustered index and a non-clustered index in a relational database?"

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

    print("\n==========================================================================")
    print("TEST 1: 'I DON'T KNOW' ADMISSION (FIRST TIME -> EXPECT simplifyAndRetry)")
    print("==========================================================================")

    payload1 = dict(base_payload)
    payload1["conversationHistory"] = [
        {"role": "interviewer", "text": opening_question},
        {"role": "candidate", "text": "I don't know the difference between clustered and non-clustered index."}
    ]

    res1 = client.post('/api/interview-followup', json=payload1)
    data1 = res1.get_json() or {}

    print(f"Candidate Answer: \"I don't know the difference between clustered and non-clustered index.\"")
    print(f"HTTP Status: {res1.status_code}")
    print(f"Parsed JSON -> Quality: '{data1.get('answerQuality')}', Action: '{data1.get('action')}'")
    print(f"AI Spoken Turn:\n\"{data1.get('questionText')}\"")
    print(f"AI Reasoning: {data1.get('reasoning')}\n")

    # Check for Bug 1: No inappropriate praise for 'I don't know'
    spoken1_lower = data1.get('questionText', '').lower()
    inappropriate_praise = ["that's interesting", "great point", "that's a good example", "excellent answer"]
    has_mismatched_praise = any(p in spoken1_lower for p in inappropriate_praise)
    print(f"CHECK BUG 1 (Tone Mismatch): {'FAILED (contains praise)' if has_mismatched_praise else 'PASSED (Natural tone)'}")
    print(f"CHECK BUG 2 (Simplify and Retry): {'PASSED' if data1.get('action') == 'simplifyAndRetry' else 'FAILED'}")


    print("\n==========================================================================")
    print("TEST 2: 'I DON'T KNOW' ADMISSION (SECOND TIME AFTER SIMPLIFY -> EXPECT acknowledge_and_move_on)")
    print("==========================================================================")

    payload2 = dict(base_payload)
    payload2["conversationHistory"] = [
        {"role": "interviewer", "text": opening_question},
        {"role": "candidate", "text": "I don't know the difference between clustered and non-clustered index."},
        {"role": "interviewer", "text": data1.get('questionText', 'No worries — in simpler terms, do you know what a database index is used for?')},
        {"role": "candidate", "text": "I am not sure about indexes at all, sorry."}
    ]

    res2 = client.post('/api/interview-followup', json=payload2)
    data2 = res2.get_json() or {}

    print(f"Candidate Answer: \"I am not sure about indexes at all, sorry.\"")
    print(f"HTTP Status: {res2.status_code}")
    print(f"Parsed JSON -> Quality: '{data2.get('answerQuality')}', Action: '{data2.get('action')}'")
    print(f"AI Spoken Turn:\n\"{data2.get('questionText')}\"")
    print(f"AI Reasoning: {data2.get('reasoning')}\n")


    print("\n==========================================================================")
    print("TEST 3: SOLID TECHNICAL ANSWER (EXPECT SUBSTANTIVE -> crossQuestion / followup)")
    print("==========================================================================")

    payload3 = dict(base_payload)
    payload3["conversationHistory"] = [
        {"role": "interviewer", "text": "Can you explain how garbage collection works in Java?"},
        {"role": "candidate", "text": "Java Garbage Collection uses a generational heap layout split into Young (Eden, Survivor) and Old Generation. It uses Mark-and-Sweep algorithms to reclaim memory from unreachable objects, minimizing Stop-The-World pauses using G1 or ZGC."}
    ]

    res3 = client.post('/api/interview-followup', json=payload3)
    data3 = res3.get_json() or {}

    print(f"Candidate Answer: \"Java Garbage Collection uses a generational heap layout...\"")
    print(f"HTTP Status: {res3.status_code}")
    print(f"Parsed JSON -> Quality: '{data3.get('answerQuality')}', Action: '{data3.get('action')}'")
    print(f"AI Spoken Turn:\n\"{data3.get('questionText')}\"")
    print(f"AI Reasoning: {data3.get('reasoning')}")
    print("==========================================================================\n")

if __name__ == '__main__':
    run_test()
