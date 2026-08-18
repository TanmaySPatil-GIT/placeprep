import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def run_session():
    client = app.test_client()

    base_payload = {
        "selectedCompany": "Google",
        "targetField": "Software Development",
        "interviewType": "technical",
        "difficultyLevel": "Medium",
        "experienceLevel": "Fresher",
        "selectedLanguage": "English"
    }

    conversation_history = []

    print("\n==========================================================================")
    print("LIVE MULTI-TURN HUMAN INTERVIEWER CONVERSATION SIMULATION")
    print("==========================================================================\n")

    # Step 1: Opening turn
    payload = dict(base_payload)
    payload["isOpening"] = True
    payload["conversationHistory"] = []

    res = client.post('/api/interview-followup', json=payload)
    data = res.get_json() or {}
    opening_q = data.get('interviewerResponse', '')
    conversation_history.append({"role": "interviewer", "text": opening_q})

    print(f"--- TURN 1 (OPENING INTERVIEWER TURN) ---")
    print(f"AI Interviewer: \"{opening_q}\"\n")

    # Step 2: Strong answer to opening question
    strong_ans = "For my main project, I built a real-time collaborative code editor using WebSockets and Operational Transformation in Node.js. To handle concurrent edits, each edit operation (insert/delete) is transformed against concurrent pending operations using vector clocks before being broadcast to connected clients."
    conversation_history.append({"role": "candidate", "text": strong_ans})

    payload = dict(base_payload)
    payload["isOpening"] = False
    payload["conversationHistory"] = conversation_history

    res = client.post('/api/interview-followup', json=payload)
    data2 = res.get_json() or {}
    reply2 = data2.get('interviewerResponse', '')
    conversation_history.append({"role": "interviewer", "text": reply2})

    print(f"--- TURN 2 (CANDIDATE: STRONG SUBSTANTIVE ANSWER) ---")
    print(f"Candidate: \"{strong_ans}\"")
    print(f"AI Interviewer (moveToNewTopic: {data2.get('moveToNewTopic')}):\n\"{reply2}\"\n")

    # Step 3: Weak / Vague answer to Turn 2's question
    weak_ans = "I used standard unit testing and manually checked that it didn't crash."
    conversation_history.append({"role": "candidate", "text": weak_ans})

    payload = dict(base_payload)
    payload["isOpening"] = False
    payload["conversationHistory"] = conversation_history

    res = client.post('/api/interview-followup', json=payload)
    data3 = res.get_json() or {}
    reply3 = data3.get('interviewerResponse', '')
    conversation_history.append({"role": "interviewer", "text": reply3})

    print(f"--- TURN 3 (CANDIDATE: WEAK / SURFACE-LEVEL ANSWER) ---")
    print(f"Candidate: \"{weak_ans}\"")
    print(f"AI Interviewer (moveToNewTopic: {data3.get('moveToNewTopic')}):\n\"{reply3}\"\n")

    # Step 4: "I don't know" admission to Turn 3's question
    idk_ans = "I don't know how to test for race conditions in asynchronous WebSocket connections, to be honest."
    conversation_history.append({"role": "candidate", "text": idk_ans})

    payload = dict(base_payload)
    payload["isOpening"] = False
    payload["conversationHistory"] = conversation_history

    res = client.post('/api/interview-followup', json=payload)
    data4 = res.get_json() or {}
    reply4 = data4.get('interviewerResponse', '')
    conversation_history.append({"role": "interviewer", "text": reply4})

    print(f"--- TURN 4 (CANDIDATE: EXPLICIT 'I DON'T KNOW' ADMISSION) ---")
    print(f"Candidate: \"{idk_ans}\"")
    print(f"AI Interviewer (moveToNewTopic: {data4.get('moveToNewTopic')}):\n\"{reply4}\"\n")

    # Step 5: Off-topic / Non-answer ("I am fine")
    offtopic_ans = "I am fine, how are you doing today?"
    conversation_history.append({"role": "candidate", "text": offtopic_ans})

    payload = dict(base_payload)
    payload["isOpening"] = False
    payload["conversationHistory"] = conversation_history

    res = client.post('/api/interview-followup', json=payload)
    data5 = res.get_json() or {}
    reply5 = data5.get('interviewerResponse', '')
    conversation_history.append({"role": "interviewer", "text": reply5})

    print(f"--- TURN 5 (CANDIDATE: OFF-TOPIC / NON-ANSWER) ---")
    print(f"Candidate: \"{offtopic_ans}\"")
    print(f"AI Interviewer (moveToNewTopic: {data5.get('moveToNewTopic')}):\n\"{reply5}\"\n")

    print("==========================================================================\n")

if __name__ == '__main__':
    run_session()
