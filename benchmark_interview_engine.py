"""
Benchmark Suite for PlacePrep Interview Engine (AI Training Playbook Hardening)
Calls /api/evaluate-answer, /api/decide-next-step, and /api/generate-question directly.
Verifies all 10 failure/edge cases and outputs raw results to benchmark_results.json.
"""

import os
import sys
import json
import re
import unittest
from datetime import datetime

# Import Flask app directly
from app import (
    app,
    RUBRIC_DATABASE,
    SAMPLE_QUESTIONS_BY_TOPIC,
    MAX_PROBES_PER_TOPIC,
    INTERVIEW_STATES,
    evaluate_decision_engine
)

EVALUATOR_REQUIRED_FIELDS = [
    'verdict', 'evidenceQuote', 'conceptsCorrect', 'conceptsWrong',
    'conceptsMissing', 'rubricVersion', 'uncertainty'
]

GENERATOR_REQUIRED_FIELDS = [
    'decision', 'probe_type', 'question', 'evidence_to_probe', 'competency'
]

def validate_evaluator_schema(data):
    missing = [f for f in EVALUATOR_REQUIRED_FIELDS if f not in data]
    if missing:
        return False, f"Missing fields: {missing}"
    if data['verdict'] not in ["correct", "partially_correct", "incorrect", "vague", "off_topic", "dont_know", "evaluation_unavailable"]:
        return False, f"Invalid verdict: {data['verdict']}"
    if not isinstance(data.get('conceptsCorrect'), list):
        return False, "conceptsCorrect must be list"
    if not isinstance(data.get('conceptsWrong'), list):
        return False, "conceptsWrong must be list"
    if not isinstance(data.get('conceptsMissing'), list):
        return False, "conceptsMissing must be list"
    if data.get('uncertainty') not in ["low", "medium", "high"]:
        return False, f"Invalid uncertainty: {data.get('uncertainty')}"
    return True, "Valid evaluator schema"

def validate_generator_schema(data):
    missing = [f for f in GENERATOR_REQUIRED_FIELDS if f not in data or not data[f]]
    if missing:
        return False, f"Missing or empty fields: {missing}"
    if data['decision'] not in ['PROBE', 'CLARIFY', 'ADVANCE', 'CLOSE_TOPIC']:
        return False, f"Invalid decision: {data['decision']}"
    q = str(data.get('question', ''))
    if q.count('?') > 1:
        return False, f"Contains multiple questions ({q.count('?')} '?' found)"
    return True, "Valid generator schema"

def run_benchmark():
    client = app.test_client()
    client.testing = True

    results = []

    print("\n=====================================================================")
    print("  PLACEPREP INTERVIEW ENGINE 10-CASE BENCHMARK RUNNER")
    print("=====================================================================\n")

    # -------------------------------------------------------------
    # Case 1: Correct Technical Answer
    # -------------------------------------------------------------
    print("Case 1: Correct Technical Answer (OOP Inheritance)...")
    payload_1 = {
        "sessionId": "bench_case_1",
        "currentTopicId": "oop-inheritance",
        "lastQuestionAsked": "Explain the concept of Inheritance in OOP and why composition is often preferred over inheritance.",
        "studentAnswer": (
            "Inheritance establishes an is-a relationship where a subclass inherits methods and fields "
            "from a parent superclass for code reuse and runtime polymorphism via method overriding. "
            "Composition uses a has-a relationship and is often preferred to prevent tight coupling "
            "and avoid the fragile base class problem."
        ),
        "sessionState": {"currentDepth": 0, "difficultyLevel": "medium"}
    }
    resp_1 = client.post('/api/evaluate-answer', json=payload_1)
    data_1 = resp_1.get_json() or {}
    val_1_ok, val_1_msg = validate_evaluator_schema(data_1)
    results.append({
        "caseId": 1,
        "name": "correct_answer",
        "description": "Student gives accurate, nuanced answer for OOP inheritance with composition contrast",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_1,
        "status_code": resp_1.status_code,
        "response": data_1,
        "schema_valid": val_1_ok,
        "schema_message": val_1_msg,
        "verdict_pass": data_1.get('verdict') == 'correct',
        "evidence_quote_present": bool(data_1.get('evidenceQuote'))
    })
    print(f"  -> Verdict: {data_1.get('verdict')} | Schema Valid: {val_1_ok}")

    # -------------------------------------------------------------
    # Case 2: Incorrect Answer (Misconceptions)
    # -------------------------------------------------------------
    print("\nCase 2: Incorrect Answer with Misconceptions (OOP Inheritance)...")
    payload_2 = {
        "sessionId": "bench_case_2",
        "currentTopicId": "oop-inheritance",
        "lastQuestionAsked": "Explain how method overriding works and how private fields of a parent are accessed in subclasses.",
        "studentAnswer": (
            "Method overriding is when you write multiple methods in the same class with the same name "
            "but different arguments at compile time. Also, private members of a parent class are completely "
            "accessible directly by any child class without getters."
        ),
        "sessionState": {"currentDepth": 1, "difficultyLevel": "medium"}
    }
    resp_2 = client.post('/api/evaluate-answer', json=payload_2)
    data_2 = resp_2.get_json() or {}
    val_2_ok, val_2_msg = validate_evaluator_schema(data_2)
    results.append({
        "caseId": 2,
        "name": "incorrect_answer",
        "description": "Student confuses overriding with overloading and thinks private fields are accessible",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_2,
        "status_code": resp_2.status_code,
        "response": data_2,
        "schema_valid": val_2_ok,
        "schema_message": val_2_msg,
        "verdict_pass": data_2.get('verdict') in ['incorrect', 'partially_correct'],
        "misconceptions_flagged": len(data_2.get('conceptsWrong', [])) > 0
    })
    print(f"  -> Verdict: {data_2.get('verdict')} | Concepts Wrong: {data_2.get('conceptsWrong')} | Schema Valid: {val_2_ok}")

    # -------------------------------------------------------------
    # Case 3: Vague Answer
    # -------------------------------------------------------------
    print("\nCase 3: Vague Answer (DBMS Indexing)...")
    payload_3 = {
        "sessionId": "bench_case_3",
        "currentTopicId": "dbms-indexing-b-trees",
        "lastQuestionAsked": "How do B+Tree database indexes optimize search performance compared to full table scans?",
        "studentAnswer": (
            "Well, indexes basically optimize things in the database so queries run faster and take less time "
            "because of the structure and stuff in memory."
        ),
        "sessionState": {"currentDepth": 0, "difficultyLevel": "medium"}
    }
    resp_3 = client.post('/api/evaluate-answer', json=payload_3)
    data_3 = resp_3.get_json() or {}
    val_3_ok, val_3_msg = validate_evaluator_schema(data_3)
    results.append({
        "caseId": 3,
        "name": "vague_answer",
        "description": "Student provides hand-wavy response without technical B+Tree concepts",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_3,
        "status_code": resp_3.status_code,
        "response": data_3,
        "schema_valid": val_3_ok,
        "schema_message": val_3_msg,
        "verdict_pass": data_3.get('verdict') in ['vague', 'partially_correct'],
        "concepts_missing_flagged": len(data_3.get('conceptsMissing', [])) > 0
    })
    print(f"  -> Verdict: {data_3.get('verdict')} | Concepts Missing: {len(data_3.get('conceptsMissing', []))} | Schema Valid: {val_3_ok}")

    # -------------------------------------------------------------
    # Case 4: Contradiction Between Statements
    # -------------------------------------------------------------
    print("\nCase 4: Contradiction in Student Response (CAP Theorem)...")
    payload_4 = {
        "sessionId": "bench_case_4",
        "currentTopicId": "sysdesign-cap-theorem",
        "lastQuestionAsked": "In distributed system architecture, can a database provide both Consistency and Availability during network partitions?",
        "studentAnswer": (
            "Yes, you can easily guarantee both complete consistency and 100% availability during network partitions "
            "by using multi-master replication, but when a network partition happens, you cannot guarantee availability "
            "if you choose consistency."
        ),
        "sessionState": {"currentDepth": 0, "difficultyLevel": "hard"}
    }
    resp_4 = client.post('/api/evaluate-answer', json=payload_4)
    data_4 = resp_4.get_json() or {}
    val_4_ok, val_4_msg = validate_evaluator_schema(data_4)
    results.append({
        "caseId": 4,
        "name": "contradiction_answer",
        "description": "Student asserts database provides both C and A during partition, then contradicts itself",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_4,
        "status_code": resp_4.status_code,
        "response": data_4,
        "schema_valid": val_4_ok,
        "schema_message": val_4_msg,
        "verdict_pass": data_4.get('verdict') in ['incorrect', 'partially_correct']
    })
    print(f"  -> Verdict: {data_4.get('verdict')} | Schema Valid: {val_4_ok}")

    # -------------------------------------------------------------
    # Case 5: "I Don't Know"
    # -------------------------------------------------------------
    print("\nCase 5: 'I Don't Know' Expression (QA Selenium)...")
    payload_5 = {
        "sessionId": "bench_case_5",
        "currentTopicId": "qa-selenium-pom",
        "lastQuestionAsked": "Explain how the Page Object Model architecture decouples test assertions from web element locators.",
        "studentAnswer": "I don't know, I haven't worked with Selenium or Page Object Models yet.",
        "sessionState": {"currentDepth": 0, "difficultyLevel": "medium"}
    }
    resp_5 = client.post('/api/evaluate-answer', json=payload_5)
    data_5 = resp_5.get_json() or {}
    val_5_ok, val_5_msg = validate_evaluator_schema(data_5)
    results.append({
        "caseId": 5,
        "name": "dont_know_answer",
        "description": "Student explicitly admits not knowing the concept",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_5,
        "status_code": resp_5.status_code,
        "response": data_5,
        "schema_valid": val_5_ok,
        "schema_message": val_5_msg,
        "verdict_pass": data_5.get('verdict') == 'dont_know',
        "evidence_quote_matches": "don't know" in (data_5.get('evidenceQuote') or '').lower()
    })
    print(f"  -> Verdict: {data_5.get('verdict')} | Evidence: '{data_5.get('evidenceQuote')}' | Schema Valid: {val_5_ok}")

    # -------------------------------------------------------------
    # Case 6: Resume-Based Claim (Behavioral STAR)
    # -------------------------------------------------------------
    print("\nCase 6: Resume-Based Claim / Behavioral STAR (Handling Conflict)...")
    payload_6 = {
        "sessionId": "bench_case_6",
        "currentTopicId": "behavioral-handling-conflict",
        "lastQuestionAsked": "Describe a time when you strongly disagreed with a teammate or lead on a technical approach.",
        "studentAnswer": (
            "During my final year project, our lead advocated using SQLite while I advocated PostgreSQL. "
            "I benchmarked our concurrent write requirements with realistic simulated user load and showed that "
            "SQLite locked under concurrent writes. We reviewed the metrics as a team, adopted PostgreSQL, "
            "and deployed with zero database concurrency errors."
        ),
        "sessionState": {"currentDepth": 0, "difficultyLevel": "medium", "roundType": "hr"}
    }
    resp_6 = client.post('/api/evaluate-answer', json=payload_6)
    data_6 = resp_6.get_json() or {}
    val_6_ok, val_6_msg = validate_evaluator_schema(data_6)
    results.append({
        "caseId": 6,
        "name": "resume_based_claim",
        "description": "Candidate gives objective STAR response citing data, benchmarks, and constructive resolution",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_6,
        "status_code": resp_6.status_code,
        "response": data_6,
        "schema_valid": val_6_ok,
        "schema_message": val_6_msg,
        "verdict_pass": data_6.get('verdict') == 'correct'
    })
    print(f"  -> Verdict: {data_6.get('verdict')} | Concepts Correct: {data_6.get('conceptsCorrect')} | Schema Valid: {val_6_ok}")

    # -------------------------------------------------------------
    # Case 7: Empty / Blank Transcript
    # -------------------------------------------------------------
    print("\nCase 7: Empty / Blank Transcript...")
    payload_7 = {
        "sessionId": "bench_case_7",
        "currentTopicId": "oop-polymorphism",
        "lastQuestionAsked": "What is runtime polymorphism in object-oriented design?",
        "studentAnswer": "   ",
        "sessionState": {"currentDepth": 0, "difficultyLevel": "medium"}
    }
    resp_7 = client.post('/api/evaluate-answer', json=payload_7)
    data_7 = resp_7.get_json() or {}
    val_7_ok, val_7_msg = validate_evaluator_schema(data_7)
    results.append({
        "caseId": 7,
        "name": "empty_blank_transcript",
        "description": "Empty transcript handled safely without throwing or fabricating evidence",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_7,
        "status_code": resp_7.status_code,
        "response": data_7,
        "schema_valid": val_7_ok,
        "schema_message": val_7_msg,
        "verdict_pass": data_7.get('verdict') == 'vague',
        "no_error_thrown": resp_7.status_code == 200
    })
    print(f"  -> Verdict: {data_7.get('verdict')} | Status: {resp_7.status_code} | Schema Valid: {val_7_ok}")

    # -------------------------------------------------------------
    # Case 8: Simulated API Timeout / Unparseable Failure
    # -------------------------------------------------------------
    print("\nCase 8: Simulated API Timeout / Unparseable Failure...")
    # Simulate failed Evaluator by triggering fallback path or empty mock
    # We test the endpoint with a mock invalid rubric that forces degraded fallback
    payload_8 = {
        "sessionId": "bench_case_8",
        "currentTopicId": "invalid_topic_xyz",
        "lastQuestionAsked": "Some question",
        "studentAnswer": "Some answer",
        "rubric": {"topicName": "Mock Failing", "keyConcepts": [], "commonMisconceptions": []},
        "sessionState": {}
    }
    # Call directly with patched call_gemini_with_model returning empty to simulate timeout
    import app as app_module
    orig_call = app_module.call_gemini_with_model
    try:
        app_module.call_gemini_with_model = lambda prompt: (None, None)
        resp_8 = client.post('/api/evaluate-answer', json=payload_8)
        data_8 = resp_8.get_json() or {}
    finally:
        app_module.call_gemini_with_model = orig_call

    val_8_ok, val_8_msg = validate_evaluator_schema(data_8)
    results.append({
        "caseId": 8,
        "name": "simulated_api_timeout",
        "description": "Simulated AI timeout must return evaluation_unavailable, null score, and marked degraded",
        "endpoint": "/api/evaluate-answer",
        "payload": payload_8,
        "status_code": resp_8.status_code,
        "response": data_8,
        "schema_valid": val_8_ok,
        "schema_message": val_8_msg,
        "verdict_is_unavailable": data_8.get('verdict') == 'evaluation_unavailable',
        "score_is_null": data_8.get('score') is None,
        "degraded_flag_true": data_8.get('degraded') is True,
        "fallback_used_true": data_8.get('fallbackUsed') is True
    })
    print(f"  -> Verdict: {data_8.get('verdict')} | Score: {data_8.get('score')} | Degraded: {data_8.get('degraded')} | FallbackUsed: {data_8.get('fallbackUsed')}")

    # -------------------------------------------------------------
    # Case 9: Hard Probe Cap Enforcement (Decision Engine + Generator)
    # -------------------------------------------------------------
    print("\nCase 9: Hard Probe Cap Enforcement (probeCount >= 2)...")
    session_at_cap = {
        "sessionId": "bench_case_9",
        "currentTopicId": "oop-inheritance",
        "probeCount": 2,
        "currentDepth": 2,
        "difficultyLevel": "medium",
        "topicPlan": [
            {"topicId": "oop-inheritance", "topicName": "OOP - Inheritance", "status": "in_progress", "probeCount": 2},
            {"topicId": "oop-polymorphism", "topicName": "OOP - Polymorphism", "status": "not_started", "probeCount": 0}
        ]
    }
    dec_engine_res = evaluate_decision_engine(
        {"verdict": "partially_correct", "followUpWorthy": True},
        session_at_cap,
        "I partially know how inheritance works."
    )
    # Now call generator with strategy resulting from cap enforcement
    payload_9 = {
        "sessionId": "bench_case_9",
        "strategy": dec_engine_res['strategy'],
        "evaluatorOutput": {"verdict": "partially_correct"},
        "currentTopicId": "oop-polymorphism",
        "sessionState": session_at_cap
    }
    resp_9 = client.post('/api/generate-question', json=payload_9)
    data_9 = resp_9.get_json() or {}
    val_9_ok, val_9_msg = validate_generator_schema(data_9)
    results.append({
        "caseId": 9,
        "name": "probe_cap_enforcement",
        "description": "When probeCount hits hard cap (2), Decision Engine forces CLOSE_TOPIC / ADVANCE",
        "decision_engine_output": dec_engine_res,
        "decision_is_close_topic": dec_engine_res.get('decisionState') == 'CLOSE_TOPIC',
        "topic_advance_forced": dec_engine_res.get('topicAdvance') is True,
        "endpoint": "/api/generate-question",
        "payload": payload_9,
        "status_code": resp_9.status_code,
        "response": data_9,
        "schema_valid": val_9_ok,
        "schema_message": val_9_msg
    })
    print(f"  -> Decision Engine Strategy: {dec_engine_res.get('strategy')} | State: {dec_engine_res.get('decisionState')} | Advance: {dec_engine_res.get('topicAdvance')}")
    print(f"  -> Generator Output: {data_9.get('question')} | Schema Valid: {val_9_ok}")

    # -------------------------------------------------------------
    # Case 10: Duplicate Question Prevention
    # -------------------------------------------------------------
    print("\nCase 10: Duplicate Question Prevention...")
    prev_question = "Explain the concept of Inheritance in OOP, contrast it with Composition, and describe a scenario where inheriting from a class would be an anti-pattern."
    # Compute its hash
    h_int = 2166136261
    for ch in re.sub(r'[^\w\s]', '', prev_question.lower()).strip():
        h_int = ((h_int ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    prev_hash = f"qh_{hex(h_int)[2:]}"

    payload_10 = {
        "sessionId": "bench_case_10",
        "strategy": "probe_missing_nuance",
        "evaluatorOutput": {"verdict": "correct", "conceptsMissing": ["composition"]},
        "currentTopicId": "oop-inheritance",
        "askedQuestionHashes": [prev_hash],
        "sessionState": {
            "currentTopicId": "oop-inheritance",
            "askedQuestions": [prev_question],
            "askedQuestionHashes": [prev_hash]
        }
    }
    resp_10 = client.post('/api/generate-question', json=payload_10)
    data_10 = resp_10.get_json() or {}
    val_10_ok, val_10_msg = validate_generator_schema(data_10)
    returned_q = data_10.get('question', '')
    is_duplicate = returned_q.strip().lower() == prev_question.strip().lower()

    results.append({
        "caseId": 10,
        "name": "duplicate_question_prevention",
        "description": "Generator rejects candidate if matching previously asked questions and returns fresh question",
        "endpoint": "/api/generate-question",
        "payload": payload_10,
        "status_code": resp_10.status_code,
        "response": data_10,
        "schema_valid": val_10_ok,
        "schema_message": val_10_msg,
        "duplicate_prevented": not is_duplicate,
        "single_question_confirmed": returned_q.count('?') <= 1
    })
    print(f"  -> Generated Question: '{returned_q}'")
    print(f"  -> Duplicate Prevented: {not is_duplicate} | Single '?' count: {returned_q.count('?') <= 1} | Schema Valid: {val_10_ok}")

    # -------------------------------------------------------------
    # Save benchmark_results.json
    # -------------------------------------------------------------
    output_path = os.path.abspath('benchmark_results.json')
    benchmark_payload = {
        "benchmark_timestamp": datetime.now().isoformat(),
        "total_cases": len(results),
        "all_schemas_valid": all(r.get('schema_valid') for r in results),
        "results": results
    }
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(benchmark_payload, f, indent=2)

    print("\n=====================================================================")
    print(f"  BENCHMARK COMPLETE: All 10 cases saved to {output_path}")
    print(f"  All Schemas Valid: {benchmark_payload['all_schemas_valid']}")
    print("=====================================================================\n")
    return benchmark_payload

if __name__ == '__main__':
    run_benchmark()
