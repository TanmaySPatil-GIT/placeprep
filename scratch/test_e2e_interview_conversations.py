import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_e2e_conversational_tests():
    client = app.test_client()

    print("\n==========================================================================")
    print("PART 3 & 4: CONVERSATIONAL QUALITY VERIFICATION (4 REAL TEST CASES)")
    print("==========================================================================")

    # 1. Technical Round - Strong Answer
    tech_strong_history = [
        {"role": "interviewer", "text": "Explain how database indexing speeds up query performance and the trade-offs involved."},
        {"role": "candidate", "text": "Database indexes use balanced B-Tree structures to achieve O(log N) lookup times instead of full table scans O(N). Clustered indexes dictate physical row order, while non-clustered indexes store pointers. The main trade-off is write overhead on INSERT/UPDATE operations and memory footprint."}
    ]
    tech_strong_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": tech_strong_history
    }

    print("\n--------------------------------------------------------------------------")
    print("TEST CASE 1: Technical Round — Strong/Detailed Technical Answer")
    print("--------------------------------------------------------------------------")
    print(f"CANDIDATE INPUT: \"{tech_strong_history[-1]['text']}\"")
    res1 = client.post('/api/interview-followup', json=tech_strong_payload)
    data1 = res1.get_json() or {}
    q1 = data1.get('interviewerResponse') or data1.get('questionText') or ''
    print(f"ACTION/MOVE_TOPIC: action={data1.get('action')}, moveToNewTopic={data1.get('moveToNewTopic')}")
    print(f"AI GENERATED FOLLOW-UP:\n\"{q1}\"\n")


    # 2. Technical Round - Weak/Vague Answer
    tech_weak_history = [
        {"role": "interviewer", "text": "Explain how database indexing speeds up query performance and the trade-offs involved."},
        {"role": "candidate", "text": "I just write standard SQL select queries and let the database handle it."}
    ]
    tech_weak_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": tech_weak_history
    }

    print("--------------------------------------------------------------------------")
    print("TEST CASE 2: Technical Round — Weak/Vague Answer")
    print("--------------------------------------------------------------------------")
    print(f"CANDIDATE INPUT: \"{tech_weak_history[-1]['text']}\"")
    res2 = client.post('/api/interview-followup', json=tech_weak_payload)
    data2 = res2.get_json() or {}
    q2 = data2.get('interviewerResponse') or data2.get('questionText') or ''
    print(f"ACTION/MOVE_TOPIC: action={data2.get('action')}, moveToNewTopic={data2.get('moveToNewTopic')}")
    print(f"AI GENERATED FOLLOW-UP:\n\"{q2}\"\n")


    # 3. HR Round - Strong STAR Answer
    hr_strong_history = [
        {"role": "interviewer", "text": "Tell me about a time you had a technical disagreement with a teammate and how you resolved it."},
        {"role": "candidate", "text": "In my senior project, a senior teammate wanted to use MongoDB while I advocated PostgreSQL for strict relational schemas (STAR: Situation). We were facing tight delivery deadlines (Task). I benchmarked both databases with sample workload queries and presented data showing 40% faster join queries with PostgreSQL (Action). He agreed with the data, we adopted PostgreSQL, and delivered on schedule (Result)."}
    ]
    hr_strong_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "hr",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": hr_strong_history
    }

    print("--------------------------------------------------------------------------")
    print("TEST CASE 3: HR Round — Strong STAR Format Answer")
    print("--------------------------------------------------------------------------")
    print(f"CANDIDATE INPUT: \"{hr_strong_history[-1]['text']}\"")
    res3 = client.post('/api/interview-followup', json=hr_strong_payload)
    data3 = res3.get_json() or {}
    q3 = data3.get('interviewerResponse') or data3.get('questionText') or ''
    print(f"ACTION/MOVE_TOPIC: action={data3.get('action')}, moveToNewTopic={data3.get('moveToNewTopic')}")
    print(f"AI GENERATED FOLLOW-UP:\n\"{q3}\"\n")


    # 4. HR Round - Weak/Generic Answer
    hr_weak_history = [
        {"role": "interviewer", "text": "Tell me about a time you had a technical disagreement with a teammate and how you resolved it."},
        {"role": "candidate", "text": "I don't really get into arguments. I just agree with whatever the senior dev says so we don't have drama."}
    ]
    hr_weak_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "hr",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": hr_weak_history
    }

    print("--------------------------------------------------------------------------")
    print("TEST CASE 4: HR Round — Weak/Generic Answer")
    print("--------------------------------------------------------------------------")
    print(f"CANDIDATE INPUT: \"{hr_weak_history[-1]['text']}\"")
    res4 = client.post('/api/interview-followup', json=hr_weak_payload)
    data4 = res4.get_json() or {}
    q4 = data4.get('interviewerResponse') or data4.get('questionText') or ''
    print(f"ACTION/MOVE_TOPIC: action={data4.get('action')}, moveToNewTopic={data4.get('moveToNewTopic')}")
    print(f"AI GENERATED FOLLOW-UP:\n\"{q4}\"\n")

    print("==========================================================================\n")

if __name__ == '__main__':
    run_e2e_conversational_tests()
