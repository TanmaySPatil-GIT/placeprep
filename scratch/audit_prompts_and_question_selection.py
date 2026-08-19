import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_audit():
    client = app.test_client()

    print("\n==========================================================================")
    print("AUDIT STEP 1: PROMPT & PERSONA INSTRUCTION COMPARISON (TECH vs HR)")
    print("==========================================================================")

    sample_history = [
        {"role": "interviewer", "text": "Can you explain how database indexes or system architecture trade-offs work?"},
        {"role": "candidate", "text": "I don't know how database indexes work under the hood."}
    ]

    tech_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": sample_history
    }

    hr_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "hr",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": sample_history
    }

    print("\n--- TECH ROUND PAYLOAD ---")
    print(json.dumps(tech_payload, indent=2))

    res_tech = client.post('/api/interview-followup', json=tech_payload)
    data_tech = res_tech.get_json() or {}

    print("\n--- TECH ROUND RESPONSE ---")
    print(json.dumps(data_tech, indent=2))

    print("\n--- HR ROUND PAYLOAD ---")
    print(json.dumps(hr_payload, indent=2))

    res_hr = client.post('/api/interview-followup', json=hr_payload)
    data_hr = res_hr.get_json() or {}

    print("\n--- HR ROUND RESPONSE ---")
    print(json.dumps(data_hr, indent=2))


    print("\n==========================================================================")
    print("AUDIT STEP 2: QUESTION BANK POOL SIZE & 3-SESSION SELECTION LOGIC AUDIT")
    print("==========================================================================")

    # Inspect seed files directly
    js_hr_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'seedHrQuestions.js')
    js_tech_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'seedInterviewQuestions.js')

    with open(js_hr_path, 'r', encoding='utf-8') as f:
        hr_js = f.read()
    with open(js_tech_path, 'r', encoding='utf-8') as f:
        tech_js = f.read()

    import re
    hr_ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", hr_js)
    tech_ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", tech_js)

    print(f"Total HR Questions in JS Seed File: {len(hr_ids)}")
    print(f"HR Question IDs: {hr_ids}")

    print(f"\nTotal Tech Questions in JS Seed File: {len(tech_ids)}")
    print(f"Tech Question IDs: {tech_ids}")

    # Simulate 3 consecutive sessions of question selection logic
    def simulate_sessions(pool_ids, session_size=7):
        recent_ids = []
        sessions = {}
        for s in range(1, 4):
            unseen = [qid for qid in pool_ids if qid not in recent_ids]
            candidate_pool = unseen if len(unseen) >= 2 else pool_ids
            # Simulate shuffle by picking candidates
            import random
            shuffled = list(candidate_pool)
            random.seed(42 + s)
            random.shuffle(shuffled)
            selected = shuffled[:session_size]
            sessions[f"Session {s}"] = selected
            # Record selected question IDs into recent
            recent_ids = list(set(selected + recent_ids))[:20]
        return sessions

    print("\n--- SIMULATED HR ROUND 3 CONSECUTIVE SESSIONS ---")
    hr_sessions = simulate_sessions(hr_ids, session_size=7)
    for sess, qlist in hr_sessions.items():
        print(f"{sess}: {qlist}")

    print("\n--- SIMULATED TECH ROUND 3 CONSECUTIVE SESSIONS ---")
    tech_sessions = simulate_sessions(tech_ids, session_size=7)
    for sess, qlist in tech_sessions.items():
        print(f"{sess}: {qlist}")

    print("==========================================================================\n")

if __name__ == '__main__':
    run_audit()
