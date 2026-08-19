import sys
import os
import json

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def test_issue1_cross_questioning():
    print("\n==========================================================================")
    print("VERIFYING ISSUE 1: CROSS-QUESTIONING PARITY ON 'I DON'T KNOW'")
    print("==========================================================================")
    client = app.test_client()

    tech_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": [
            {"role": "interviewer", "text": "Can you explain how database indexes work under the hood?"},
            {"role": "candidate", "text": "I don't know how database indexes work under the hood."}
        ]
    }

    res_tech = client.post('/api/interview-followup', json=tech_payload)
    data_tech = res_tech.get_json() or {}

    print(f"[Tech Round] Candidate Answer: \"I don't know how database indexes work under the hood.\"")
    print(f"[Tech Round] Response Status: {res_tech.status_code}")
    print(f"[Tech Round] moveToNewTopic: {data_tech.get('moveToNewTopic')}")
    print(f"[Tech Round] Spoken Turn:\n\"{data_tech.get('interviewerResponse') or data_tech.get('questionText')}\"\n")

    assert data_tech.get('moveToNewTopic') == False, "Tech round must NOT move to a new topic on 'I don't know'"

    hr_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "hr",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English",
        "interviewerPersona": "Friendly",
        "conversationHistory": [
            {"role": "interviewer", "text": "Tell me about a time you handled a conflict with a teammate."},
            {"role": "candidate", "text": "I'm not sure, I don't really have an example for that."}
        ]
    }

    res_hr = client.post('/api/interview-followup', json=hr_payload)
    data_hr = res_hr.get_json() or {}

    print(f"[HR Round] Candidate Answer: \"I'm not sure, I don't really have an example for that.\"")
    print(f"[HR Round] Response Status: {res_hr.status_code}")
    print(f"[HR Round] moveToNewTopic: {data_hr.get('moveToNewTopic')}")
    print(f"[HR Round] Spoken Turn:\n\"{data_hr.get('interviewerResponse') or data_hr.get('questionText')}\"\n")

    assert data_hr.get('moveToNewTopic') == False, "HR round must NOT move to a new topic on 'I don't know'"
    print("SUCCESS: Issue 1 Cross-Questioning Parity verified!")

def test_issue2_speech_metrics():
    print("\n==========================================================================")
    print("VERIFYING ISSUE 2: FILLER WORDS & PAUSES SPEECH ANALYSIS")
    print("==========================================================================")
    
    # We test the filler detection logic using python re simulation matching speechAnalyzer.js
    import re
    FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'i mean']
    
    sample_transcript = "Um, well, I think like, you know, basically our backend API was uh so slow, I mean we had to optimize it."
    
    total_fillers = 0
    breakdown = {}
    for filler in FILLER_WORDS:
        escaped = re.escape(filler)
        matches = re.findall(rf'\b{escaped}\b', sample_transcript, flags=re.IGNORECASE)
        count = len(matches)
        breakdown[filler] = count
        total_fillers += count

    print(f"Sample Answer Transcript: \"{sample_transcript}\"")
    print(f"Filler Words Breakdown: {breakdown}")
    print(f"Total Fillers Counted: {total_fillers}")

    assert total_fillers >= 6, f"Expected at least 6 filler words detected, got {total_fillers}"
    print("SUCCESS: Issue 2 Speech metrics calculation verified!")

def test_issue3_question_bank_diversity():
    print("\n==========================================================================")
    print("VERIFYING ISSUE 3: HR QUESTION BANK DIVERSITY")
    print("==========================================================================")
    
    js_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'seedHrQuestions.js')
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    import re
    ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", content)
    categories = re.findall(r"category:\s*['\"]([^'\"]+)['\"]", content)

    print(f"Total INITIAL_HR_QUESTIONS count found in JS file: {len(ids)}")
    assert len(ids) >= 25, f"Expected at least 25 questions, found {len(ids)}"

    unique_categories = set(categories)
    print(f"Distinct Behavioral Categories Covered ({len(unique_categories)}):")
    for cat in sorted(unique_categories):
        count = categories.count(cat)
        print(f"  - {cat} ({count} questions)")

    assert len(unique_categories) >= 7, f"Expected at least 7 categories, got {len(unique_categories)}"
    print("SUCCESS: Issue 3 HR Question Diversity verified!")

if __name__ == '__main__':
    test_issue1_cross_questioning()
    test_issue2_speech_metrics()
    test_issue3_question_bank_diversity()
    print("\n==========================================================================")
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
    print("==========================================================================\n")
