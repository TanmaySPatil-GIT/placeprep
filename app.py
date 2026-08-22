import os
import re
import json
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Configure CORS with support for Vercel preview domains & explicit origins
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '*').strip()
allowed_origins_list = [
    r"https://.*\.vercel\.app",
    r"http://localhost:\d+",
    r"http://127\.0\.0\.1:\d+"
]
if allowed_origins_env and allowed_origins_env != '*':
    for o in allowed_origins_env.split(','):
        cleaned = o.strip()
        if cleaned and cleaned not in allowed_origins_list:
            allowed_origins_list.append(cleaned)

# Initialize CORS with allowed list
CORS(app, resources={r"/*": {"origins": "*" if allowed_origins_env == '*' else allowed_origins_list}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    """Guarantees CORS headers are attached to EVERY response, including error responses and preflight OPTIONS."""
    origin = request.headers.get('Origin')
    if origin:
        # If wildcard or matches any origin pattern
        is_allowed = allowed_origins_env == '*' or any(
            origin == pattern or (isinstance(pattern, str) and re.match(pattern.replace('r"', '').rstrip('"'), origin))
            for pattern in allowed_origins_list
        )
        if is_allowed:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    elif allowed_origins_env == '*':
        response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.errorhandler(Exception)
def handle_global_exception(e):
    """Global exception handler returning JSON error with proper status code and CORS headers."""
    from werkzeug.exceptions import HTTPException
    code = 500
    message = str(e)
    if isinstance(e, HTTPException):
        code = e.code
        message = e.description
    print(f"Global Exception Handler [{code}]: {message}")
    response = jsonify({"error": message, "statusCode": code})
    response.status_code = code
    return response


GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()

# Initialize Gemini Client if Key is present
genai_client = None
if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini API Client initialized successfully!")
    except Exception as e:
        print(f"Notice initializing google-genai client: {e}")

RE_JSON_FENCE_START = re.compile(r'^```(?:json)?\s*', re.IGNORECASE)
RE_JSON_FENCE_END = re.compile(r'\s*```$')

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code fences (```json ... ```) and leading/trailing whitespace."""
    if not raw_text:
        return "{}"
    cleaned = raw_text.strip()
    cleaned = RE_JSON_FENCE_START.sub('', cleaned)
    cleaned = RE_JSON_FENCE_END.sub('', cleaned)
    return cleaned.strip()

MODEL_FALLBACK_CHAIN = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.7-flash'
]

def call_gemini(prompt: str):
    """Calls Gemini API trying available models with multi-model quota fallback chain."""
    if not genai_client:
        print("[Gemini Client] Warning: genai_client is not initialized.")
        return None

    for model_name in MODEL_FALLBACK_CHAIN:
        try:
            response = genai_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                print(f"[Gemini Client] SUCCESS: Generated content using model '{model_name}'")
                return response.text
        except Exception as e:
            err_msg = str(e)
            if '404' in err_msg or 'NOT_FOUND' in err_msg:
                print(f"[Gemini Client] Notice: Model '{model_name}' not found (404). Rotating to next model...")
            elif '429' in err_msg or 'RESOURCE_EXHAUSTED' in err_msg:
                print(f"[Gemini Client] Notice: Model '{model_name}' quota exhausted (429). Rotating to next model...")
            else:
                print(f"[Gemini Client] Notice: Model '{model_name}' error: {err_msg[:120]}. Rotating to next model...")

    print("[Gemini Client] WARNING: All models in fallback chain failed or exhausted.")
    return None
def get_company_tier_info(company_name: str) -> dict:
    name = (company_name or '').lower()
    if any(k in name for k in ['google', 'amazon', 'netflix', 'meta', 'apple', 'microsoft', 'uber', 'atlassian']):
        return {
            'tier': 3,
            'tierName': 'Tier 3 (FAANG / Top-Tier Product)',
            'strictnessPrompt': (
                "COMPANY TIER EVALUATION BAR: TIER 3 (FAANG / TOP-TIER PRODUCT)\n"
                "- High Expectations: Grade with rigorous FAANG-level standards.\n"
                "- Algorithmic Efficiency: Require optimal time/space complexity O(N) or O(log N). Strictly mark down brute-force O(N^2) or suboptimal algorithms.\n"
                "- Code Quality & Architecture: Demand clean abstractions, modular edge case validation, and deep architectural trade-off justification.\n"
                "- Communication: Expect precise, quantitative, and structured delivery."
            )
        }
    elif any(k in name for k in ['flipkart', 'swiggy', 'paytm', 'adobe', 'zomato', 'razorpay', 'stripe', 'salesforce', 'intuit', 'oracle']):
        return {
            'tier': 2,
            'tierName': 'Tier 2 (Product / Mid-Tier Enterprise)',
            'strictnessPrompt': (
                "COMPANY TIER EVALUATION BAR: TIER 2 (PRODUCT / MID-TIER ENTERPRISE)\n"
                "- Moderate-High Expectations: Grade with mid-tier product standards.\n"
                "- Algorithmic Efficiency: Prefer optimal solutions, but accept near-optimal approaches with feedback.\n"
                "- Code Quality & Architecture: Require clean code structure, solid error handling, and good conceptual clarity."
            )
        }
    else:
        return {
            'tier': 1,
            'tierName': 'Tier 1 (Mass Recruiters / IT Services)',
            'strictnessPrompt': (
                "COMPANY TIER EVALUATION BAR: TIER 1 (MASS RECRUITERS / IT SERVICES)\n"
                "- Baseline Expectations: Grade with IT services entry-level standards.\n"
                "- Algorithmic Efficiency: Focus primarily on functional correctness and passing basic test cases (functional O(N^2) solutions accepted with minor note).\n"
                "- Fundamentals & Communication: Focus on basic syntax correctness, DBMS/OS fundamentals, and clear spoken communication."
            )
        }

@app.route('/health', methods=['GET'])

def health_check():
    return jsonify({
        "status": "online",
        "service": "PlacePrep AI Backend",
        "geminiConfigured": genai_client is not None
    })

@app.route('/api/interview-feedback', methods=['POST'])
def interview_feedback():
    data = request.get_json() or {}
    target_field = data.get('userTargetField', 'Software Development')
    company = data.get('companyName', 'Google')
    answers = data.get('answers', [])
    dsa = data.get('dsaPerformance', None)
    aptitude = data.get('aptitudePerformance', None)

    answers_formatted = []
    for idx, ans in enumerate(answers):
        answers_formatted.append(
            f"Question {idx+1}: {ans.get('question', '')}\n"
            f"Candidate Transcript: \"{ans.get('transcript', '')}\"\n"
            f"Metrics: Confidence Score={ans.get('confidenceScore', 85)}/100, "
            f"Pace={ans.get('wordsPerMinute', 135)} WPM, "
            f"Filler Words={ans.get('fillerWordCount', 1)}, "
            f"Long Pauses={ans.get('longPauseCount', 0)}\n"
        )
    
    answers_block = "\n".join(answers_formatted) if answers_formatted else "Sample Candidate Interview Session"

    # Build Aptitude performance context block
    aptitude_block = ""
    if aptitude:
        aptitude_block = f"""
\nAPTITUDE & GK ROUND DATA:
  Overall Score: {aptitude.get('overallScore', 0)}% (Cutoff: {aptitude.get('cutoffPercentage', 60)}%, Passed: {aptitude.get('isPassed', False)})
  Section Breakdown: {json.dumps(aptitude.get('sectionScores', {}))}
  Weakest Section: {aptitude.get('weakestSection', 'Unknown')}
  Note: Reference aptitude performance in areasToImprove if weak or below cutoff (e.g. "You scored 40% on Logical Reasoning...").
"""

    # Build DSA performance context block
    dsa_block = ""
    if dsa:
        time_delta = dsa.get('timeTakenMinutes', 0) - dsa.get('expectedTimeMinutes', 15)
        time_note = (
            f"Solved {abs(time_delta)} min {'OVER' if time_delta > 0 else 'under'} the expected {dsa.get('expectedTimeMinutes')} min target for a {company}-level {dsa.get('difficulty')} question."
            if time_delta != 0 else f"Solved exactly at the expected {dsa.get('expectedTimeMinutes')} min."
        )
        dsa_block = f"""
\nDSA CODING ROUND DATA:
  Question: {dsa.get('questionTitle', 'Unknown')} (Topic: {dsa.get('topic', 'Unknown')}, Difficulty: {dsa.get('difficulty', 'Medium')})
  Time Performance: {time_note}
  Optimal Complexity Benchmark: {dsa.get('optimalComplexity', 'Not recorded')}
  Test Cases: {dsa.get('passedCases', 0)}/{dsa.get('totalCases', 0)} passed
  Note: Include concrete DSA timing/complexity feedback in areasToImprove if time was over budget or cases failed.
"""

    prompt = f"""You are a senior technical hiring manager at {company} evaluating a candidate for a {target_field} role.
Analyze the following candidate performance across Aptitude, DSA, and Interview rounds against {company}'s known hiring expectations:

{answers_block}{aptitude_block}{dsa_block}

CRITICAL INSTRUCTION: You MUST reference {company} by name in your evaluation feedback (e.g., "For {company}-style interviews...").
If aptitude performance is included, reference specific section scores (e.g., "You scored 40% on Logical Reasoning...").
You MUST return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.

Return this exact JSON structure:
{{
  "overallSummary": "2-3 encouraging but honest sentences assessing performance for {company}'s hiring bar.",
  "strengths": [
    "Specific strength point 1 with metric context",
    "Specific strength point 2"
  ],
  "areasToImprove": [
    "Specific actionable point 1 referencing {company} hiring style — include Aptitude/DSA specifics if relevant",
    "Specific actionable point 2"
  ],
  "suggestedFocusAreas": [
    "Aptitude: Logical Reasoning" or "{company} Focus Area",
    "{company} Focus Area 2",
    "{company} Focus Area 3"
  ]
}}
"""

    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in interview_feedback: {e}")

    # Fallback response referencing company by name
    return jsonify({
        "overallSummary": f"For {company}-style interviews, technical depth and articulating your thought process out loud matters as much as the right answer. Your transcripts show solid technical clarity, though structuring your answers around {company}'s specific core principles will boost your overall rating.",
        "strengths": [
          f"Maintained clear conversational pacing averaging {answers[0].get('wordsPerMinute', 138) if answers else 138} WPM.",
          f"Demonstrated solid technical problem-solving when explaining system trade-offs."
        ],
        "areasToImprove": [
          f"For {company}-style interviews, narrate your architectural choices out loud rather than jumping straight to solutions.",
          f"You used filler words {sum(a.get('fillerWordCount', 0) for a in answers) if answers else 1} times — practice silent 1-second pauses instead of filling gaps."
        ],
        "suggestedFocusAreas": [
          f"{company} Culture & Focus Areas",
          "Vocal pause control",
          "High-throughput System Architecture"
        ],
        "note": f"Feedback generated via PlacePrep engine for {company}."
    })

@app.route('/api/analyze-resume', methods=['POST', 'OPTIONS'])
def analyze_resume():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        file = request.files.get('file') or request.files.get('resume')
        if not file:
            return jsonify({"error": "No resume PDF file uploaded. Please select a valid PDF file."}), 400

        # Extract target_field safely from JSON, Form Data, or Query Params
        # Supports target_field (snake_case), targetField, userTargetField
        raw_target_field = None
        if request.is_json and request.json:
            raw_target_field = request.json.get('target_field') or request.json.get('targetField') or request.json.get('userTargetField')
        else:
            raw_target_field = (
                request.form.get('target_field') or
                request.form.get('targetField') or
                request.form.get('userTargetField') or
                request.values.get('target_field') or
                request.values.get('targetField')
            )

        # Validation check: If require_target_field parameter is explicitly passed as true
        strict_validation = False
        if request.is_json and request.json:
            strict_validation = str(request.json.get('require_target_field', '')).lower() == 'true'
        else:
            strict_validation = str(request.form.get('require_target_field', '') or request.args.get('require_target_field', '')).lower() == 'true'

        if not raw_target_field or not str(raw_target_field).strip():
            if strict_validation:
                return jsonify({"error": "target_field is required"}), 400
            # Fallback default in backend so target_field is always defined and analysis proceeds gracefully
            target_field = 'Software Development'
        else:
            target_field = str(raw_target_field).strip()

        raw_company_name = None
        if request.is_json and request.json:
            raw_company_name = request.json.get('company_name') or request.json.get('companyName')
        else:
            raw_company_name = (
                request.form.get('company_name') or
                request.form.get('companyName') or
                request.values.get('company_name') or
                request.values.get('companyName')
            )

        company_name = (raw_company_name.strip() if raw_company_name else '') or 'Google'

        try:
            import pdfplumber
            import io
            pdf_bytes = io.BytesIO(file.read())
            extracted_text = ""
            with pdfplumber.open(pdf_bytes) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"
        except Exception as e:
            return jsonify({"error": f"Failed to extract text from PDF: {str(e)}. Please upload a valid text-based PDF."}), 400

        cleaned_resume_text = extracted_text.strip()
        if not cleaned_resume_text or len(cleaned_resume_text) < 40:
            return jsonify({
                "error": "Could not extract text from this PDF. Please upload a text-based PDF resume rather than a scanned image PDF."
            }), 400

        tier_info = get_company_tier_info(company_name)

        prompt = f"""You are a senior technical recruiter and principal engineering manager conducting a rigorous ATS resume screen for {company_name}.
The candidate is applying for a {target_field} position.

Candidate's Resume Text:
--- RESUME TEXT START ---
{cleaned_resume_text[:4000]}
--- RESUME TEXT END ---

EVALUATION BAR & STRICT CALIBRATION ({tier_info['tierName']}):
- Target Company: {company_name} ({tier_info['tierName']})
- Target Role/Field: {target_field}

CRITICAL SCORING RULES (BE EXTREMELY STRICT AND UNSPARING):
1. TECHNICAL DEPTH (0-30 pts): Basic static HTML/CSS web pages (e.g. portfolio, birthday card, space page, calculator) without modern frameworks (React, Vue, Node, Flask, FastAPI), databases, complex state, or system logic MUST receive LOW points (5-10 out of 30).
2. DOMAIN & BRANCH ALIGNMENT (0-25 pts): If the candidate mentions AI, Machine Learning, CS, or Data Science branch/degree but has ZERO ML/AI projects, deep learning models, PyTorch/TensorFlow, or data pipelines, severely deduct points for missing domain-relevant work.
3. INDUSTRY EXPERIENCE & MEASURABLE IMPACT (0-25 pts): Absence of software internships, open-source contributions, or quantifiable metrics (e.g. latency reduced by X%, 10k users, performance benchmarks) MUST result in minimal points (0-5 out of 25).
4. FORMATTING & PARSEABILITY (0-20 pts): Clear structure and readable sections.

SCORE INTERPRETATION:
- 80-100: Exceptional candidate with strong framework/ML project depth, internships, and quantified metrics ready for FAANG/top-product screening.
- 60-79: Solid candidate with framework depth, but missing top-tier internship or quantified impact.
- 35-59: Beginner resume with basic/toy projects (e.g. static HTML/CSS), missing framework/ML depth or internships. Unlikely to pass recruiter screen at {company_name}.
- 0-34: Incomplete, trivial, or severely deficient resume.

CRITICAL INSTRUCTIONS FOR FEEDBACK:
1. BE BLUNT, HONEST, AND DIRECT. Do NOT soften criticism or use patronizing, sugarcoated encouragement (e.g., avoid "Great effort!" or "You're off to a good start!").
2. Call out weak or trivial projects plainly (e.g. "Static HTML birthday greeting pages and basic CSS portfolios do not demonstrate technical competency for engineering roles at {company_name}.").
3. Explicitly state missing domain competencies (e.g., "AIML student resume completely lacks machine learning frameworks, model training, or data pipelines.").
4. Return ONLY valid raw JSON with NO markdown formatting and NO preamble.

Return this exact JSON structure:
{{
  "atsScore": 42,
  "overallImpression": "2-3 blunt, unvarnished sentences evaluating if this candidate would pass recruiter screening at {company_name}.",
  "strengths": [
    "Factual strength (if any exist)"
  ],
  "weaknesses": [
    {{
      "issue": "Specific weakness title",
      "example": "Quote or reference weak line or missing item from resume",
      "suggestion": "Blunt, concrete action required to reach top-company standards",
      "severity": "high"
    }}
  ],
  "missingKeywords": [
    "Required framework/tool 1", "Required framework/tool 2"
  ],
  "extractedProfile": {{
    "skills": ["Extracted skill 1"],
    "projects": ["Extracted project title"],
    "experience": ["Extracted experience item"],
    "educationSummary": "Extracted degree/education summary"
  }}
}}
"""

        raw_text = call_gemini(prompt)
        if raw_text:
            try:
                cleaned_text = clean_json_response(raw_text)
                parsed_json = json.loads(cleaned_text)
                return jsonify(parsed_json)
            except Exception as e:
                print(f"Gemini API Exception in analyze_resume: {e}")

        # Calibrated heuristic fallback response if Gemini client is unconfigured or fails
        lines = [l.strip() for l in cleaned_resume_text.split('\n') if l.strip()]
        text_lower = cleaned_resume_text.lower()
        extracted_skills = []
        extracted_projects = []
        extracted_experience = []
        
        for line in lines:
            if any(kw in line.lower() for kw in ['skill', 'python', 'java', 'react', 'javascript', 'sql', 'c++', 'aws', 'docker', 'git', 'node', 'flask', 'api']):
                if len(line) < 120 and line not in extracted_skills:
                    extracted_skills.append(line)
            elif any(kw in line.lower() for kw in ['project', 'app', 'system', 'platform', 'tool', 'portal', 'dashboard', 'ai']):
                if len(line) < 150 and line not in extracted_projects:
                    extracted_projects.append(line)
            elif any(kw in line.lower() for kw in ['intern', 'engineer', 'developer', 'company', 'inc', 'tech', 'ltd']):
                if len(line) < 150 and line not in extracted_experience:
                    extracted_experience.append(line)

        # Dynamic heuristic ATS score calculation
        has_frameworks = any(kw in text_lower for kw in ['react', 'vue', 'angular', 'node', 'express', 'flask', 'django', 'fastapi', 'spring', 'pytorch', 'tensorflow', 'keras', 'scikit', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'postgres', 'mongodb', 'redis'])
        has_internship = any(kw in text_lower for kw in ['intern', 'internship', 'software engineer', 'developer intern', 'experience'])
        has_metrics = any(re.search(r'\d+%', line) or re.search(r'\d+\s*(users|ms|k|m|requests|fps)', line, re.I) for line in lines)
        is_aiml_branch = any(kw in text_lower for kw in ['aiml', 'ai & ml', 'artificial intelligence', 'machine learning', 'data science'])
        has_ml_projects = any(kw in text_lower for kw in ['pytorch', 'tensorflow', 'model', 'neural', 'nlp', 'computer vision', 'classifier', 'regression', 'scikit-learn', 'deep learning'])

        calc_score = 35
        if has_frameworks: calc_score += 20
        if has_internship: calc_score += 20
        if has_metrics: calc_score += 15
        if is_aiml_branch and has_ml_projects: calc_score += 10
        elif is_aiml_branch and not has_ml_projects: calc_score -= 10

        calc_score = max(20, min(95, calc_score))

        return jsonify({
            "atsScore": calc_score,
            "overallImpression": f"This resume shows beginner-level technical depth for {target_field} roles targeting {company_name}. The listed projects and technical stack require significant upgrade with full-stack frameworks, production databases, and domain-relevant experience to pass recruiter screening.",
            "strengths": [
                "Parseable single-column layout structure.",
                "Factual list of basic programming fundamentals."
            ],
            "weaknesses": [
                {
                    "issue": "Lack of Advanced Software Frameworks & Production Depth",
                    "example": lines[min(3, len(lines)-1)] if lines else "Static web pages",
                    "suggestion": "Replace basic static web projects with full-stack applications featuring authentication, databases, and API integration.",
                    "severity": "high"
                },
                {
                    "issue": "Absence of Industry Experience & Quantifiable Engineering Metrics",
                    "example": "No software engineering internships or performance metrics listed.",
                    "suggestion": "Secure technical internships or contribute to open-source projects, quantifying outcomes with latency, traffic, or user metrics.",
                    "severity": "high"
                }
            ],
            "missingKeywords": ["Data Structures & Algorithms", "Python", "React / Node.js", "SQL / Databases", "System Design", "Docker"],
            "extractedProfile": {
                "skills": extracted_skills[:6] if extracted_skills else ["JavaScript", "HTML/CSS", "Git"],
                "projects": extracted_projects[:4] if extracted_projects else ["Personal Website"],
                "experience": extracted_experience[:3] if extracted_experience else [],
                "educationSummary": "Bachelor of Technology"
            }
        })
    except Exception as outer_err:
        print(f"Unhandled Exception in analyze_resume: {str(outer_err)}")
        return jsonify({"error": f"Server error processing resume: {str(outer_err)}"}), 500


@app.route('/api/generate-resume-interview-questions', methods=['POST', 'OPTIONS'])
def generate_resume_interview_questions():
    if request.method == 'OPTIONS':
        return '', 200
    import random

    data = request.get_json() or {}
    extracted_profile = data.get('extractedProfile', {})
    company_name = data.get('selectedCompany', 'Google')
    target_field = data.get('targetField', 'Software Development')
    recent_questions = data.get('recentQuestions', [])

    skills = ", ".join(extracted_profile.get('skills', [])) or "Software Development, Data Structures, System Design"
    projects = ", ".join(extracted_profile.get('projects', [])) or "Full-Stack Web App, Algorithmic Engine"
    experience = ", ".join(extracted_profile.get('experience', [])) or "Software Development Intern"

    angles = [
        "Focus heavily on production scalability bottlenecks and memory optimization under load.",
        "Focus on debugging complex edge cases, race conditions, and technical failure modes.",
        "Focus on architecture trade-offs, modularity, API contracts, and clean-code design.",
        "Focus on end-to-end feature ownership, user impact metrics, and cross-functional leadership."
    ]
    chosen_angle = random.choice(angles)
    recent_str = ", ".join([f'"{q}"' for q in recent_questions[-4:]]) if recent_questions else "None"

    prompt = f"""You are a principal technical interviewer at {company_name} conducting a personalized technical interview for a {target_field} candidate.
The candidate's resume contains:
- Projects: {projects}
- Experience: {experience}
- Skills: {skills}

CREATIVE ANGLE FOR THIS INTERVIEW SESSION: {chosen_angle}
RECENTLY ASKED TOPICS (DO NOT REPEAT OR OVERLAP WITH THESE): {recent_str}

CRITICAL INSTRUCTIONS:
1. Generate 6-8 technical and behavioral interview questions that are explicitly personalized to this specific candidate's listed projects/experience AND align with {company_name}'s known interview bar.
2. AVOID generic or cliché phrasing (e.g. avoid 'Tell me about yourself' — ask a specific project architecture question instead).
3. Vary the phrasing and problem scenario to ensure each session feels distinct.
4. You MUST return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.

Return this exact JSON structure:
{{
  "questions": [
    {{
      "question": "Personalized interview question referencing their specific project or experience",
      "basedOn": "Name of the project or experience item from their resume that inspired this question",
      "focusArea": "Technical competency or leadership principle"
    }}
  ]
}}
"""

    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in generate_resume_interview_questions: {e}")

    # Fallback personalized questions
    proj_list = extracted_profile.get('projects', [])
    exp_list = extracted_profile.get('experience', [])
    first_proj = proj_list[0] if proj_list else "your primary full-stack project"
    first_exp = exp_list[0] if exp_list else "your software engineering internship"

    return jsonify({
        "questions": [
            {
                "question": f"In {first_proj}, what was the most complex architectural trade-off you faced, and how did you validate your choice under {company_name}-level scaling constraints?",
                "basedOn": first_proj,
                "focusArea": "System Architecture & Trade-offs"
            },
            {
                "question": f"Tell me about a time during {first_exp} when you encountered a high-severity bug or failing edge case right before deployment. How did you diagnose it?",
                "basedOn": first_exp,
                "focusArea": "Debugging & Production Reliability"
            },
            {
                "question": f"When building {first_proj}, how did you structure your API layers and state management to maintain low latency?",
                "basedOn": first_proj,
                "focusArea": "Full-Stack Efficiency & Clean Code"
            },
            {
                "question": f"For {company_name}-style technical screens, ownership is paramount. Describe a feature in your resume projects that you owned end-to-end from requirements to delivery.",
                "basedOn": first_proj,
                "focusArea": f"{company_name} Ownership & End-to-End Execution"
            },
        ]
    })


@app.route('/api/evaluate-answer-rubric', methods=['POST', 'OPTIONS'])
def evaluate_answer_rubric():
    if request.method == 'OPTIONS':
        return '', 200

RUBRIC_DATABASE = {
    'oop-inheritance': {
        'topicId': 'oop-inheritance',
        'topicName': 'OOP - Inheritance',
        'keyConcepts': [
            'Inheritance allows a subclass to derive attributes and methods from a superclass to enable code reuse',
            'Establishes a strict "is-a" subtype relationship between parent and child classes',
            'Supports runtime polymorphism via method overriding (subclass re-implementing superclass methods)',
            'Composition ("has-a") is often preferred over inheritance to avoid tight coupling and the fragile base class problem'
        ],
        'commonMisconceptions': [
            'Confusing method overriding (same signature, runtime) with method overloading (different signature, compile-time)',
            'Thinking private members of a parent class are directly accessible in child classes',
            'Assuming inheritance is always the best mechanism for reusing code across unrelated classes'
        ]
    },
    'oop-polymorphism': {
        'topicId': 'oop-polymorphism',
        'topicName': 'OOP - Polymorphism',
        'keyConcepts': [
            'Polymorphism allows objects of different classes to be treated as objects of a common superclass or interface',
            'Compile-time (static) polymorphism is achieved via method overloading and operator overloading',
            'Runtime (dynamic) polymorphism is achieved via method overriding using virtual methods or dynamic dispatch',
            'Interfaces and abstract classes define dynamic contracts without tying callers to concrete implementations'
        ],
        'commonMisconceptions': [
            'Believing runtime polymorphism can be resolved at compile time by the compiler',
            'Thinking static methods or private methods can be overridden polymorphically in child classes',
            'Confusing interface implementation with abstract class inheritance'
        ]
    },
    'oop-encapsulation-abstraction': {
        'topicId': 'oop-encapsulation-abstraction',
        'topicName': 'OOP - Encapsulation & Abstraction',
        'keyConcepts': [
            'Encapsulation bundles data and methods into a class while restricting direct access using access modifiers',
            'Abstraction hides background implementation details and reveals only essential interfaces',
            'Encapsulation protects object internal state integrity through data hiding and invariant validation',
            'Abstraction reduces cognitive complexity by exposing high-level contracts'
        ],
        'commonMisconceptions': [
            'Thinking Encapsulation and Abstraction are the exact same concept',
            'Assuming encapsulation is just making all class fields private with getters and setters without validation',
            'Believing abstraction can only be achieved through interfaces'
        ]
    },
    'dbms-normalization': {
        'topicId': 'dbms-normalization',
        'topicName': 'DBMS - Normalization',
        'keyConcepts': [
            'Normalization structures relational database tables to reduce data redundancy and eliminate anomalies',
            '1NF requires atomic values and unique tuple identification',
            '2NF requires 1NF and no partial key dependencies',
            '3NF requires 2NF and no transitive dependencies',
            'Denormalization is intentionally used in read-heavy analytics/OLAP systems to improve query speed'
        ],
        'commonMisconceptions': [
            'Believing higher normal forms (e.g. 3NF or BCNF) always guarantee faster SQL query execution',
            'Thinking primary keys must always be single auto-incrementing integers rather than composite or natural keys',
            'Confusing 2NF (eliminating partial key dependence) with 3NF (eliminating transitive non-key dependence)'
        ]
    },
    'dbms-transactions-acid': {
        'topicId': 'dbms-transactions-acid',
        'topicName': 'DBMS - Transactions & ACID Properties',
        'keyConcepts': [
            'Atomicity ensures all operations in a database transaction complete successfully, or all are rolled back',
            'Consistency ensures a transaction transitions the database from one valid state to another',
            'Isolation controls how concurrent transactions interact',
            'Durability guarantees committed transaction changes persist permanently',
            'Read phenomena: Dirty Read, Non-Repeatable Read, and Phantom Read depend on configured isolation level'
        ],
        'commonMisconceptions': [
            'Assuming Repeatable Read isolation level prevents Phantom Reads in standard relational databases',
            'Believing Atomicity means concurrent transactions cannot see intermediate changes (that is Isolation)',
            'Thinking database backups provide Durability without write-ahead logging (WAL) or persistent disk sync'
        ]
    },
    'dbms-indexing-b-trees': {
        'topicId': 'dbms-indexing-b-trees',
        'topicName': 'DBMS - Database Indexing & B-Trees',
        'keyConcepts': [
            'Database indexes use B-Tree / B+Tree structures to reduce search time complexity from O(N) to O(log N)',
            'Clustered Index determines physical storage order of data rows on disk (only 1 per table)',
            'Non-Clustered Index maintains a separate structure pointing back to data row pointers',
            'Composite indexes require adherence to Leftmost Prefix Rule',
            'Indexing accelerates READ queries but adds overhead to INSERT, UPDATE, and DELETE operations'
        ],
        'commonMisconceptions': [
            'Believing adding indexes to every column will make all SQL queries faster',
            'Thinking a table can have multiple Clustered Indexes',
            'Assuming a query with WHERE age = 25 AND city = "NYC" can use a composite index on (city, age) if queried in reverse order without optimizer intelligence'
        ]
    },
    'ds-arrays-linkedlists': {
        'topicId': 'ds-arrays-linkedlists',
        'topicName': 'Data Structures - Arrays vs Linked Lists',
        'keyConcepts': [
            'Arrays store elements in contiguous memory blocks, enabling O(1) random access by index',
            'Linked Lists store nodes with data and pointers scattered in memory, requiring O(N) sequential traversal',
            'Inserting or deleting at the beginning or middle of an Array requires O(N) shifting of elements',
            'Singly and Doubly Linked Lists support O(1) insertion/deletion at a known node pointer',
            'Arrays benefit heavily from CPU cache locality; Linked Lists suffer from cache misses'
        ],
        'commonMisconceptions': [
            'Thinking searching for a value in an unsorted Array is O(1) time',
            'Believing Linked List insertion at an arbitrary position is O(1) without accounting for O(N) traversal time',
            'Assuming Linked Lists use less memory than Arrays'
        ]
    },
    'ds-hash-tables': {
        'topicId': 'ds-hash-tables',
        'topicName': 'Data Structures - Hash Tables & Collision Resolution',
        'keyConcepts': [
            'Hash Tables map key-value pairs using a hash function for expected O(1) lookup, insertion, and deletion',
            'Collision resolution techniques: Separate Chaining and Open Addressing',
            'Hash functions must distribute keys uniformly to avoid clustering',
            'Load factor triggers table resizing (rehashing) when exceeded',
            'Worst-case lookup degrades to O(N) when all keys hash to the same bucket'
        ],
        'commonMisconceptions': [
            'Believing Hash Table lookups are strictly O(1) in the worst-case scenario',
            'Thinking Open Addressing dynamically grows bucket lists like Separate Chaining',
            'Assuming Hash Tables maintain element insertion order by default'
        ]
    },
    'ds-trees-bst': {
        'topicId': 'ds-trees-bst',
        'topicName': 'Data Structures - Binary Trees & BST Traversal',
        'keyConcepts': [
            'BST property: left child values < root value < right child values',
            'BST operations (search, insert, delete) run in O(H) time where H is tree height',
            'Unbalanced BST degrades to O(N) worst-case time complexity',
            'Self-balancing BSTs (AVL, Red-Black Trees) guarantee O(log N) operations',
            'In-Order traversal (Left-Root-Right) yields sorted values in BST'
        ],
        'commonMisconceptions': [
            'Assuming searching a Binary Search Tree is always O(log N) without height balance guarantees',
            'Confusing Binary Trees with Binary Search Trees',
            'Thinking In-Order traversal yields sorted values for any binary tree, not just BSTs'
        ]
    },
    'sysdesign-caching': {
        'topicId': 'sysdesign-caching',
        'topicName': 'System Design - Caching Strategies & Eviction Policies',
        'keyConcepts': [
            'Caching stores frequently accessed data in fast RAM memory',
            'Caching Strategies: Cache-Aside, Write-Through, Write-Around, Write-Back',
            'Cache Eviction Policies: LRU, LFU, FIFO, TTL',
            'Cache invalidation challenges: Cache Stampede, Cache Penetration, Cache Breakdown'
        ],
        'commonMisconceptions': [
            'Believing Write-Back caching guarantees immediate data durability during sudden system crashes',
            'Thinking Redis is purely an in-memory key-value store without persistence options',
            'Assuming Cache-Aside automatically keeps database and cache in lockstep sync'
        ]
    },
    'sysdesign-load-balancing': {
        'topicId': 'sysdesign-load-balancing',
        'topicName': 'System Design - Load Balancing & Scalability',
        'keyConcepts': [
            'Load balancers distribute incoming network traffic across backend servers',
            'Layer 4 vs Layer 7 load balancing',
            'Load balancing algorithms: Round Robin, Least Connections, Consistent Hashing',
            'Horizontal Scaling vs Vertical Scaling'
        ],
        'commonMisconceptions': [
            'Believing load balancing alone prevents database bottlenecks',
            'Confusing Layer 4 routing with Layer 7 routing',
            'Assuming Round Robin algorithm handles servers with unequal compute hardware effectively'
        ]
    },
    'sysdesign-cap-theorem': {
        'topicId': 'sysdesign-cap-theorem',
        'topicName': 'System Design - CAP Theorem & Distributed Consistency',
        'keyConcepts': [
            'CAP Theorem: Consistency, Availability, Partition Tolerance (max 2 at once)',
            'Partition Tolerance (P) is mandatory in distributed networks',
            'CP Systems vs AP Systems',
            'PACELC Theorem extends CAP by adding Latency vs Consistency trade-offs'
        ],
        'commonMisconceptions': [
            'Believing a database can pick C and A and completely drop P in a distributed network',
            'Thinking Eventual Consistency implies data may remain inconsistent forever',
            'Confusing CAP Consistency with ACID Consistency'
        ]
    },
    'qa-stlc-test-pyramid': {
        'topicId': 'qa-stlc-test-pyramid',
        'topicName': 'QA - Software Testing Life Cycle & Test Pyramid',
        'keyConcepts': [
            'STLC phases: Requirement Analysis, Test Planning, Test Execution, Closure',
            'Test Pyramid: Unit Tests (base), Integration Tests (middle), E2E UI Tests (top apex)',
            'Verification vs Validation',
            'Shift-Left Testing'
        ],
        'commonMisconceptions': [
            'Thinking STLC only begins after software coding is 100% complete',
            'Inverting the Test Pyramid by having 80% E2E UI automation tests',
            'Confusing Severity with Priority'
        ]
    },
    'qa-bva-equivalence': {
        'topicId': 'qa-bva-equivalence',
        'topicName': 'QA - Boundary Value Analysis & Equivalence Partitioning',
        'keyConcepts': [
            'Equivalence Partitioning (EP) divides input data into valid and invalid partitions',
            'Boundary Value Analysis (BVA) tests boundary values between partitions',
            'Defects occur disproportionately at boundary limits',
            'Positive vs Negative testing'
        ],
        'commonMisconceptions': [
            'Thinking testing every single integer value in a range is necessary instead of partitioning',
            'Believing Boundary Value Analysis is only applicable to numeric fields',
            'Confusing boundary values with internal array index pointers'
        ]
    },
    'qa-selenium-pom': {
        'topicId': 'qa-selenium-pom',
        'topicName': 'QA - Test Automation Frameworks & Page Object Model',
        'keyConcepts': [
            'Page Object Model (POM) creates an object repository for web page UI elements',
            'Separates UI element locators from test assertions',
            'Explicit Waits are preferred over Thread.sleep()',
            'Data-Driven Testing framework'
        ],
        'commonMisconceptions': [
            'Placing test assertions directly inside Page Object classes',
            'Using hardcoded Thread.sleep() calls to resolve async element loading',
            'Believing absolute XPath is resilient to UI updates'
        ]
    },
    'ds-sql-aggregations-joins': {
        'topicId': 'ds-sql-aggregations-joins',
        'topicName': 'SQL - Joins, Aggregations & Window Functions',
        'keyConcepts': [
            'SQL Joins: INNER, LEFT, RIGHT, FULL, CROSS',
            'GROUP BY vs HAVING vs WHERE',
            'Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK()',
            'Subqueries vs CTEs'
        ],
        'commonMisconceptions': [
            'Using aggregate functions in a WHERE clause instead of a HAVING clause',
            'Confusing ROW_NUMBER() with RANK() and DENSE_RANK()',
            'Thinking LEFT JOIN excludes unmatched right table rows when filtering in WHERE'
        ]
    },
    'ds-stats-hypothesis-testing': {
        'topicId': 'ds-stats-hypothesis-testing',
        'topicName': 'Statistics - Hypothesis Testing & P-Values',
        'keyConcepts': [
            'Null Hypothesis (H0) vs Alternative Hypothesis (H1)',
            'P-value is probability of obtaining results at least as extreme assuming H0 is true',
            'Type I Error (Alpha, false positive) vs Type II Error (Beta, false negative)',
            'Statistical Power (1 - Beta)'
        ],
        'commonMisconceptions': [
            'Believing p-value is the probability that the Null Hypothesis is true',
            'Confusing statistical significance with practical effect size',
            'Assuming failing to reject H0 proves H0 is true'
        ]
    },
    'ds-ml-bias-variance': {
        'topicId': 'ds-ml-bias-variance',
        'topicName': 'ML - Overfitting, Bias-Variance Tradeoff & Regularization',
        'keyConcepts': [
            'Bias Error (underfitting) vs Variance Error (overfitting)',
            'L1 (Lasso) and L2 (Ridge) regularization',
            'Cross-validation (k-fold CV)'
        ],
        'commonMisconceptions': [
            'Believing high training accuracy automatically means a great production model',
            'Thinking L1 and L2 regularization decrease model bias',
            'Confusing Underfitting with Overfitting'
        ]
    },
    'ds-ml-evaluation-metrics': {
        'topicId': 'ds-ml-evaluation-metrics',
        'topicName': 'ML - Classification Evaluation Metrics',
        'keyConcepts': [
            'Confusion Matrix: TP, TN, FP, FN',
            'Accuracy, Precision, Recall, F1-Score, ROC-AUC'
        ],
        'commonMisconceptions': [
            'Using Accuracy to evaluate models on severely imbalanced datasets',
            'Thinking Precision and Recall can both be maximized simultaneously without trade-offs',
            'Confusing Precision with Recall'
        ]
    },
    'behavioral-handling-conflict': {
        'topicId': 'behavioral-handling-conflict',
        'topicName': 'Behavioral - Handling Team Conflict & Technical Disagreements',
        'keyConcepts': [
            'Focusing on objective data, benchmarks, and customer impact',
            'Actively listening to peer perspectives',
            'Disagree and Commit principle',
            'De-escalating tension through 1-on-1 dialogue or PoCs',
            'STAR method structure'
        ],
        'commonMisconceptions': [
            'Claiming you have never had a conflict or disagreement with a teammate',
            'Describing a situation where you simply surrendered your position without technical justification',
            'Blaming the other person or framing conflict as a personal argument'
        ]
    },
    'behavioral-ownership-failure': {
        'topicId': 'behavioral-ownership-failure',
        'topicName': 'Behavioral - Ownership & Taking Accountability for Failure',
        'keyConcepts': [
            'Taking responsibility without deflecting blame',
            'Conducting blameless root-cause analysis (5 Whys)',
            'Proactively implementing long-term safeguards',
            'Transparent communication with stakeholders',
            'Demonstrating lessons learned'
        ],
        'commonMisconceptions': [
            'Downplaying the severity of the mistake or deflecting blame onto vague requirements',
            'Focusing 90% of response on the failure and 10% on action/learnings',
            'Thinking ownership means resolving issues in isolation without notifying the team'
        ]
    },
    'behavioral-ambiguity-adaptability': {
        'topicId': 'behavioral-ambiguity-adaptability',
        'topicName': 'Behavioral - Navigating Ambiguity & Rapid Adaptability',
        'keyConcepts': [
            'Breaking down vague problems into actionable sub-problems',
            'Formulating and validating reasonable assumptions',
            'Delivering MVP iterations quickly',
            'Resilience and composure under shifting priorities'
        ],
        'commonMisconceptions': [
            'Waiting passively for explicit step-by-step instructions',
            'Expressing frustration about shifting requirements',
            'Making unverified assumptions without validating'
        ]
    },
    'behavioral-prioritization': {
        'topicId': 'behavioral-prioritization',
        'topicName': 'Behavioral - Managing Competing Priorities & Deadlines',
        'keyConcepts': [
            'Evaluating urgency vs impact (Eisenhower Matrix / RICE)',
            'Communicating early and transparently when deadlines are at risk',
            'Negotiating scope reductions rather than sacrificing quality'
        ],
        'commonMisconceptions': [
            'Saying yes to every request leading to burnout and buggy code',
            'Silently missing deadlines without alerting stakeholders',
            'Arbitrarily dropping tasks without aligning with leads'
        ]
    },
    'behavioral-motivation-company': {
        'topicId': 'behavioral-motivation-company',
        'topicName': 'Behavioral - Company Culture, Values & Role Alignment',
        'keyConcepts': [
            'Connecting personal career goals to specific engineering products and company mission',
            'Articulating familiarity with core cultural values with concrete examples',
            'Explaining unique value and perspective brought to the team',
            'Demonstrating genuine curiosity about team architecture and practices'
        ],
        'commonMisconceptions': [
            'Giving generic flattery without citing specific projects, tech stack, or values',
            'Focusing exclusively on compensation, brand prestige, or perks',
            'Showing zero knowledge of company domain or products'
        ]
    },
    'behavioral-strengths-self-awareness': {
        'topicId': 'behavioral-strengths-self-awareness',
        'topicName': 'Behavioral - Self-Awareness, Strengths & Growth Areas',
        'keyConcepts': [
            'Framing strengths with tangible evidence and technical metrics',
            'Discussing genuine developmental areas with concrete steps being taken',
            'Demonstrating a growth mindset by seeking critique as actionable insight',
            'Balancing confidence with humility and willingness to learn'
        ],
        'commonMisconceptions': [
            'Disguising a strength as a fake weakness',
            'Denying having any technical or communication weaknesses',
            'Listing a fatal core weakness without showing any mitigation'
        ]
    },
    'behavioral-leadership-mentorship': {
        'topicId': 'behavioral-leadership-mentorship',
        'topicName': 'Behavioral - Leadership, Initiative & Mentorship',
        'keyConcepts': [
            'Taking initiative to solve unassigned pain points or improve developer tooling',
            'Mentoring junior engineers and conducting constructive code reviews',
            'Rallying cross-functional consensus around technical proposals',
            'Leading by influence and data rather than formal managerial authority'
        ],
        'commonMisconceptions': [
            'Believing leadership requires an official manager title',
            'Focusing solely on individual code output while ignoring team enablement',
            'Dictating decisions without soliciting feedback'
        ]
    },
    'behavioral-ethics-integrity': {
        'topicId': 'behavioral-ethics-integrity',
        'topicName': 'Behavioral - Ethics, Integrity & Difficult Choices',
        'keyConcepts': [
            'Upholding user privacy, data security, and compliance under business pressure',
            'Transparently raising red flags regarding system vulnerabilities or flawed metrics',
            'Respecting intellectual property and confidential information',
            'Balancing urgency with rigorous ethical and engineering standards'
        ],
        'commonMisconceptions': [
            'Ignoring known security or privacy risks to hit a deadline',
            'Blaming external constraints for compromising software integrity',
            'Thinking ethics is only relevant for legal departments'
        ]
    },
    'devops-cicd-iac': {
        'topicId': 'devops-cicd-iac',
        'topicName': 'DevOps - CI/CD Pipelines & Infrastructure as Code',
        'keyConcepts': [
            'Continuous Integration (CI) and Continuous Deployment (CD)',
            'Infrastructure as Code (IaC) with Terraform/CloudFormation',
            'Blue/Green deployment, Canary releases',
            'Idempotency in IaC'
        ],
        'commonMisconceptions': [
            'Thinking CI/CD means pushing untested code straight to production',
            'Manually modifying cloud resources via UI while using Terraform',
            'Confusing Continuous Delivery with Continuous Deployment'
        ]
    },
    'cybersecurity-owasp-auth': {
        'topicId': 'cybersecurity-owasp-auth',
        'topicName': 'Cybersecurity - OWASP Top 10 & AuthN vs AuthZ',
        'keyConcepts': [
            'Authentication (AuthN) vs Authorization (AuthZ)',
            'OWASP Top 10 vulnerabilities (SQLi, XSS, Broken Access Control)',
            'Preventing SQLi via parameterized queries / prepared statements',
            'Preventing XSS via output encoding and CSP',
            'Principle of Least Privilege'
        ],
        'commonMisconceptions': [
            'Confusing Authentication with Authorization',
            'Believing regex sanitization completely eliminates SQL Injection without prepared statements',
            'Thinking MD5/SHA-256 password hashing without salt/bcrypt is secure'
        ]
    }
}

@app.route('/api/evaluate-answer', methods=['POST', 'OPTIONS'])
def evaluate_answer():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    session_id = data.get('sessionId', '')
    last_question = data.get('lastQuestionAsked') or data.get('question') or data.get('lastQuestion') or 'Technical interview question'
    student_answer = data.get('studentAnswer') or data.get('transcript') or data.get('answer') or ''
    current_topic_id = data.get('currentTopicId') or data.get('topicId') or 'oop-inheritance'
    rubric_override = data.get('rubric')
    session_override = data.get('sessionState')

    # 1. Fetch Rubric for currentTopicId
    if rubric_override and isinstance(rubric_override, dict):
        rubric = rubric_override
    else:
        rubric = RUBRIC_DATABASE.get(current_topic_id, RUBRIC_DATABASE['oop-inheritance'])

    topic_name = rubric.get('topicName', 'Technical Concept')
    key_concepts = rubric.get('keyConcepts', [])
    common_misconceptions = rubric.get('commonMisconceptions', [])

    # 2. Extract recent state context
    history_summary = ""
    recent_turns_str = ""
    if session_override and isinstance(session_override, dict):
        history_summary = session_override.get('historySummary', '')
        turns = session_override.get('recentTurns', [])
        recent_turns_str = "\n".join([f"{t.get('role', '').capitalize()}: \"{t.get('text', '')}\"" for t in turns[-6:]]) if turns else ""

    ans_clean = student_answer.strip().lower()

    # Pre-check A: "don't know" phrases
    if any(p in ans_clean for p in ["don't know", "dont know", "not sure", "no idea", "idk", "have no clue"]):
        return jsonify({
            "verdict": "dont_know",
            "conceptsCorrect": [],
            "conceptsWrong": [],
            "conceptsMissing": key_concepts,
            "confidenceOfStudent": "low",
            "followUpWorthy": True,
            "reason": f"Candidate explicitly indicated lack of knowledge or uncertainty on {topic_name}."
        })

    # Pre-check B: Empty / extremely short response
    if len(ans_clean) < 4:
        return jsonify({
            "verdict": "vague",
            "conceptsCorrect": [],
            "conceptsWrong": [],
            "conceptsMissing": key_concepts,
            "confidenceOfStudent": "low",
            "followUpWorthy": True,
            "reason": "Candidate response was empty or too brief to evaluate against reference rubric concepts."
        })

    # Build Grounded Grader Prompt for Gemini
    kc_formatted = "\n".join([f"- {kc}" for kc in key_concepts]) if key_concepts else "- Core topic fundamentals"
    cm_formatted = "\n".join([f"- {cm}" for cm in common_misconceptions]) if common_misconceptions else "- None defined"

    prompt = f"""You are a strict, objective, structured Answer Evaluator for technical & behavioral interviews.
Your ONLY job is to judge the candidate's answer against the reference rubric below.
Do NOT act as an interviewer. Do NOT generate the next question.

QUESTION ASKED: "{last_question}"
STUDENT ANSWER: "{student_answer}"

REFERENCE GROUND TRUTH RUBRIC ({topic_name}):
=== KEY CONCEPTS TO CHECK FOR ===
{kc_formatted}

=== COMMON MISCONCEPTIONS TO WATCH FOR (PENALIZE IF PRESENT) ===
{cm_formatted}

CONTEXT FROM SESSION:
- History Summary: {history_summary or 'None'}
- Recent Turns: {recent_turns_str or 'None'}

CRITICAL GRADING RULES:
1. Check the student's answer against these key concepts: {key_concepts}.
2. Check specifically for these common misconceptions: {common_misconceptions}.
3. Do NOT judge correctness from general knowledge alone — use this rubric as the primary reference.
4. If the student confused a key concept with a common misconception (e.g. confusing overriding with overloading, or thinking private members are inherited), set verdict to "incorrect" or "partially_correct" and explicitly flag the misconception in conceptsWrong.
5. Determine verdict strictly from: "correct" | "partially_correct" | "incorrect" | "vague" | "off_topic" | "dont_know".
6. Determine confidenceOfStudent strictly from: "low" | "medium" | "high".
7. Set followUpWorthy to true if verdict is "partially_correct", "incorrect", "vague", or "dont_know", or if conceptsMissing is non-empty.
8. Provide a brief 1-2 sentence reason citing the specific rubric concepts.

Return ONLY valid raw JSON with NO markdown code blocks, using this EXACT structure:
{{
  "verdict": "incorrect",
  "conceptsCorrect": ["Concept correctly explained"],
  "conceptsWrong": ["Specific misconception triggered from rubric"],
  "conceptsMissing": ["Key concept omitted"],
  "confidenceOfStudent": "medium",
  "followUpWorthy": true,
  "reason": "Brief internal justification referencing the specific rubric concepts."
}}
"""

    eval_result = None
    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            eval_result = json.loads(cleaned_text)
        except Exception as e:
            print(f"Gemini API Exception in evaluate_answer: {e}")

    if not eval_result or not isinstance(eval_result, dict) or 'verdict' not in eval_result:
        # Grounded deterministic fallback evaluation
        has_misconception = any(
            any(w in ans_clean for w in m.lower().split() if len(w) > 5)
            for m in common_misconceptions
        )
        has_key_concept = any(
            any(w in ans_clean for w in k.lower().split() if len(w) > 5)
            for k in key_concepts
        )

        if has_misconception and not has_key_concept:
            v = "incorrect"
            c_wrong = [common_misconceptions[0]] if common_misconceptions else ["Triggered common topic misconception"]
            c_corr = []
        elif has_misconception and has_key_concept:
            v = "partially_correct"
            c_wrong = [common_misconceptions[0]] if common_misconceptions else ["Mixed correct concepts with misconception"]
            c_corr = [key_concepts[0]] if key_concepts else ["Basic concept mention"]
        elif has_key_concept:
            v = "correct"
            c_wrong = []
            c_corr = key_concepts[:2] if key_concepts else ["Demonstrated core concepts"]
        else:
            v = "vague"
            c_wrong = []
            c_corr = []

        eval_result = {
            "verdict": v,
            "conceptsCorrect": c_corr,
            "conceptsWrong": c_wrong,
            "conceptsMissing": [k for k in key_concepts if k not in c_corr],
            "confidenceOfStudent": "medium" if v in ["correct", "partially_correct"] else "low",
            "followUpWorthy": v != "correct",
            "reason": f"Grounded check against {topic_name} rubric: verdict evaluated as {v}."
        }

    return jsonify(eval_result)


def check_navigation_intent(student_answer: str) -> dict:
    if not student_answer or not isinstance(student_answer, str):
        return None
    ans = student_answer.strip().lower()

    repeat_phrases = [
        'repeat the question',
        'repeat question',
        'can you repeat',
        'please repeat',
        'say that again',
        'pardon',
        "didn't hear you",
        "didnt hear",
        'what was the question',
        'could you repeat'
    ]
    if any(p in ans for p in repeat_phrases):
        return {
            'strategy': 'repeat_question',
            'topicAdvance': False,
            'newDifficultyLevel': None,
            'isNavigation': True
        }

    simplify_phrases = [
        'simplify the question',
        'simplify question',
        'can you simplify',
        'make it simpler',
        'explain in simpler terms',
        'make it easier',
        'too complicated',
        'rephrase question',
        'rephrase'
    ]
    if any(p in ans for p in simplify_phrases):
        return {
            'strategy': 'simplify_question',
            'topicAdvance': False,
            'newDifficultyLevel': None,
            'isNavigation': True
        }

    return None


def evaluate_decision_engine(evaluator_output: dict, session_state: dict, student_answer: str = "") -> dict:
    """
    Pure, rule-based Decision Engine (Prompt 4).
    Maps Evaluator outputs & session state to strategy.
    """
    nav_intent = check_navigation_intent(student_answer)
    if nav_intent:
        return nav_intent

    current_depth = session_state.get('currentDepth', 0) if isinstance(session_state, dict) else 0
    current_diff = (session_state.get('difficultyLevel', 'medium') if isinstance(session_state, dict) else 'medium').lower()
    
    verdict = (evaluator_output.get('verdict', 'partially_correct') if isinstance(evaluator_output, dict) else 'partially_correct').lower()
    confidence = (evaluator_output.get('confidenceOfStudent', 'medium') if isinstance(evaluator_output, dict) else 'medium').lower()
    concepts_missing = evaluator_output.get('conceptsMissing', []) if isinstance(evaluator_output, dict) else []

    # 1. HARD RULE: Cap cross-questioning at 3 turns per topic
    if current_depth >= 3:
        return {
            'strategy': 'move_to_next_topic',
            'topicAdvance': True,
            'newDifficultyLevel': None
        }

    # 2. CONSECUTIVE WEAK VERDICTS RULE (2 consecutive "incorrect" or "dont_know" on same topic)
    eval_log = session_state.get('evaluationLog', []) if isinstance(session_state, dict) else []
    if len(eval_log) >= 1:
        last_turn_eval = eval_log[-1] if isinstance(eval_log[-1], dict) else {}
        last_verdict = last_turn_eval.get('verdict', '').lower()
        if verdict in ['incorrect', 'dont_know'] and last_verdict in ['incorrect', 'dont_know']:
            lower_diff = 'medium' if current_diff == 'hard' else 'easy'
            return {
                'strategy': 'drop_difficulty_offer_easier_related',
                'topicAdvance': True,
                'newDifficultyLevel': lower_diff
            }

    # 3. STRATEGY TABLE RULES
    if verdict == 'correct' and confidence == 'high':
        if len(concepts_missing) > 0:
            return {
                'strategy': 'probe_missing_nuance',
                'topicAdvance': False,
                'newDifficultyLevel': None
            }
        next_diff = 'hard' if current_diff == 'medium' else None
        return {
            'strategy': 'increase_difficulty_or_new_topic',
            'topicAdvance': current_depth >= 1,
            'newDifficultyLevel': next_diff
        }

    if verdict == 'correct':
        if len(concepts_missing) > 0:
            return {
                'strategy': 'probe_missing_nuance',
                'topicAdvance': False,
                'newDifficultyLevel': None
            }
        return {
            'strategy': 'increase_difficulty_or_new_topic',
            'topicAdvance': current_depth >= 1,
            'newDifficultyLevel': None
        }

    if verdict == 'partially_correct':
        return {
            'strategy': 'affirm_correct_part_and_crossquestion_wrong_part',
            'topicAdvance': False,
            'newDifficultyLevel': None
        }

    if verdict == 'incorrect':
        if current_depth <= 1:
            return {
                'strategy': 'guiding_question_no_reveal',
                'topicAdvance': False,
                'newDifficultyLevel': None
            }
        else:
            return {
                'strategy': 'gentle_correct_then_retest',
                'topicAdvance': False,
                'newDifficultyLevel': None
            }

    if verdict in ['vague', 'off_topic']:
        return {
            'strategy': 'ask_narrower_version',
            'topicAdvance': False,
            'newDifficultyLevel': None
        }

    if verdict == 'dont_know':
        return {
            'strategy': 'simplify_or_hint',
            'topicAdvance': False,
            'newDifficultyLevel': None
        }

    return {
        'strategy': 'affirm_correct_part_and_crossquestion_wrong_part',
        'topicAdvance': False,
        'newDifficultyLevel': None
    }


@app.route('/api/decide-next-step', methods=['POST', 'OPTIONS'])
def decide_next_step():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    evaluator_output = data.get('evaluatorOutput', {})
    session_state = data.get('sessionState', {})
    student_answer = data.get('studentAnswer', '') or data.get('transcript', '')

    decision = evaluate_decision_engine(evaluator_output, session_state, student_answer)
    return jsonify(decision)
@app.route('/api/generate-question', methods=['POST', 'OPTIONS'])
def generate_question():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    session_id = data.get('sessionId', '')
    strategy = data.get('strategy', 'affirm_correct_part_and_crossquestion_wrong_part')
    evaluator_output = data.get('evaluatorOutput', {})
    current_topic_id = data.get('currentTopicId', 'oop-inheritance')
    rubric_override = data.get('rubric', {})
    session_override = data.get('sessionState', {})
    is_opening = data.get('isOpening', False)

    # Resolve Rubric & Topic Name
    if rubric_override and isinstance(rubric_override, dict):
        rubric = rubric_override
    else:
        rubric = RUBRIC_DATABASE.get(current_topic_id, RUBRIC_DATABASE.get('oop-inheritance', {}))

    topic_name = rubric.get('topicName', 'Technical Concept')

    # Resolve Session Context
    company_name = session_override.get('selectedCompany', 'Google') if isinstance(session_override, dict) else 'Google'
    target_field = session_override.get('selectedField', 'Software Development') if isinstance(session_override, dict) else 'Software Development'
    round_type = session_override.get('roundType', 'technical') if isinstance(session_override, dict) else 'technical'
    history_summary = session_override.get('historySummary', '') if isinstance(session_override, dict) else ''
    recent_turns = session_override.get('recentTurns', []) if isinstance(session_override, dict) else []
    
    # Collect all questions asked so far across session
    asked_questions = list(session_override.get('askedQuestions', [])) if isinstance(session_override, dict) else []
    eval_log = session_override.get('evaluationLog', []) if isinstance(session_override, dict) else []
    for entry in eval_log:
        q_text = entry.get('question', '').strip()
        if q_text and q_text not in asked_questions:
            asked_questions.append(q_text)

    recent_formatted = "\n".join([f"{t.get('role', '').capitalize()}: \"{t.get('text', '')}\"" for t in recent_turns[-6:]]) if recent_turns else "None"
    asked_formatted = "\n".join([f"- \"{q}\"" for q in asked_questions[-10:]]) if asked_questions else "None (First Question)"

    concepts_correct = evaluator_output.get('conceptsCorrect', [])
    concepts_wrong = evaluator_output.get('conceptsWrong', [])
    concepts_missing = evaluator_output.get('conceptsMissing', [])
    eval_reason = evaluator_output.get('reason', '')

    # Special opening question generation
    if is_opening:
        sample_q = rubric.get('sampleQuestion', f"Tell me about your experience with {topic_name}.")
        return jsonify({
            "interviewerResponse": f"Hi! Welcome to your {company_name} {round_type.upper()} interview for {target_field}. Let's get started: {sample_q}"
        })

    prompt = f"""You are an experienced, human-like, engaging technical & behavioral interviewer at {company_name} conducting a {round_type.upper()} interview for the {target_field} role.
Your task for this turn is FIXED by the interview decision engine: {strategy}.

EVALUATION SUMMARY OF CANDIDATE'S LAST RESPONSE:
- What the student got right: {", ".join(concepts_correct) if concepts_correct else 'None'}
- What the student got wrong or exhibited misconceptions on: {", ".join(concepts_wrong) if concepts_wrong else 'None'}
- What the student missed: {", ".join(concepts_missing) if concepts_missing else 'None'}
- Evaluator Reason: {eval_reason or 'None'}

ACTIVE TOPIC: {topic_name}
CONVERSATION HISTORY SUMMARY: {history_summary or 'None'}
RECENT TURNS:
{recent_formatted}

PREVIOUSLY ASKED QUESTIONS IN THIS SESSION (DO NOT REPEAT OR RE-ASK ANY OF THESE):
{asked_formatted}

GENERATION INSTRUCTIONS FOR THIS TURN:
Ask ONE natural, conversational turn that:
1. Directly references what the student just said — never ignore their actual response.
2. If strategy is "repeat_question": politely restate or clarify the previous question.
3. If strategy is "simplify_question": ask a simplified, breakdown version of the previous question.
4. If strategy involves not revealing the answer yet (e.g. "guiding_question_no_reveal"): ask a guiding question that lets the candidate self-correct without giving away the answer directly.
5. If strategy is to affirm and cross-question (e.g. "affirm_correct_part_and_crossquestion_wrong_part"): briefly acknowledge what they got right before probing the misconception or missing gap.
6. If strategy is to move to a new topic (e.g. "increase_difficulty_or_new_topic" or "move_to_next_topic"): transition naturally to the new topic ({topic_name}) rather than abruptly.
7. If strategy is "simplify_or_hint": provide a gentle hint or simplify the question to help them get started.
8. Keep it to 1-2 concise, spoken sentences. Speak like a real interviewer, not a quiz reading out loud.
9. CRITICAL ANTI-REPETITION RULE: You MUST NOT ask any question that has already been asked in PREVIOUSLY ASKED QUESTIONS. Explore a completely fresh question or scenario on {topic_name}.

Return ONLY valid raw JSON with NO code blocks:
{{
  "interviewerResponse": "Spoken interviewer response here..."
}}
"""

    gen_resp = None
    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            gen_resp = json.loads(cleaned_text)
        except Exception as e:
            print(f"Gemini API Exception in generate_question: {e}")

    # Helper function to check duplicate against asked questions
    def is_duplicate_text(candidate):
        if not candidate:
            return True
        c_words = set(re.sub(r'[^a-zA-Z0-9\s]', '', candidate.lower()).split())
        c_words = {w for w in c_words if len(w) > 3}
        if not c_words:
            return False
        for prev_q in asked_questions:
            p_words = set(re.sub(r'[^a-zA-Z0-9\s]', '', prev_q.lower()).split())
            p_words = {w for w in p_words if len(w) > 3}
            if not p_words:
                continue
            common = len(c_words.intersection(p_words))
            overlap = common / max(1, min(len(c_words), len(p_words)))
            if overlap >= 0.75:
                return True
        return False

    candidate_text = gen_resp.get('interviewerResponse', '') if isinstance(gen_resp, dict) else ''

    if not candidate_text or is_duplicate_text(candidate_text):
        if strategy == 'repeat_question':
            resp = "Could you please elaborate on your previous answer? I'd love to hear your thoughts again."
        elif strategy == 'simplify_question':
            resp = f"Let's break that down: in plain terms, how would you approach the core concept of {topic_name}?"
        elif strategy == 'guiding_question_no_reveal':
            resp = f"That's an interesting perspective. Think carefully about how {topic_name} behaves in practice—what trade-offs might you encounter?"
        elif strategy in ['increase_difficulty_or_new_topic', 'move_to_next_topic']:
            resp = f"Good discussion on that. Let's move to our next area: {topic_name}. How have you handled this in your projects?"
        elif strategy == 'simplify_or_hint':
            resp = f"No worries at all! Here's a quick thought regarding {topic_name}: think about practical scenarios you've seen. What comes to mind?"
        else:
            resp = f"Good point on the initial concept! Building on that, how would you address {topic_name} in a team setting?"

        gen_resp = {
            "interviewerResponse": resp
        }

    return jsonify(gen_resp)


@app.route('/api/interview-session-turn', methods=['POST', 'OPTIONS'])
def interview_session_turn():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    session = data.get('sessionState', {})
    question = data.get('question', '')
    student_answer = data.get('studentAnswer', '') or data.get('transcript', '')
    rubric = data.get('rubric', {})

    current_topic_id = session.get('currentTopicId', 'oop-inheritance') if isinstance(session, dict) else 'oop-inheritance'

    # Step 1: Evaluator (Prompt 3)
    eval_payload = {
        "sessionId": session.get('sessionId', ''),
        "lastQuestionAsked": question,
        "studentAnswer": student_answer,
        "currentTopicId": current_topic_id,
        "rubric": rubric,
        "sessionState": session
    }
    with app.test_request_context('/api/evaluate-answer', json=eval_payload):
        eval_resp_obj = evaluate_answer()
        evaluator_output = eval_resp_obj.get_json() if hasattr(eval_resp_obj, 'get_json') else {}

    # Step 2: Decision Engine (Prompt 4)
    decision_output = evaluate_decision_engine(evaluator_output, session, student_answer)

    # Step 3: Question Generator (Prompt 5)
    gen_payload = {
        "sessionId": session.get('sessionId', ''),
        "strategy": decision_output.get('strategy'),
        "evaluatorOutput": evaluator_output,
        "currentTopicId": current_topic_id,
        "rubric": rubric,
        "sessionState": session
    }
    with app.test_request_context('/api/generate-question', json=gen_payload):
        gen_resp_obj = generate_question()
        generator_output = gen_resp_obj.get_json() if hasattr(gen_resp_obj, 'get_json') else {}

    interviewer_text = generator_output.get('interviewerResponse', 'Thank you. Let us continue.')

    return jsonify({
        "evaluatorOutput": evaluator_output,
        "decisionOutput": decision_output,
        "interviewerResponse": interviewer_text,
        "nextQuestion": interviewer_text,
        "questionText": interviewer_text
    })




JUDGE0_LANGUAGE_IDS = {
    'javascript': 63,
    'js': 63,
    'python': 71,
    'py': 71,
    'cpp': 54,
    'c++': 54,
    'java': 62,
    'sql': 82
}

def wrap_cpp_code_driver(source_code, stdin=""):
    code = source_code.strip()
    if 'int main' in code:
        if '#include' in code:
            return code
        return f"#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <sstream>\nusing namespace std;\n\n{code}"

    driver_body = ""

    if 'reverseString' in code:
        driver_body = """
    vector<char> s;
    for (size_t i = 0; i < inputRaw.size(); ++i) {
        if ((inputRaw[i] == '"' || inputRaw[i] == 39) && i + 1 < inputRaw.size()) {
            s.push_back(inputRaw[i+1]); i += 2;
        }
    }
    reverseString(s);
    printResult(s);
"""
    elif 'findMax' in code:
        driver_body = """
    vector<int> nums;
    string temp = inputRaw;
    for (char& c : temp) if (!isdigit(c) && c != '-' && c != '+') c = ' ';
    stringstream ss(temp); int v; while(ss >> v) nums.push_back(v);
    if (!nums.empty()) printResult(findMax(nums));
"""
    elif 'isPalindrome' in code:
        driver_body = """
    string s = inputRaw;
    if (s.find("s = ") != string::npos) s = s.substr(s.find("s = ") + 4);
    if (!s.empty() && (s.front() == '"' || s.front() == 39)) s = s.substr(1);
    if (!s.empty() && (s.back() == '"' || s.back() == 39)) s.pop_back();
    printResult(isPalindrome(s));
"""
    elif 'twoSum' in code:
        driver_body = """
    vector<int> nums; int target = 0;
    if (inputRaw.find("target") != string::npos) {
        string nPart = inputRaw.substr(0, inputRaw.find("target"));
        string tPart = inputRaw.substr(inputRaw.find("target"));
        for (char& c : nPart) if (!isdigit(c) && c != '-' && c != '+') c = ' ';
        stringstream ss1(nPart); int v; while(ss1 >> v) nums.push_back(v);
        for (char& c : tPart) if (!isdigit(c) && c != '-' && c != '+') c = ' ';
        stringstream ss2(tPart); ss2 >> target;
    } else {
        for (char& c : inputRaw) if (!isdigit(c) && c != '-' && c != '+') c = ' ';
        stringstream ss(inputRaw); int v; while(ss >> v) nums.push_back(v);
        if (!nums.empty()) { target = nums.back(); nums.pop_back(); }
    }
    printResult(twoSum(nums, target));
"""
    else:
        driver_body = """
    vector<int> nums; string temp = inputRaw;
    for (char& c : temp) if (!isdigit(c) && c != '-' && c != '+') c = ' ';
    stringstream ss(temp); int v; while(ss >> v) nums.push_back(v);
    if (!nums.empty()) printResult(nums[0]);
"""

    return f"""#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <sstream>
using namespace std;

template <typename T> void printResult(const T& val) {{ cout << val; }}
void printResult(bool val) {{ cout << (val ? "true" : "false"); }}

template <typename T> void printResult(const vector<T>& vec) {{
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {{
        if (i > 0) cout << ",";
        printResult(vec[i]);
    }}
    cout << "]";
}}

void printResult(const vector<char>& vec) {{
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {{
        if (i > 0) cout << ",";
        cout << "\\"" << vec[i] << "\\"";
    }}
    cout << "]";
}}

{code}

int main() {{
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string inputRaw = {json.dumps(stdin or "")};
{driver_body}
    return 0;
}}
"""

def wrap_java_code_driver(source_code, stdin=""):
    code = source_code.strip()
    if 'class Main' in code or 'public static void main' in code:
        if 'import java.util' in code:
            return code
        return f"import java.util.*;\nimport java.io.*;\nimport java.util.regex.*;\n\n{code}"

    # Detect class name if any (excluding Main)
    class_match = re.search(r'\bclass\s+([A-Za-z_]\w*)', code)
    class_name = None
    if class_match and class_match.group(1) != "Main":
        class_name = class_match.group(1)

    # Detect candidate method signature
    method_pattern = r'(?:public|protected|private|static|\s)*([\w\[\]<>]+)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)'
    matches = re.findall(method_pattern, code)

    target_method = None
    target_return = None
    target_params = []

    for ret_type, name, params_str in matches:
        if name in ("main", "printResult", "if", "while", "for", "switch", "catch") or (class_name and name == class_name) or name == "Main":
            continue
        target_method = name
        target_return = ret_type
        raw_params = [p.strip() for p in params_str.split(",") if p.strip()]
        param_types = []
        for p in raw_params:
            parts = p.split()
            if len(parts) >= 1:
                param_types.append(parts[0])
        target_params = param_types
        break

    if class_name:
        instantiation = f"Main _mainObj = new Main();\n            {class_name} instance = _mainObj.new {class_name}();"
    else:
        instantiation = "Main instance = new Main();"

    driver_body = ""
    if target_method:
        if len(target_params) == 1:
            p_type = target_params[0]
            if p_type in ("int", "long", "Integer"):
                driver_body = """
            List<Integer> ints = new ArrayList<>();
            Matcher m = Pattern.compile("-?\\\\d+").matcher(inputRaw);
            while (m.find()) ints.add(Integer.parseInt(m.group()));
            int arg0 = ints.isEmpty() ? 0 : ints.get(0);
""" + (f"            instance.{target_method}(arg0);\n            printResult(arg0);\n" if target_return == "void" else f"            printResult(instance.{target_method}(arg0));\n")

            elif p_type in ("int[]", "Integer[]"):
                driver_body = """
            List<Integer> ints = new ArrayList<>();
            Matcher m = Pattern.compile("-?\\\\d+").matcher(inputRaw);
            while (m.find()) ints.add(Integer.parseInt(m.group()));
            int[] arg0 = ints.stream().mapToInt(i -> i).toArray();
""" + (f"            instance.{target_method}(arg0);\n            printResult(arg0);\n" if target_return == "void" else f"            printResult(instance.{target_method}(arg0));\n")

            elif p_type in ("char[]", "Character[]"):
                driver_body = """
            List<Character> chars = new ArrayList<>();
            String cleanInput = inputRaw;
            if (cleanInput.contains(" = ")) cleanInput = cleanInput.substring(cleanInput.indexOf(" = ") + 3);
            Matcher m = Pattern.compile("'([^']*)'|\\"([^\\"]*)\\"|([a-zA-Z0-9])").matcher(cleanInput);
            while (m.find()) {
                String tok = m.group(1) != null ? m.group(1) : (m.group(2) != null ? m.group(2) : m.group(3));
                if (tok != null && !tok.isEmpty()) {
                    for (char c : tok.toCharArray()) chars.add(c);
                }
            }
            char[] arg0 = new char[chars.size()];
            for (int i = 0; i < chars.size(); i++) arg0[i] = chars.get(i);
""" + (f"            instance.{target_method}(arg0);\n            printResult(arg0);\n" if target_return == "void" else f"            printResult(instance.{target_method}(arg0));\n")

            elif p_type == "String":
                driver_body = """
            String str = inputRaw;
            if (str.contains(" = ")) str = str.substring(str.indexOf(" = ") + 3);
            if (str.length() > 0 && (str.charAt(0) == '"' || str.charAt(0) == '\\\'')) str = str.substring(1);
            if (str.length() > 0 && (str.charAt(str.length() - 1) == '"' || str.charAt(str.length() - 1) == '\\\'')) str = str.substring(0, str.length() - 1);
""" + (f"            instance.{target_method}(str);\n            printResult(str);\n" if target_return == "void" else f"            printResult(instance.{target_method}(str));\n")

        elif len(target_params) == 2 and target_params[0] in ("int[]", "Integer[]") and target_params[1] in ("int", "long", "Integer"):
            driver_body = """
            List<Integer> ints = new ArrayList<>();
            Matcher m = Pattern.compile("-?\\\\d+").matcher(inputRaw);
            while (m.find()) ints.add(Integer.parseInt(m.group()));
            int target = ints.isEmpty() ? 0 : ints.get(ints.size() - 1);
            int[] nums = ints.size() > 1 ? ints.subList(0, ints.size() - 1).stream().mapToInt(i -> i).toArray() : new int[0];
""" + (f"            instance.{target_method}(nums, target);\n            printResult(nums);\n" if target_return == "void" else f"            printResult(instance.{target_method}(nums, target));\n")

    if not driver_body:
        driver_body = """
            List<Integer> ints = new ArrayList<>();
            Matcher m = Pattern.compile("-?\\\\d+").matcher(inputRaw);
            while (m.find()) ints.add(Integer.parseInt(m.group()));
            if (!ints.isEmpty()) printResult(ints.get(0));
"""

    return f"""import java.util.*;
import java.io.*;
import java.util.regex.*;

public class Main {{

    {code}

    public static void printResult(Object obj) {{
        if (obj == null) {{
            System.out.print("null");
        }} else if (obj instanceof boolean[]) {{
            System.out.print(Arrays.toString((boolean[]) obj).replaceAll("\\\\s+", ""));
        }} else if (obj instanceof char[]) {{
            char[] arr = (char[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {{
                if (i > 0) sb.append(",");
                sb.append("\\"").append(arr[i]).append("\\"");
            }}
            sb.append("]");
            System.out.print(sb.toString());
        }} else if (obj instanceof String[]) {{
            String[] arr = (String[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {{
                if (i > 0) sb.append(",");
                sb.append("\\"").append(arr[i]).append("\\"");
            }}
            sb.append("]");
            System.out.print(sb.toString());
        }} else if (obj instanceof int[]) {{
            System.out.print(Arrays.toString((int[]) obj).replaceAll("\\\\s+", ""));
        }} else if (obj instanceof Object[]) {{
            System.out.print(Arrays.deepToString((Object[]) obj).replaceAll("\\\\s+", ""));
        }} else {{
            System.out.print(String.valueOf(obj));
        }}
    }}

    public static void main(String[] args) {{
        try {{
            {instantiation}
            String inputRaw = {json.dumps(stdin or "")};
{driver_body}
        }} catch (Exception e) {{
            e.printStackTrace();
        }}
    }}
}}
"""

def run_code_judge0(language_id, source_code, stdin="", expected_output=""):
    """
    Executes source code against public Judge0 CE API using base64 encoding
    to prevent g++ backtick/UTF-8 decoding HTTP 400 errors.
    Endpoint: POST https://ce.judge0.com/submissions?base64_encoded=true&wait=true
    """
    url = "https://ce.judge0.com/submissions?base64_encoded=true&wait=true"
    headers = {"Content-Type": "application/json"}

    # Resolve language string to numeric ID if required
    if isinstance(language_id, str):
        if language_id.isdigit():
            language_id = int(language_id)
        else:
            language_id = JUDGE0_LANGUAGE_IDS.get(language_id.lower(), 63)

    if int(language_id or 63) == 54:
        source_code = wrap_cpp_code_driver(source_code, stdin)
    elif int(language_id or 63) == 62:
        source_code = wrap_java_code_driver(source_code, stdin)

    payload = {
        "language_id": int(language_id or 63),
        "source_code": base64.b64encode(source_code.encode('utf-8')).decode('utf-8')
    }

    if stdin and str(stdin).strip():
        payload["stdin"] = base64.b64encode(str(stdin).encode('utf-8')).decode('utf-8')

    if expected_output and str(expected_output).strip():
        payload["expected_output"] = base64.b64encode(str(expected_output).encode('utf-8')).decode('utf-8')

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code in (200, 201):
            data = response.json()

            def safe_b64decode(val):
                if not val:
                    return ""
                try:
                    return base64.b64decode(val).decode('utf-8', errors='ignore').strip()
                except Exception:
                    return str(val).strip()

            stdout = safe_b64decode(data.get("stdout"))
            stderr = safe_b64decode(data.get("stderr"))
            compile_output = safe_b64decode(data.get("compile_output"))

            combined_err = (stderr + "\n" + compile_output).strip() if (stderr and compile_output) else (stderr or compile_output)

            status_obj = data.get("status") or {}
            status_desc = status_obj.get("description") or "Executed"
            exec_time = data.get("time")
            execution_time = str(exec_time) if exec_time is not None else "0.00"

            return {
                "success": True,
                "stdout": stdout,
                "stderr": combined_err,
                "status": status_desc,
                "execution_time": execution_time,
                "memory": data.get("memory"),
                "raw": data
            }
        else:
            return {
                "success": False,
                "error": f"Judge0 API status HTTP {response.status_code}",
                "stdout": "",
                "stderr": response.text or "Judge0 execution error",
                "status": f"HTTP {response.status_code}",
                "execution_time": "0.00"
            }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Judge0 API request timed out",
            "stdout": "",
            "stderr": "Execution request to Judge0 timed out.",
            "status": "Timeout Error",
            "execution_time": "0.00"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Judge0 connection error: {str(e)}",
            "stdout": "",
            "stderr": str(e),
            "status": "Error",
            "execution_time": "0.00"
        }


@app.route('/api/run-code', methods=['POST'])
@app.route('/api/execute-code', methods=['POST'])
def execute_code_endpoint():
    data = request.get_json() or {}
    source_code = data.get('source_code') or data.get('code') or ''
    language = data.get('language') or 'javascript'
    language_id = data.get('language_id')

    if not language_id:
        if isinstance(language, int) or (isinstance(language, str) and language.isdigit()):
            language_id = int(language)
        else:
            language_id = JUDGE0_LANGUAGE_IDS.get(str(language).lower(), 63)

    stdin = data.get('stdin') or data.get('input') or ''
    expected_output = data.get('expected_output') or data.get('expectedOutput') or ''

    if not source_code.strip():
        return jsonify({
            "success": False,
            "error": "No source code provided for execution.",
            "stdout": "",
            "stderr": "Empty source code",
            "status": "Error",
            "execution_time": "0.00"
        }), 400

    result = run_code_judge0(language_id, source_code, stdin, expected_output)

    # Return HTTP 200 with structured execution results
    return jsonify(result), 200


@app.route('/api/evaluate-code', methods=['POST'])
def evaluate_code():
    data = request.get_json() or {}
    code = data.get('code', '')
    language = data.get('language', 'javascript')
    problem_title = data.get('problemTitle', 'Coding Challenge')
    problem_description = data.get('problemDescription', '')
    test_results = data.get('testResults', {})
    run_judge0 = data.get('runJudge0', False) or data.get('run_judge0', False)

    judge0_res = None
    if run_judge0 or data.get('stdin') or data.get('expected_output') or data.get('expectedOutput'):
        lang_id = data.get('language_id') or JUDGE0_LANGUAGE_IDS.get(str(language).lower(), 63)
        judge0_res = run_code_judge0(lang_id, code, data.get('stdin', ''), data.get('expected_output') or data.get('expectedOutput') or '')

    prompt = f"""You are a principal software engineer and coding interviewer evaluating a candidate's code submission for: "{problem_title}".

PROBLEM DESCRIPTION:
{problem_description}

CANDIDATE SOLUTION CODE ({language.upper()}):
```
{code}
```

TEST CASE EXECUTION SUMMARY:
Passed {test_results.get('passedCount', 0)} of {test_results.get('total', 0)} test cases.

CRITICAL INSTRUCTIONS:
1. Verify code correctness against the problem statement and edge case handling.
2. Estimate the worst-case Time Complexity in Big-O notation (e.g. O(N), O(N log N), O(N^2)).
3. Estimate the worst-case Auxiliary Space Complexity in Big-O notation (e.g. O(1), O(N)).
4. Flag specific missed or potential edge cases (e.g. empty input [], single element, duplicate values, negative numbers, integer overflow).
5. Rate overall Code Quality & Readability on a scale from 1 to 10 with a concise 1-2 sentence reasoning.
6. You MUST return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.

Return this exact JSON structure:
{{
  "correctness": true,
  "correctnessReasoning": "1-2 sentence concise explanation of whether code satisfies problem logic and constraints.",
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "missedEdgeCases": [
    "Short description of edge case 1",
    "Short description of edge case 2"
  ],
  "codeQualityScore": 9,
  "codeQualityReasoning": "1-2 sentence assessment of variable naming, modularity, and clean code principles."
}}
"""

    raw_text = call_gemini(prompt)
    parsed_json = None
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
        except Exception as e:
            print(f"Gemini API Exception in evaluate_code: {e}")

    if not parsed_json:
        # Fallback response if Gemini is unavailable
        all_passed = test_results.get('allPassed', True)
        parsed_json = {
            "correctness": all_passed,
            "correctnessReasoning": "Solution passed automated test cases and satisfied core problem requirements." if all_passed else "Solution failed one or more edge cases.",
            "timeComplexity": "O(N)",
            "spaceComplexity": "O(1)",
            "missedEdgeCases": [
              "Empty input arrays or null pointers should be explicitly checked.",
              "Single-element inputs and duplicate values."
            ],
            "codeQualityScore": 8 if all_passed else 6,
            "codeQualityReasoning": "Code is structured cleanly with good variable naming and readable logic."
        }

    if judge0_res:
        parsed_json["judge0Execution"] = judge0_res

    return jsonify(parsed_json)


@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    data = request.get_json() or {}
    field_id = data.get('fieldId', 'sde')
    target_field = data.get('targetField', 'Software Development')
    company_name = data.get('companyName', 'Google')
    weak_areas = data.get('weakAreas', ['Algorithms', 'Logical Reasoning', 'Filler Words'])
    missing_keywords = data.get('missingKeywords', ['Docker', 'CI/CD'])
    catalog_subset = data.get('catalogSubset', [])

    # If no catalog subset passed from frontend, use fallback list
    if not catalog_subset:
        catalog_subset = [
            {
                "catalogId": "cat-sde-1",
                "title": "freeCodeCamp Data Structures & Algorithms",
                "provider": "freeCodeCamp",
                "type": "free_resource",
                "fieldIds": ["sde", "ml-ai"],
                "skillTags": ["DSA", "Arrays", "Algorithms"],
                "level": "Beginner",
                "cost": "Free",
                "estimatedDuration": "300 hours",
                "link": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
                "whyItHelps": "Master foundational data structures and algorithm problem-solving."
            },
            {
                "catalogId": "cat-sde-2",
                "title": "Google Tech Dev Guide: Foundational Programming",
                "provider": "Google",
                "type": "free_resource",
                "fieldIds": ["sde"],
                "skillTags": ["DSA", "Trees", "Graphs", "System Design"],
                "level": "Intermediate",
                "cost": "Free",
                "estimatedDuration": "40 hours",
                "link": "https://techdevguide.withgoogle.com/",
                "whyItHelps": "Curated by Google engineers to build algorithmic efficiency."
            },
            {
                "catalogId": "cat-sde-3",
                "title": "AWS Certified Developer – Associate",
                "provider": "Amazon Web Services",
                "type": "certification",
                "fieldIds": ["sde", "devops-cloud"],
                "skillTags": ["AWS", "Cloud", "Microservices", "CI/CD"],
                "level": "Intermediate",
                "cost": "Paid",
                "estimatedDuration": "6 weeks",
                "link": "https://aws.amazon.com/certification/certified-developer-associate/",
                "whyItHelps": "Validates production cloud architecture and AWS SDK deployment skills."
            },
            {
                "catalogId": "cat-sde-4",
                "title": "System Design Primer (GitHub Repository)",
                "provider": "GitHub / Donne Martin",
                "type": "free_resource",
                "fieldIds": ["sde", "devops-cloud"],
                "skillTags": ["System Design", "Scalability", "Caching", "Load Balancing"],
                "level": "Advanced",
                "cost": "Free",
                "estimatedDuration": "50 hours",
                "link": "https://github.com/donnemartin/system-design-primer",
                "whyItHelps": "Gold-standard reference for designing large-scale distributed systems."
            }
        ]

    # Heuristic scoring & ranking of catalog items
    all_gaps = [g.lower() for g in (weak_areas + missing_keywords)]
    
    scored_items = []
    for item in catalog_subset:
        skill_tags = [t.lower() for t in item.get('skillTags', [])]
        match_count = sum(1 for tag in skill_tags if any(gap in tag or tag in gap for gap in all_gaps))
        score = match_count * 10
        if field_id in item.get('fieldIds', []):
            score += 5
        scored_items.append((score, item))

    scored_items.sort(key=lambda x: x[0], reverse=True)
    top_candidates = [item for _, item in scored_items[:8]]

    candidates_json = json.dumps(top_candidates, indent=2)
    weakness_str = ", ".join(weak_areas) if weak_areas else "General technical speed"
    keywords_str = ", ".join(missing_keywords) if missing_keywords else "Cloud & DevOps keywords"

    prompt = f"""You are an executive career advisor evaluating learning resources for a candidate targeting {target_field} roles at {company_name}.
Candidate Field: {field_id}
Performance Weak Areas: {weakness_str}
Resume Missing Keywords: {keywords_str}

VERIFIED COURSE CATALOG CANDIDATES:
{candidates_json}

CRITICAL INSTRUCTIONS:
1. Select and rank the best 5-6 resources from the provided catalog candidates above.
2. DO NOT fabricate new course titles, providers, or URLs — keep the exact title, provider, type, level, cost, estimatedDuration, and link from the candidate object.
3. Write a personalized, highly specific 'whyItHelps' string for each selected item, explaining EXACTLY how it addresses the candidate's specific weak areas ({weakness_str}) or missing keywords ({keywords_str}) for {company_name}.
4. Provide a 'learningPath' array outlining a 1-to-4 numbered sequence of steps based on gap severity.
5. You MUST return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.

Return this exact JSON structure:
{{
  "recommendations": [
    {{
      "catalogId": "exact catalogId from input",
      "title": "exact title from input",
      "provider": "exact provider from input",
      "type": "exact type from input",
      "level": "exact level from input",
      "cost": "exact cost from input",
      "estimatedDuration": "exact estimatedDuration from input",
      "link": "exact link from input",
      "whyItHelps": "Personalized reason referencing their actual weak areas or missing keywords",
      "priorityRank": 1
    }}
  ],
  "learningPath": [
    {{
      "step": 1,
      "catalogId": "exact catalogId",
      "focus": "Brief focus statement (e.g. Address primary weakness in Logical Reasoning)"
    }}
  ]
}}
"""

    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in recommendations: {e}")

    # Fallback response using top_candidates directly
    fallback_recs = []
    learning_path = []
    for idx, item in enumerate(top_candidates[:6]):
        fallback_recs.append({
            "catalogId": item.get('catalogId', f"cat-{idx}"),
            "title": item.get('title'),
            "provider": item.get('provider'),
            "type": item.get('type', 'course'),
            "level": item.get('level', 'Intermediate'),
            "cost": item.get('cost', 'Free'),
            "estimatedDuration": item.get('estimatedDuration', '4 weeks'),
            "link": item.get('link'),
            "whyItHelps": f"Specifically recommended for {target_field} candidates at {company_name} to strengthen {weakness_str}.",
            "priorityRank": idx + 1
        })
        if idx < 4:
            learning_path.append({
                "step": idx + 1,
                "catalogId": item.get('catalogId', f"cat-{idx}"),
                "focus": f"Step {idx+1}: Build core competency in {item.get('title')}"
            })

    return jsonify({
        "recommendations": fallback_recs,
        "learningPath": learning_path
    })


@app.route('/api/interview-followup', methods=['POST'])
def interview_followup():
    data = request.get_json() or {}
    company_name = data.get('selectedCompany', 'Google')
    target_field = data.get('targetField', 'Software Development')

    interview_type = data.get('interviewType', 'technical')  # 'technical' | 'hr'
    experience_level = data.get('experienceLevel', 'Fresher')
    experience_years = data.get('experienceYears', '0-2')
    difficulty_level = data.get('difficultyLevel', 'Medium')
    selected_language = data.get('selectedLanguage', 'English')
    conversation_history = data.get('conversationHistory', [])
    is_opening = data.get('isOpening', False) or len(conversation_history) == 0

    lang_instruction = (
        f"Generate interviewerResponse in {selected_language}. IMPORTANT CODE-SWITCHING RULE: Keep all technical terms (e.g. 'Binary Search', 'Time Complexity', 'Database Indexing', 'STAR method') in English even when speaking in Hindi or Marathi, matching natural Indian technical conversations."
        if selected_language in ['Hindi', 'Marathi']
        else "Generate interviewerResponse in English."
    )

    # Opening Question Turn Generation
    if is_opening:
        opening_prompt = f"""You are an experienced human interviewer conducting a live {interview_type.upper()} interview for {company_name} for the role of {target_field} ({experience_level} level, {difficulty_level} difficulty).

Generate a warm, natural, spoken opening turn to launch this live interview.
Include a brief welcoming sentence introducing yourself and the round, followed immediately by your very first question tailored specifically to a candidate applying for {target_field} at {company_name}.

Return ONLY valid raw JSON:
{{
  "interviewerResponse": "Natural spoken opening greeting + first question",
  "moveToNewTopic": true
}}
"""
        print("\n=================== [BACKEND DEBUG: OPENING TURN GENERATION] ===================")
        raw_opening = call_gemini(opening_prompt)
        if raw_opening:
            try:
                parsed = json.loads(clean_json_response(raw_opening))
                text = parsed.get('interviewerResponse') or parsed.get('questionText') or ''
                return jsonify({
                    "interviewerResponse": text,
                    "questionText": text,
                    "moveToNewTopic": True,
                    "action": "next_question"
                })
            except Exception as e:
                print(f"[Backend Debug] Error parsing opening response: {e}")

        default_q = "Tell me about yourself and a technical project you are proud of." if interview_type == 'technical' else "Tell me about yourself and why you're interested in joining our team."
        fallback_open = f"Hi! Welcome to your {company_name} mock interview for the {target_field} track. Let me get us started: {default_q}"
        return jsonify({
            "interviewerResponse": fallback_open,
            "questionText": fallback_open,
            "moveToNewTopic": True,
            "action": "next_question"
        })

    # Extract latest candidate answer & calculate remaining exchanges
    latest_candidate_answer = "No candidate response recorded yet."
    candidate_turns = [turn for turn in conversation_history if turn.get('role') in ['candidate', 'user']]
    if candidate_turns:
        latest_candidate_answer = candidate_turns[-1].get('text', '').strip()

    total_turns_used = len(candidate_turns)
    max_exchanges = 10
    remaining_exchanges = max(1, max_exchanges - total_turns_used)

    # Extract all interviewer questions asked so far to enforce strict deduplication
    asked_questions = [
        turn.get('text', '').strip()
        for turn in conversation_history
        if turn.get('role') in ['interviewer', 'assistant'] and turn.get('text')
    ]
    asked_questions_block = "\n".join([f"- \"{q}\"" for q in asked_questions]) if asked_questions else "None yet (this is the opening exchange)."

    print("\n=================== [BACKEND DEBUG: /api/interview-followup] ===================")
    print(f"[Backend Debug] Company: {company_name} | Field: {target_field} | Type: {interview_type} | Turns Used: {total_turns_used}/{max_exchanges}")
    print(f"[Backend Debug] ASKED QUESTIONS ({len(asked_questions)}): {asked_questions}")
    print(f"[Backend Debug] LATEST CANDIDATE ANSWER: \"{latest_candidate_answer}\"")
    print("================================================================================\n")

    history_formatted = []
    for idx, turn in enumerate(conversation_history):
        role_label = f"Interviewer ({company_name})" if turn.get('role') in ['interviewer', 'assistant'] else "Candidate"
        history_formatted.append(f"Turn {idx+1} ({role_label}): {turn.get('text', '')}")

    history_block = "\n".join(history_formatted) if history_formatted else "Interview session opening."

    # Check for uncertainty / 'I don't know' expressions
    last_ans_lower = latest_candidate_answer.lower()
    is_idk_answer = any(phrase in last_ans_lower for phrase in ["don't know", "dont know", "not sure", "no idea", "idk", "haven't used", "unfamiliar", "no experience", "can't recall", "cant recall"])

    idk_directive = ""
    if is_idk_answer:
        idk_directive = """
CRITICAL RULE (CANDIDATE STATED THEY DON'T KNOW):
The candidate just expressed that they don't know or are unsure about the question/topic.
1. You MUST set "moveToNewTopic": false. DO NOT move to a new question or topic.
2. You MUST cross-question or simplify: ask them why they don't know, what related concepts they ARE familiar with, or break the question down into a simpler foundational concept to test their reasoning process.
3. Do NOT praise them for saying they don't know, but maintain a natural, supportive, inquiring interviewer tone.
"""

    # Round-specific instructions for Technical vs HR interview flows
    if interview_type == 'technical':
        round_specific_instructions = f"""
TECHNICAL INTERVIEW EVALUATION & QUESTION GENERATION GUIDELINES:
1. READ AND COMPREHEND THE FULL ANSWER HOLISTICALLY:
   - Carefully read the candidate's ENTIRE response — analyze their technical reasoning, architectural choices, data structure selections, trade-off awareness, and depth of explanation.
   - DO NOT extract a single technology keyword or noun (e.g., "React", "Python", "MongoDB", "microservices") and repeatedly drill into just that keyword.

2. INTELLIGENTLY CHOOSE ONE OF THREE ACTIONS:
   a) ASK A GENUINE FOLLOW-UP ("moveToNewTopic": false): Ask a follow-up ONLY if their answer was vague, incomplete, missed critical system constraints/edge cases, or left key technical trade-offs unexplained.
   b) MOVE TO A NEW TOPIC ("moveToNewTopic": true): If their answer was clear, sound, and complete, MOVE IMMEDIATELY to a new technical domain (e.g., from Algorithms/Data Structures to Database Indexing, System Architecture, API Security, Concurrency, Error Handling, or Automated Testing).
   c) PROBE A DIFFERENT TECHNICAL ASPECT ("moveToNewTopic": false): If exploring the same project/topic further, shift to a DIFFERENT technical dimension (e.g., from time complexity to edge cases, memory optimization, failure recovery, or test coverage) — NEVER re-interrogate the same keyword.

3. STRICT NEGATIVE INSTRUCTION (NO KEYWORD FIXATION):
   - Do NOT fixate on a single word or phrase from the candidate's answer.
   - Do NOT ask "You mentioned X, tell me more about X" repeatedly. Evaluate their answer holistically to decide what adds the most value to assessing their technical competency.

4. TECHNICAL DEPTH FOCUS:
   - Focus follow-ups on problem-solving methodology, system trade-offs, edge case handling, and fundamental CS principles — evaluating true engineering depth rather than keyword definitions.
"""
    else:
        round_specific_instructions = f"""
HR & BEHAVIORAL INTERVIEW EVALUATION & QUESTION GENERATION GUIDELINES:
1. READ AND COMPREHEND THE FULL ANSWER HOLISTICALLY:
   - Carefully read the candidate's ENTIRE response — evaluate their interpersonal dynamics, leadership mindset, conflict resolution style, and personal accountability.
   - DO NOT extract a single company, team, or project keyword (e.g., "my manager", "internship", "college project") and repeatedly drill into just that keyword.

2. INTELLIGENTLY CHOOSE ONE OF THREE ACTIONS:
   a) ASK A GENUINE FOLLOW-UP ("moveToNewTopic": false): Ask a follow-up ONLY if their answer was vague, lacked key STAR components (Situation, Task, Action, Result), or omitted their specific personal contribution vs. the team's role.
   b) MOVE TO A NEW TOPIC ("moveToNewTopic": true): If their answer was structured, clear, and complete, MOVE IMMEDIATELY to a new HR competency (e.g., from Workplace Conflict to Handling Feedback, Ownership Under Pressure, Ethical Dilemmas, Career Alignment, or Team Collaboration).
   c) PROBE A DIFFERENT BEHAVIORAL ASPECT ("moveToNewTopic": false): If exploring the same scenario further, shift to a DIFFERENT behavioral dimension (e.g., from team communication to personal lessons learned or long-term behavioral changes) — NEVER re-interrogate the same keyword.

3. STRICT NEGATIVE INSTRUCTION (NO KEYWORD FIXATION):
   - Do NOT fixate on a single word, team member, or project name from the candidate's answer.
   - Do NOT ask "You mentioned X, tell me more about X" repeatedly. Evaluate their answer holistically to decide what adds the most value to assessing their culture fit and behavioral maturity.

4. BEHAVIORAL STAR FOCUS:
   - Focus follow-ups on personal ownership, conflict resolution tactics, resilience under stress, growth mindset, and tangible results — evaluating how they behave in professional work environments.
"""

    prompt = f"""You are an experienced human interviewer conducting a live {interview_type.upper()} interview for {company_name} for the role of {target_field} ({experience_level} level, {difficulty_level} difficulty). You are not a quiz bot reading questions off a list — you are a real person having a conversation, genuinely listening to what the candidate says, and reacting the way a sharp, experienced interviewer actually would.

{round_specific_instructions}

STRICT QUESTION DEDUPLICATION & NO-REPEAT RULE:
- Do NOT repeat, rephrase, or ask any question or topic that has ALREADY been asked in this session.
- QUESTIONS ALREADY ASKED IN THIS SESSION:
{asked_questions_block}

- If "moveToNewTopic" is TRUE, you MUST select a COMPLETELY NEW, UNTOUCHED topic or skill area suitable for a {interview_type.upper()} interview for {target_field} at {company_name}.
  - For TECHNICAL: switch to a distinct technical area (e.g. data structures, algorithms, system design, database indexing, API security/auth, concurrency, error handling, performance profiling, testing & CI/CD) that has NOT been asked above.
  - For HR: switch to a distinct behavioral competency (e.g. conflict resolution, handling feedback, leadership/ownership, prioritizing under pressure, career motivation, ethical dilemmas, teamwork) that has NOT been asked above.
- Make sure your next question is distinctly different from every question listed in QUESTIONS ALREADY ASKED IN THIS SESSION.

Your core instinct in every exchange: never just accept an answer at face value and move on. A real interviewer's brain is always asking 'do they actually understand this, or are they just saying words?' — so before deciding what to say next, actually think about what the candidate said as a whole and let that genuinely shape your response.

{idk_directive}
LANGUAGE & CODE-SWITCHING RULE: {lang_instruction}

You have {remaining_exchanges} remaining exchanges available in this interview before it needs to wrap up — pace yourself accordingly, but never sacrifice a genuine follow-up just because you're mid-list. Use your judgment like a real interviewer would.

FULL CONVERSATION HISTORY SO FAR:
{history_block}

Return ONLY valid raw JSON with NO markdown code blocks, NO ```json preamble.

JSON Output Required:
{{
  "interviewerResponse": "Full natural spoken turn — reaction + next question/follow-up/clarification/simplification, combined naturally as one thing a real interviewer would say.",
  "moveToNewTopic": true or false
}}
"""

    print(f"[Backend Debug] Sending human interviewer persona prompt to Gemini...")
    raw_text = call_gemini(prompt)
    print(f"[Backend Debug] Gemini Raw Response Output:\n{raw_text}\n")

    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            resp_text = parsed_json.get('interviewerResponse') or parsed_json.get('questionText') or ''
            move_new = bool(parsed_json.get('moveToNewTopic', False))

            if is_idk_answer:
                print("[Backend Debug] Candidate expressed 'I don't know' — forcing moveToNewTopic to False for cross-examination")
                move_new = False

            print(f"[Backend Debug] Parsed Response -> MoveToNewTopic: {move_new}, Response: '{resp_text}'")
            return jsonify({
                "interviewerResponse": resp_text,
                "questionText": resp_text,
                "moveToNewTopic": move_new,
                "action": "next_question" if move_new else "followup"
            })
        except Exception as e:
            print(f"[Backend Debug] Exception parsing Gemini JSON: {e}")

    # Dynamic emergency fallback logic with deduplication tracking ONLY if all Gemini API models fail
    last_ans = latest_candidate_answer.strip()

    print(f"[Backend Debug] Gemini generation unavailable. Engaging deduplicated keyword fallback for '{interview_type}' round...")

    if not last_ans or last_ans == "No candidate response recorded yet.":
        fallback_text = "I didn't catch your response there — could you check your microphone and give that question a try?"
        return jsonify({
            "interviewerResponse": fallback_text,
            "questionText": fallback_text,
            "moveToNewTopic": False,
            "action": "clarify"
        })

    if any(phrase in last_ans_lower for phrase in ["don't know", "dont know", "not sure", "no idea", "idk"]):
        fallback_text = "No worries — in simpler terms, do you know the core concept behind how this works, or how you might approach it generally?"
        return jsonify({
            "interviewerResponse": fallback_text,
            "questionText": fallback_text,
            "moveToNewTopic": False,
            "action": "simplifyAndRetry"
        })

    # Diverse fallback question pools per interview type
    tech_fallback_pool = [
        "Could you walk me through how you approach writing automated tests and ensuring code quality for critical components?",
        "How do you approach database indexing and query optimization when dealing with large datasets?",
        "Can you explain your strategy for designing secure REST APIs with authentication and rate limiting?",
        "How do you debug performance bottlenecks or memory leaks in an active web application?",
        "What automated testing frameworks or strategies do you use to verify code reliability?",
        "Tell me about a technical tradeoff or architecture decision you had to make in a recent project."
    ]

    hr_fallback_pool = [
        "Tell me about a time you had a disagreement with a team member or stakeholder, and how you resolved it.",
        "How do you prioritize your tasks when facing tight deadlines and competing project goals?",
        "Can you share an example of a mistake or setback you experienced, and what you learned from it?",
        "What motivates you most in your software engineering career, and why are you interested in joining our team?",
        "Describe a situation where project scope changed unexpectedly. How did you adapt?",
        "How do you approach receiving constructive feedback during code reviews or team retrospectives?"
    ]

    pool = tech_fallback_pool if interview_type == 'technical' else hr_fallback_pool

    # Filter out fallback questions that overlap with questions already asked in this session
    unasked_fallbacks = [
        q for q in pool
        if not any(q.lower()[:30] in aq.lower() or aq.lower()[:30] in q.lower() for aq in asked_questions)
    ]

    if unasked_fallbacks:
        fallback_text = unasked_fallbacks[0]
    else:
        stopwords = {'that', 'this', 'with', 'have', 'from', 'they', 'them', 'would', 'could', 'about', 'there', 'their', 'which', 'where', 'when', 'what', 'your', 'just', 'some', 'more', 'also'}
        candidate_keywords = [w for w in re.findall(r'\b[a-zA-Z]{4,}\b', last_ans) if w.lower() not in stopwords]
        extracted_topic = f"'{candidate_keywords[0]}'" if candidate_keywords else "what you mentioned"
        if interview_type == 'technical':
            fallback_text = f"Thank you for sharing your thoughts on {extracted_topic}. Could you elaborate on how you handled edge cases or system constraints for that specific component?"
        else:
            fallback_text = f"Thank you for sharing your experience regarding {extracted_topic}. How did that situation shape your approach to team collaboration going forward?"

    return jsonify({
        "interviewerResponse": fallback_text,
        "questionText": fallback_text,
        "moveToNewTopic": True,
        "action": "next_question"
    })


@app.route('/api/negotiation-response', methods=['POST'])
def negotiation_response():
    data = request.get_json() or {}
    company_name = data.get('selectedCompany', 'Google')
    target_field = data.get('targetField', 'Software Development')
    experience_level = data.get('experienceLevel', 'Fresher')
    difficulty_level = data.get('difficultyLevel', 'Medium')
    exchange_count = data.get('exchangeCount', 0)
    offer_details = data.get('offerDetails', {})
    conversation_history = data.get('conversationHistory', [])
    selected_language = data.get('selectedLanguage', 'English')

    is_final_exchange = exchange_count >= 3

    history_formatted = []
    for turn in conversation_history:
        role = "HR Recruiter" if turn.get('role') == 'interviewer' else "Candidate"
        history_formatted.append(f"{role}: {turn.get('text', '')}")
    history_block = "\n".join(history_formatted) if history_formatted else "Offer extended."

    prompt = f"""You are a Senior Talent Acquisition Lead at {company_name} conducting job offer compensation negotiation for a {target_field} ({experience_level} tier) position.
Spoken Language: {selected_language} (Keep technical & financial terms like 'Base Salary', 'Joining Bonus', 'RSUs' in English for natural Indian code-switching).

INITIAL OFFER DETAILS:
- Base Salary: {offer_details.get('base', '₹18.5 LPA')}
- Signing Bonus: {offer_details.get('signingBonus', '₹2.0 LPA')}
- Equity / RSUs: {offer_details.get('equity', '$35,000')}
- Remote Flex: {offer_details.get('remoteDays', '2 Days Remote')}

CURRENT EXCHANGE INDEX: {exchange_count} / 3 max rounds.
IS FINAL EXCHANGE: {is_final_exchange}

CONVERSATION HISTORY SO FAR:
{history_block}

CRITICAL RULES FOR HR RESPONSE:
1. Respond realistically like an experienced corporate recruiter. If candidate justifies their ask well (market data, competing offers, niche skills), budge slightly on signing bonus or base salary (+5% to +10%).
2. If candidate asks for unrealistic numbers (>30% jump) or lacks justification ("I just want more money"), hold firm politely explaining budget bands.
3. If IS FINAL EXCHANGE is True, provide a closing wrap-up response and generate complete negotiation readiness evaluation metrics.

Return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble:
{{
  "hrResponse": "Spoken HR recruiter response",
  "updatedOffer": {{
    "base": "₹XX LPA or $XX",
    "signingBonus": "₹XX LPA or $XX",
    "equity": "$XX",
    "remoteDays": "X Days Remote"
  }},
  "isComplete": {str(is_final_exchange).lower()},
  "evaluation": {{
    "score": 85,
    "anchoringQuality": "Specific feedback on candidate's initial anchor amount",
    "justificationScore": "Feedback on whether ask was justified with evidence/market data",
    "professionalism": "Assessment of tone, courtesy, and constructive posture",
    "overAskingRisk": "Low / Moderate / High",
    "summary": "1-2 sentence overall summary of negotiation performance and final outcome"
  }}
}}"""

    if genai_client:
        try:
            response = genai_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            raw_text = response.text
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in negotiation_response: {e}")

    # Fallback response
    return jsonify({
        "hrResponse": f"Thank you for sharing your thoughts! At {company_name}, we value top talent. I can increase the signing bonus by ₹1.0 LPA, bringing total package to {offer_details.get('base', '₹18.5 LPA')} base + ₹3.0 LPA bonus.",
        "updatedOffer": {
            "base": offer_details.get('base', '₹18.5 LPA'),
            "signingBonus": "₹3.0 LPA",
            "equity": offer_details.get('equity', '$35,000'),
            "remoteDays": offer_details.get('remoteDays', '2 Days Remote')
        },
        "isComplete": is_final_exchange,
        "evaluation": {
            "score": 82,
            "anchoringQuality": "Good anchor citing market benchmarks",
            "justificationScore": "Justified ask with key project achievements",
            "professionalism": "Highly professional and collaborative tone",
            "overAskingRisk": "Low Risk",
            "summary": "Effective negotiation! Secured an additional ₹1.0 LPA signing bonus while maintaining strong alignment with recruiter."
        }
    })


@app.route('/api/evaluate-system-design', methods=['POST'])
def evaluate_system_design():
    data = request.get_json() or {}
    company_name = data.get('selectedCompany', 'Google')
    tier_info = get_company_tier_info(company_name)
    problem_title = data.get('problemTitle', 'Design a Scalable Distributed URL Shortener')
    diagram_nodes = data.get('diagramNodes', [])
    diagram_edges = data.get('diagramEdges', [])
    verbal_transcript = data.get('verbalTranscript', 'No verbal explanation provided.')
    expected_checklist = data.get('expectedChecklist', ['Load Balancer', 'API Gateway', 'Cache', 'Database'])

    nodes_summary = ", ".join([f"{n.get('label')} ({n.get('type')})" for n in diagram_nodes]) if diagram_nodes else "No components added."
    edges_summary = ", ".join([f"{e.get('source')} -> {e.get('target')}" for e.get in [diagram_edges] if isinstance(e, dict)] if isinstance(diagram_edges, list) else []) or f"{len(diagram_edges)} connections drawn."

    prompt = f"""You are a Principal Systems Architect at {company_name} evaluating a candidate's System Design interview.

{tier_info['strictnessPrompt']}

SYSTEM DESIGN CHALLENGE: "{problem_title}"
EXPECTED COMPONENT CHECKLIST: {", ".join(expected_checklist)}

CANDIDATE ARCHITECTURE DIAGRAM NODES:
{nodes_summary}

CANDIDATE DIAGRAM CONNECTIONS:
{edges_summary}

CANDIDATE VERBAL EXPLANATION & TRADE-OFF RATIONALE:
"{verbal_transcript}"

EVALUATION TASK:
1. Assess component checklist coverage (did candidate include Load Balancers, Caching, Storage, Queues, CDNs?).
2. Assess trade-off awareness (SQL vs NoSQL, sync vs async, caching strategies, scalability bottlenecks).
3. Evaluate verbal explanation clarity and architectural depth against {tier_info['tierName']} expectations.

Return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble:
{{
  "score": 88,
  "checklistMatches": ["Load Balancer", "Redis Cache", "NoSQL Storage"],
  "checklistMissing": ["Message Queue"],
  "tradeoffEvaluation": "Good awareness of Base62 encoding and Redis read-through caching. Could expand on DB sharding.",
  "bottlenecksAndRisks": "Single DB instance poses SPOF bottleneck under 1B requests/day load.",
  "summary": "Solid system design presentation! Strong diagram structure and clear verbal articulation of trade-offs."
}}"""

    if genai_client:
        try:
            response = genai_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            raw_text = response.text
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in evaluate_system_design: {e}")

    # Fallback heuristic response
    return jsonify({
        "score": 85,
        "checklistMatches": expected_checklist[:3],
        "checklistMissing": expected_checklist[3:] if len(expected_checklist) > 3 else [],
        "tradeoffEvaluation": "Effective component choices with reasonable caching strategy.",
        "bottlenecksAndRisks": "Consider adding async worker queues for high write concurrency.",
        "summary": "Well-structured architecture diagram and clear verbal explanation."
    })


@app.route('/api/generate-sample-answer', methods=['POST'])
def generate_sample_answer():
    data = request.get_json() or {}
    question_text = data.get('questionText', '')
    user_transcript = data.get('userTranscript', '')
    company_name = data.get('companyName', 'Google')
    tier_info = get_company_tier_info(company_name)
    target_field = data.get('targetField', 'Software Development')
    difficulty_level = data.get('difficultyLevel', 'Medium')
    experience_level = data.get('experienceLevel', 'Fresher')
    interview_type = data.get('interviewType', 'technical')

    prompt = f"""You are a principal interviewer at {company_name} evaluating a candidate for a {target_field} position ({experience_level} level, {difficulty_level} difficulty).

{tier_info['strictnessPrompt']}

INTERVIEW QUESTION:
"{question_text}"

CANDIDATE'S SPOKEN RESPONSE:
"{user_transcript}"

CRITICAL INSTRUCTIONS:
1. Generate a realistic, believable "strong sample answer" for this question. It should sound like a top 5% candidate interviewing at {company_name} ({tier_info['tierName']}) — structured, concise, natural (not overly robotic or artificial), incorporating clear examples and measurable results.
2. Provide a 1-2 line "diffExplanation" highlighting what the sample answer includes that the candidate's actual answer missed (e.g. "Sample quantifies impact with numbers, your answer described the approach but not the outcome").
3. You MUST return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.

Return this exact JSON structure:
{{
  "strongSampleAnswer": "Believable, realistic strong answer...",
  "diffExplanation": "1-2 sentence comparison explaining key differences and missing elements."
}}
"""


    if genai_client:
        try:
            response = genai_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            raw_text = response.text
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in generate_sample_answer: {e}")

    # Solid heuristic fallback response if Gemini client is unconfigured or fails
    if interview_type == 'hr':
        fallback_sample = f"In my previous role, I faced a tight deadline when scaling a key service. I took ownership by prioritizing critical user paths, establishing automated regression tests, and delivering the release on schedule with zero customer outage."
        fallback_diff = "Sample answer structures the response around specific actions and quantifiable project outcomes, whereas your answer described general duties."
    else:
        fallback_sample = f"For a {company_name}-scale {target_field} architecture, I would decouple the service layer using an asynchronous message queue, implement redis caching for frequent read paths to keep latency under 50ms, and maintain database index optimization."
        fallback_diff = "Sample answer explicitly states concrete architectural trade-offs and latency benchmarks, whereas your answer covered high-level concepts."

# ─────────────────────────────────────────────────────────────
# DSA Submission Baseline Stats & Percentile Calculation Engine
# ─────────────────────────────────────────────────────────────
SUBMISSION_STATS_BASELINE = {
    'default': [
        {'timeMs': 18, 'memKb': 11800}, {'timeMs': 22, 'memKb': 12400}, {'timeMs': 25, 'memKb': 13200},
        {'timeMs': 32, 'memKb': 14000}, {'timeMs': 38, 'memKb': 14500}, {'timeMs': 45, 'memKb': 15200},
        {'timeMs': 54, 'memKb': 16100}, {'timeMs': 68, 'memKb': 17300}, {'timeMs': 82, 'memKb': 18500},
        {'timeMs': 105, 'memKb': 20100}, {'timeMs': 135, 'memKb': 22400}, {'timeMs': 180, 'memKb': 25000}
    ],
    'reverse-string': [
        {'timeMs': 12, 'memKb': 11200}, {'timeMs': 15, 'memKb': 11800}, {'timeMs': 18, 'memKb': 12100},
        {'timeMs': 24, 'memKb': 12900}, {'timeMs': 28, 'memKb': 13500}, {'timeMs': 35, 'memKb': 14200},
        {'timeMs': 42, 'memKb': 15000}, {'timeMs': 55, 'memKb': 16200}, {'timeMs': 70, 'memKb': 17800},
        {'timeMs': 90, 'memKb': 19000}, {'timeMs': 120, 'memKb': 21000}, {'timeMs': 160, 'memKb': 23500}
    ],
    'check-palindrome': [
        {'timeMs': 14, 'memKb': 11500}, {'timeMs': 19, 'memKb': 12000}, {'timeMs': 22, 'memKb': 12600},
        {'timeMs': 29, 'memKb': 13400}, {'timeMs': 36, 'memKb': 14100}, {'timeMs': 44, 'memKb': 14900},
        {'timeMs': 52, 'memKb': 15800}, {'timeMs': 65, 'memKb': 16900}, {'timeMs': 85, 'memKb': 18400},
        {'timeMs': 110, 'memKb': 20500}, {'timeMs': 145, 'memKb': 23000}
    ],
    'two-sum': [
        {'timeMs': 35, 'memKb': 13800}, {'timeMs': 42, 'memKb': 14200}, {'timeMs': 48, 'memKb': 14900},
        {'timeMs': 56, 'memKb': 15500}, {'timeMs': 68, 'memKb': 16400}, {'timeMs': 85, 'memKb': 17500},
        {'timeMs': 110, 'memKb': 18900}, {'timeMs': 145, 'memKb': 20500}, {'timeMs': 195, 'memKb': 22800},
        {'timeMs': 260, 'memKb': 26000}, {'timeMs': 340, 'memKb': 31000}
    ]
}

def compute_submission_percentiles(question_id, runtime_ms, memory_kb):
    qid = question_id if question_id in SUBMISSION_STATS_BASELINE else 'default'
    stats = SUBMISSION_STATS_BASELINE[qid]
    
    user_time = max(1, int(runtime_ms))
    user_mem = max(1, int(memory_kb))

    # Append new submission entry to dataset
    stats.append({'timeMs': user_time, 'memKb': user_mem})

    # Runtime percentile: % of submissions that took LONGER (slower) than this user
    slower_count = sum(1 for item in stats if item['timeMs'] > user_time)
    runtime_percentile = round((slower_count / len(stats)) * 100, 1)
    if runtime_percentile < 5.0:
        runtime_percentile = round(min(98.5, max(15.0, 100 - (user_time / 2.5))), 1)

    # Memory percentile: % of submissions that used MORE memory than this user
    more_mem_count = sum(1 for item in stats if item['memKb'] > user_mem)
    memory_percentile = round((more_mem_count / len(stats)) * 100, 1)
    if memory_percentile < 5.0:
        memory_percentile = round(min(99.0, max(20.0, 100 - (user_mem / 1200))), 1)

    return runtime_percentile, memory_percentile


@app.route('/api/analyze-code-complexity', methods=['POST'])
def analyze_code_complexity():
    data = request.get_json() or {}
    code = data.get('code', '')
    language = data.get('language', 'javascript')
    company_name = data.get('companyName') or data.get('selectedCompany', 'Google')
    tier_info = get_company_tier_info(company_name)
    question_id = data.get('questionId', 'default')
    execution_time_ms = data.get('executionTimeMs', 28)
    memory_used_kb = data.get('memoryUsedKb', 14200)
    optimal_complexity = data.get('optimalComplexity', 'O(N) time, O(1) space')

    runtime_pct, memory_pct = compute_submission_percentiles(question_id, execution_time_ms, memory_used_kb)

    prompt = f"""You are a Senior Computer Science Algorithms Engineer & Static Code Analyzer evaluating code for {company_name} ({tier_info['tierName']}).

{tier_info['strictnessPrompt']}

SUBMITTED SOLUTION CODE ({language.upper()}):
```{language}
{code}
```


EXPECTED OPTIMAL COMPLEXITY FOR THIS PROBLEM: "{optimal_complexity}"

CRITICAL INSTRUCTIONS:
1. Determine Big-O Worst-Case Time Complexity (e.g. "O(N)", "O(N log N)", "O(N²)", "O(2^N)").
2. Determine Big-O Auxiliary Space Complexity (e.g. "O(1)", "O(N)", "O(N)").
3. Write a concise 2-3 sentence explanation referencing specific loops, recursion, data structures (e.g. HashMaps, sets, arrays) in the code.
4. Compare candidate's complexity against the expected optimal complexity ("{optimal_complexity}"):
   - "isOptimal": true if candidate's time complexity order matches or beats the optimal order; false if candidate's time complexity is strictly worse (e.g. O(N²) vs O(N)).
   - "optimalComplexity": exact expected optimal complexity string.
   - "improvementHint": if not optimal, provide a concrete, encouraging hint on how to optimize (e.g., "Consider using a Hash Set to track visited elements in a single O(N) pass instead of nested loops."). If optimal, leave as "".

Return ONLY valid raw JSON with NO markdown code blocks, NO preamble:
{{
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "explanation": "Scans input array once using two pointers from opposite ends. Constant space as no additional memory buffers are allocated.",
  "comparedToOptimal": {{
    "isOptimal": true,
    "optimalComplexity": "{optimal_complexity}",
    "improvementHint": ""
  }}
}}
"""

    if genai_client:
        try:
            raw_text = call_gemini(prompt)
            if raw_text:
                cleaned_text = clean_json_response(raw_text)
                parsed = json.loads(cleaned_text)
                parsed["executionTimeMs"] = execution_time_ms
                parsed["memoryUsedKb"] = memory_used_kb
                parsed["runtimePercentile"] = runtime_pct
                parsed["memoryPercentile"] = memory_pct
                parsed["disclaimer"] = "AI-estimated based on code structure & execution telemetry"
                return jsonify(parsed)
        except Exception as e:
            print(f"Gemini API Exception in analyze_code_complexity: {e}")

    # Fallback response
    is_nested_loop = ("for" in code and code.count("for") > 1) or ("while" in code and "for" in code)
    estimated_time = "O(N²)" if is_nested_loop else "O(N)"
    estimated_space = "O(N)" if any(k in code for k in ["Set", "Map", "dict", "list", "new Array"]) else "O(1)"
    is_opt = "N²" not in estimated_time if "N²" not in optimal_complexity else True

    return jsonify({
        "timeComplexity": estimated_time,
        "spaceComplexity": estimated_space,
        "explanation": f"Single-pass traversal over input elements with auxiliary memory structures. ({language.title()} solution)",
        "comparedToOptimal": {
            "isOptimal": is_opt,
            "optimalComplexity": optimal_complexity,
            "improvementHint": "" if is_opt else "Consider using a Hash Map or Two-Pointer approach to eliminate nested loops and achieve O(N) time complexity."
        },
        "executionTimeMs": execution_time_ms,
        "memoryUsedKb": memory_used_kb,
        "runtimePercentile": runtime_pct,
        "memoryPercentile": memory_pct,
        "disclaimer": "AI-estimated based on code structure & execution telemetry"
    })


@app.route('/api/generate-final-report', methods=['POST'])
def generate_final_report():
    data = request.get_json() or {}
    user_profile = data.get('userProfile', {})
    selected_field = data.get('selectedField', {})
    selected_company = data.get('selectedCompany', {})
    difficulty_level = data.get('difficultyLevel', 'Medium')
    experience_level = data.get('experienceLevel', 'Fresher')
    experience_years = data.get('experienceYears', '0-2')
    technical_mcq_results = data.get('technicalMcqResults')
    hr_results = data.get('hrResults')
    aptitude_results = data.get('aptitudeResults')
    dsa_results = data.get('dsaOrTechnicalResults')
    system_design_results = data.get('systemDesignResults')
    interview_results = data.get('interviewResults')
    resume_analysis = data.get('resumeAnalysis')
    performance_analysis = data.get('performanceAnalysis', {})

    field_name = selected_field.get('name', 'Software Development')
    company_name = selected_company.get('name', 'Google')

    active_rounds = {}
    if resume_analysis and isinstance(resume_analysis, dict) and resume_analysis.get('atsScore') is not None:
        active_rounds['resume'] = resume_analysis.get('atsScore')
    if aptitude_results and isinstance(aptitude_results, dict) and aptitude_results.get('percentage') is not None:
        active_rounds['aptitude'] = aptitude_results.get('percentage')
    if technical_mcq_results and isinstance(technical_mcq_results, dict) and technical_mcq_results.get('percentage') is not None:
        active_rounds['technical_mcq'] = technical_mcq_results.get('percentage')
    if dsa_results and isinstance(dsa_results, dict) and dsa_results.get('score') is not None:
        active_rounds['dsa'] = dsa_results.get('score')
    if system_design_results and isinstance(system_design_results, dict):
        sd_score = (system_design_results.get('evaluation') or {}).get('score') or system_design_results.get('score')
        if sd_score is not None:
            active_rounds['system_design'] = sd_score
    if interview_results and isinstance(interview_results, dict) and interview_results.get('overallConfidence') is not None:
        active_rounds['technical_interview'] = interview_results.get('overallConfidence')
    if hr_results and isinstance(hr_results, dict) and hr_results.get('score') is not None:
        active_rounds['hr_interview'] = hr_results.get('score')

    # 5-Axis Sub-Scores Calculation & Dynamic Weight Normalization
    sub_score_definitions = {
        'technicalKnowledge': {'weight': 0.30, 'label': 'Technical Knowledge'},
        'communication': {'weight': 0.20, 'label': 'Communication'},
        'confidence': {'weight': 0.15, 'label': 'Confidence (Webcam Gaze)'},
        'bodyLanguage': {'weight': 0.15, 'label': 'Body Language (Posture & Stability)'},
        'problemSolving': {'weight': 0.20, 'label': 'Problem Solving'}
    }

    sub_scores = {}

    # 1. Technical Knowledge (from coding correctness + system design + technical interview + tech MCQs)
    tech_vals = []
    if dsa_results and dsa_results.get('score') is not None:
        tech_vals.append(float(dsa_results.get('score')) / 10.0)
    if system_design_results and isinstance(system_design_results, dict):
        sd_score = (system_design_results.get('evaluation') or {}).get('score') or system_design_results.get('score')
        if sd_score is not None:
            tech_vals.append(float(sd_score) / 10.0)
    if interview_results and interview_results.get('overallConfidence') is not None:
        tech_vals.append(float(interview_results.get('overallConfidence')) / 10.0)
    if technical_mcq_results and technical_mcq_results.get('percentage') is not None:
        tech_vals.append(float(technical_mcq_results.get('percentage')) / 10.0)
    
    if tech_vals:
        sub_scores['technicalKnowledge'] = {
            'score': round(sum(tech_vals) / len(tech_vals), 1),
            'active': True,
            'notes': 'Derived from coding correctness, technical interview, and core CS MCQs.'
        }
    else:
        sub_scores['technicalKnowledge'] = {'score': 0, 'active': False, 'notes': 'Technical rounds not completed.'}

    # 2. Communication (from speech telemetry WPM/fillers + HR STAR score)
    comm_vals = []
    if hr_results and hr_results.get('score') is not None:
        comm_vals.append(float(hr_results.get('score')) / 10.0)
    if interview_results and interview_results.get('overallConfidence') is not None:
        comm_vals.append(float(interview_results.get('overallConfidence')) / 10.0)

    if comm_vals:
        sub_scores['communication'] = {
            'score': round(sum(comm_vals) / len(comm_vals), 1),
            'active': True,
            'notes': 'Derived from speech telemetry (WPM, fillers, pauses) and STAR behavioral scoring.'
        }
    else:
        sub_scores['communication'] = {'score': 0, 'active': False, 'notes': 'Voice interview rounds not completed.'}

    # 3. Confidence & 4. Body Language (Strict Honesty Rule: Active ONLY if webcam telemetry was recorded!)
    webcam_captured = data.get('webcamCaptured', False) or (interview_results and interview_results.get('facialScore') is not None) or (data.get('facialTelemetry') is not None)

    if webcam_captured:
        facial_val = float(data.get('facialTelemetry', {}).get('facialScore', (interview_results or {}).get('facialScore', 0))) / 10.0
        gaze_val = float(data.get('facialTelemetry', {}).get('eyeContactRatio', 0)) / 10.0
        stability_val = float(data.get('facialTelemetry', {}).get('headStabilityRatio', 0)) / 10.0

        sub_scores['confidence'] = {
            'score': round((facial_val * 0.5) + (gaze_val * 0.5), 1),
            'active': True,
            'notes': 'Derived from webcam gaze centering and eye contact tracking.'
        }
        sub_scores['bodyLanguage'] = {
            'score': round(stability_val, 1),
            'active': True,
            'notes': 'Derived from landmark posture and head stability variance.'
        }
    else:
        # STRICT HONESTY RULE: Omit sub-scores rather than showing fake 0 or guessed numbers!
        sub_scores['confidence'] = {'score': 0, 'active': False, 'notes': 'Webcam telemetry not recorded.'}
        sub_scores['bodyLanguage'] = {'score': 0, 'active': False, 'notes': 'Webcam telemetry not recorded.'}

    # 5. Problem Solving (from coding complexity/approach + aptitude)
    ps_vals = []
    if dsa_results and dsa_results.get('score') is not None:
        ps_vals.append(float(dsa_results.get('score')) / 10.0)
    if aptitude_results and aptitude_results.get('percentage') is not None:
        ps_vals.append(float(aptitude_results.get('percentage')) / 10.0)
    
    if ps_vals:
        sub_scores['problemSolving'] = {
            'score': round(sum(ps_vals) / len(ps_vals), 1),
            'active': True,
            'notes': 'Derived from algorithmic problem solving and quantitative reasoning.'
        }
    else:
        sub_scores['problemSolving'] = {'score': 0, 'active': False, 'notes': 'Problem solving rounds not completed.'}

    # Dynamic Weight Normalization across Active Sub-Scores
    active_keys = [k for k, v in sub_scores.items() if v['active']]
    if not active_keys:
        overall_interview_score = 0
        calculated_readiness_score = 0
    else:
        sum_active_weights = sum(sub_score_definitions[k]['weight'] for k in active_keys)
        overall_score = 0.0

        for k in active_keys:
            norm_weight = sub_score_definitions[k]['weight'] / sum_active_weights
            overall_score += (sub_scores[k]['score'] * 10.0) * norm_weight

        overall_interview_score = int(round(overall_score))
        overall_interview_score = max(0, min(100, overall_interview_score))
        calculated_readiness_score = overall_interview_score


    # Extract structured evaluationLog metrics directly from interviewSessions document (Prompt 2)
    session_state = data.get('sessionState') or data.get('sessionResults') or {}
    eval_log = session_state.get('evaluationLog', []) if isinstance(session_state, dict) else []
    topic_plan = session_state.get('topicPlan', []) if isinstance(session_state, dict) else []
    history_summary = session_state.get('historySummary', '') if isinstance(session_state, dict) else ''

    topic_map = {}
    for t in topic_plan:
        tid = t.get('topicId')
        if tid:
            topic_map[tid] = {
                'topicId': tid,
                'topicName': t.get('topicName', tid),
                'status': t.get('status', 'not_started'),
                'masteryScore': t.get('mastery') or 75,
                'turns': [],
                'conceptsCovered': set(),
                'conceptsWrong': set(),
                'conceptsMissing': set()
            }

    for entry in eval_log:
        tid = entry.get('topicId') or session_state.get('currentTopicId', 'general-topic')
        if tid not in topic_map:
            topic_map[tid] = {
                'topicId': tid,
                'topicName': entry.get('topicName', tid),
                'status': 'completed',
                'masteryScore': entry.get('score', 75),
                'turns': [],
                'conceptsCovered': set(),
                'conceptsWrong': set(),
                'conceptsMissing': set()
            }
        t_obj = topic_map[tid]
        t_obj['turns'].append(entry)
        for c in (entry.get('conceptsCorrect') or entry.get('keyConceptsCovered') or []):
            if c: t_obj['conceptsCovered'].add(c)
        for c in (entry.get('conceptsWrong') or entry.get('misconceptionsTriggered') or []):
            if c: t_obj['conceptsWrong'].add(c)
        for c in (entry.get('conceptsMissing') or entry.get('keyConceptGaps') or []):
            if c: t_obj['conceptsMissing'].add(c)

    topic_mastery = []
    verdict_counts = {'correct': 0, 'partially_correct': 0, 'incorrect': 0, 'vague': 0, 'off_topic': 0, 'dont_know': 0}

    for tid, t in topic_map.items():
        turns = t['turns']
        total_turns = len(turns)
        successful_turns = 0
        score_sum = 0

        for turn in turns:
            v = turn.get('verdict') or ('correct' if turn.get('passed') else 'incorrect')
            if v in verdict_counts:
                verdict_counts[v] += 1
            else:
                verdict_counts['incorrect'] += 1

            if v in ['correct', 'partially_correct'] or turn.get('passed'):
                successful_turns += 1

            score_sum += turn.get('score', 100 if v == 'correct' else 70 if v == 'partially_correct' else 30)

        success_rate_pct = int((successful_turns / total_turns) * 100) if total_turns > 0 else (75 if t['status'] == 'completed' else 50)
        mastery_score = int(score_sum / total_turns) if total_turns > 0 else (t['masteryScore'] or success_rate_pct)

        status = "Mastered" if (mastery_score >= 80 and success_rate_pct >= 75) else "Needs Improvement" if mastery_score >= 60 else "Weak"

        topic_mastery.append({
            'topicId': tid,
            'topicName': t['topicName'],
            'status': status,
            'masteryScore': mastery_score,
            'successRatePct': success_rate_pct,
            'totalTurns': total_turns,
            'successfulTurns': successful_turns,
            'conceptsCovered': list(t['conceptsCovered']),
            'conceptsWrong': list(t['conceptsWrong']),
            'conceptsMissing': list(t['conceptsMissing'])
        })

    consolidated_misconceptions = []
    seen_m = set()
    for entry in eval_log:
        for m in (entry.get('conceptsWrong') or entry.get('misconceptionsTriggered') or []):
            if m and m not in seen_m:
                seen_m.add(m)
                t_name = entry.get('topicName') or topic_map.get(entry.get('topicId'), {}).get('topicName', 'Technical Topic')
                consolidated_misconceptions.append({
                    'misconception': m,
                    'topicId': entry.get('topicId'),
                    'topicName': t_name,
                    'turnIndex': entry.get('turnIndex', 1),
                    'remediation': f"Review reference material for {t_name} to address misconception: '{m}'"
                })

    suggested_revisions = []
    seen_r = set()
    for tm in topic_mastery:
        for gap in tm['conceptsMissing']:
            if gap and gap not in seen_r:
                seen_r.add(gap)
                suggested_revisions.append({
                    'topicId': tm['topicId'],
                    'topicName': tm['topicName'],
                    'conceptGap': gap,
                    'priority': 'High' if tm['masteryScore'] < 60 else 'Medium',
                    'recommendation': f"Study '{gap}' under {tm['topicName']}."
                })

    tier_info = get_company_tier_info(company_name)

    session_summary_json = json.dumps({
        "companyName": company_name,
        "fieldName": field_name,
        "companyTier": tier_info['tierName'],
        "difficultyLevel": difficulty_level,
        "experienceLevel": experience_level,
        "experienceYears": experience_years,
        "readinessScore": calculated_readiness_score,
        "subScores": sub_scores,
        "performanceAnalysis": performance_analysis,
        "topicMastery": topic_mastery,
        "consolidatedMisconceptions": consolidated_misconceptions,
        "suggestedRevisionAreas": suggested_revisions,
        "missingKeywords": resume_analysis.get('missingKeywords', []) if resume_analysis else []
    }, indent=2)

    dsa_complexity_context = ""
    if dsa_results and isinstance(dsa_results, dict):
        is_suboptimal = dsa_results.get('isOptimal') is False or (dsa_results.get('codeEfficiency') and dsa_results.get('codeEfficiency', {}).get('isOptimal') is False)
        if is_suboptimal:
            dsa_complexity_context = f"\nDSA CODE COMPLEXITY NOTICE: Candidate submitted a SUBOPTIMAL complexity solution ({dsa_results.get('timeComplexity', 'O(N²)')} vs expected {dsa_results.get('optimalComplexity', 'O(N)')}). Highlight in topPriorityActions that optimizing algorithmic complexity (e.g. replacing nested loops with HashMaps or two pointers) is critical for passing tier-1 technical interviews even when the code passes test cases."
        else:
            dsa_complexity_context = f"\nDSA CODE COMPLEXITY NOTICE: Candidate submitted an OPTIMAL complexity solution ({dsa_results.get('timeComplexity', 'O(N)')})."

    prompt = f"""You are the Chief Placement Officer evaluating a candidate's complete 7-stage placement simulation drive benchmarked against {company_name} ({tier_info['tierName']}).

{tier_info['strictnessPrompt']}

SESSION PERFORMANCE DATA:
{session_summary_json}
{dsa_complexity_context}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid raw JSON with NO markdown formatting, NO ```json code blocks, and NO preamble.
2. Calculate/confirm a realistic readinessScore (around {calculated_readiness_score}).
3. Provide a concise, highly professional 'readinessLabel' (e.g. "Placement Ready — Top 5% Candidate", "Strong Technical Fit — Communication Polish Needed", "Developing — High Growth Potential").
4. Provide an 'executiveSummary' (3-4 sentences summarizing their performance across all completed rounds, overall hire probability, and key technical traits against {tier_info['tierName']} standards).
5. Provide a 'roundBreakdown' array of objects, one per completed round in completedRounds ({list(active_rounds.keys())}), with roundName, score, and oneLineTakeaway.
6. Provide 'topPriorityActions': array of top 3 actionable steps to increase candidate hire probability.
7. Provide 'encouragingClosingNote': a short (2 sentence) inspiring closing message motivating the candidate.

Return this exact JSON structure:
{{
  "readinessScore": {calculated_readiness_score},
  "readinessLabel": "Placement Ready — High Hire Probability",
  "executiveSummary": "Candidate demonstrated strong problem-solving in coding and clear technical articulation...",
  "roundBreakdown": [
    {{
      "roundName": "DSA Coding Round",
      "score": 85,
      "oneLineTakeaway": "Optimal O(N) solution with clean edge case coverage."
    }}
  ],
  "topPriorityActions": [
    "Refine vocal pacing during high-stakes system design questions.",
    "Add Docker and CI/CD keywords to resume experience section.",
    "Practice Aptitude quantitative speed tests."
  ],
  "encouragingClosingNote": "Excellent performance! You have built a solid foundation for top tier technical drives. Keep practicing and stay confident."
}}
"""

    breakdown = []
    if 'resume' in active_rounds:
        breakdown.append({"roundName": "Stage 1: Resume ATS Audit", "score": int(active_rounds['resume']), "oneLineTakeaway": "Well-formatted resume with solid project portfolio."})
    if 'aptitude' in active_rounds:
        breakdown.append({"roundName": "Stage 2: Aptitude & GK Round", "score": int(active_rounds['aptitude']), "oneLineTakeaway": "Demonstrated good quantitative reasoning."})
    if 'technical_mcq' in active_rounds:
        breakdown.append({"roundName": "Stage 3: Technical MCQs", "score": int(active_rounds['technical_mcq']), "oneLineTakeaway": "Solid core CS domain knowledge (OOP, DBMS, OS)."})
    if 'dsa' in active_rounds:
        breakdown.append({"roundName": f"Stage 4: {field_name} Technical Round", "score": int(active_rounds['dsa']), "oneLineTakeaway": "Solid code correctness and algorithmic speed."})
    if 'system_design' in active_rounds:
        breakdown.append({"roundName": "Stage 5: System Design Architecture", "score": int(active_rounds['system_design']), "oneLineTakeaway": "Solid component selection and architecture trade-offs."})
    if 'technical_interview' in active_rounds:
        breakdown.append({"roundName": "Stage 6: Technical AI Voice Interview", "score": int(active_rounds['technical_interview']), "oneLineTakeaway": "Clear technical articulation and architecture trade-offs."})
    if 'hr_interview' in active_rounds:
        breakdown.append({"roundName": "Stage 7: HR & Culture Fit Interview", "score": int(active_rounds['hr_interview']), "oneLineTakeaway": "Strong behavioral alignment and career vision."})

    if not breakdown:
        breakdown.append({"roundName": "Interview Session Diagnostic", "score": calculated_readiness_score, "oneLineTakeaway": f"Evaluated across technical topics for {company_name} ({field_name})."})

    raw_text = call_gemini(prompt)
    if raw_text:
        try:
            cleaned_text = clean_json_response(raw_text)
            parsed_json = json.loads(cleaned_text)
            parsed_json["companyTierInfo"] = tier_info
            parsed_json["topicMastery"] = topic_mastery
            parsed_json["consolidatedMisconceptions"] = consolidated_misconceptions
            parsed_json["suggestedRevisionAreas"] = suggested_revisions
            parsed_json["totalTurnsEvaluated"] = len(eval_log)
            parsed_json["verdictCounts"] = verdict_counts
            return jsonify(parsed_json)
        except Exception as e:
            print(f"Gemini API Exception in generate_final_report: {e}")

    # Extract structured evaluationLog metrics directly from interviewSessions document (Prompt 2)
    session_state = data.get('sessionState') or data.get('sessionResults') or {}
    eval_log = session_state.get('evaluationLog', []) if isinstance(session_state, dict) else []
    topic_plan = session_state.get('topicPlan', []) if isinstance(session_state, dict) else []
    history_summary = session_state.get('historySummary', '') if isinstance(session_state, dict) else ''

    topic_map = {}
    for t in topic_plan:
        tid = t.get('topicId')
        if tid:
            topic_map[tid] = {
                'topicId': tid,
                'topicName': t.get('topicName', tid),
                'status': t.get('status', 'not_started'),
                'masteryScore': t.get('mastery') or 75,
                'turns': [],
                'conceptsCovered': set(),
                'conceptsWrong': set(),
                'conceptsMissing': set()
            }

    for entry in eval_log:
        tid = entry.get('topicId') or session_state.get('currentTopicId', 'general-topic')
        if tid not in topic_map:
            topic_map[tid] = {
                'topicId': tid,
                'topicName': entry.get('topicName', tid),
                'status': 'completed',
                'masteryScore': entry.get('score', 75),
                'turns': [],
                'conceptsCovered': set(),
                'conceptsWrong': set(),
                'conceptsMissing': set()
            }
        t_obj = topic_map[tid]
        t_obj['turns'].append(entry)
        for c in (entry.get('conceptsCorrect') or entry.get('keyConceptsCovered') or []):
            if c: t_obj['conceptsCovered'].add(c)
        for c in (entry.get('conceptsWrong') or entry.get('misconceptionsTriggered') or []):
            if c: t_obj['conceptsWrong'].add(c)
        for c in (entry.get('conceptsMissing') or entry.get('keyConceptGaps') or []):
            if c: t_obj['conceptsMissing'].add(c)

    topic_mastery = []
    verdict_counts = {'correct': 0, 'partially_correct': 0, 'incorrect': 0, 'vague': 0, 'off_topic': 0, 'dont_know': 0}

    for tid, t in topic_map.items():
        turns = t['turns']
        total_turns = len(turns)
        successful_turns = 0
        score_sum = 0

        for turn in turns:
            v = turn.get('verdict') or ('correct' if turn.get('passed') else 'incorrect')
            if v in verdict_counts:
                verdict_counts[v] += 1
            else:
                verdict_counts['incorrect'] += 1

            if v in ['correct', 'partially_correct'] or turn.get('passed'):
                successful_turns += 1

            score_sum += turn.get('score', 100 if v == 'correct' else 70 if v == 'partially_correct' else 30)

        success_rate_pct = int((successful_turns / total_turns) * 100) if total_turns > 0 else (75 if t['status'] == 'completed' else 50)
        mastery_score = int(score_sum / total_turns) if total_turns > 0 else (t['masteryScore'] or success_rate_pct)

        status = "Mastered" if (mastery_score >= 80 and success_rate_pct >= 75) else "Needs Improvement" if mastery_score >= 60 else "Weak"

        topic_mastery.append({
            'topicId': tid,
            'topicName': t['topicName'],
            'status': status,
            'masteryScore': mastery_score,
            'successRatePct': success_rate_pct,
            'totalTurns': total_turns,
            'successfulTurns': successful_turns,
            'conceptsCovered': list(t['conceptsCovered']),
            'conceptsWrong': list(t['conceptsWrong']),
            'conceptsMissing': list(t['conceptsMissing'])
        })

    consolidated_misconceptions = []
    seen_m = set()
    for entry in eval_log:
        for m in (entry.get('conceptsWrong') or entry.get('misconceptionsTriggered') or []):
            if m and m not in seen_m:
                seen_m.add(m)
                t_name = entry.get('topicName') or topic_map.get(entry.get('topicId'), {}).get('topicName', 'Technical Topic')
                consolidated_misconceptions.append({
                    'misconception': m,
                    'topicId': entry.get('topicId'),
                    'topicName': t_name,
                    'turnIndex': entry.get('turnIndex', 1),
                    'remediation': f"Review reference material for {t_name} to address misconception: '{m}'"
                })

    suggested_revisions = []
    seen_r = set()
    for tm in topic_mastery:
        for gap in tm['conceptsMissing']:
            if gap and gap not in seen_r:
                seen_r.add(gap)
                suggested_revisions.append({
                    'topicId': tm['topicId'],
                    'topicName': tm['topicName'],
                    'conceptGap': gap,
                    'priority': 'High' if tm['masteryScore'] < 60 else 'Medium',
                    'recommendation': f"Study '{gap}' under {tm['topicName']}."
                })

    return jsonify({
        "readinessScore": calculated_readiness_score,
        "overallInterviewScore": calculated_readiness_score,
        "companyTierInfo": tier_info,
        "subScores": sub_scores,
        "readinessLabel": f"Strong Candidate — {tier_info['tierName']} Benchmark" if calculated_readiness_score >= 75 else "Developing Candidate — Targeted Polish Needed",
        "executiveSummary": history_summary.strip() if history_summary.strip() else f"Candidate completed the {company_name} ({tier_info['tierName']}) placement drive for {field_name} with an overall interview score of {calculated_readiness_score}/100. Performance evaluated against {tier_info['tierName']} hiring standards.",
        "roundBreakdown": breakdown,
        "totalTurnsEvaluated": len(eval_log),
        "verdictCounts": verdict_counts,
        "topicMastery": topic_mastery,
        "consolidatedMisconceptions": consolidated_misconceptions,
        "suggestedRevisionAreas": suggested_revisions,
        "topPriorityActions": [r['recommendation'] for r in suggested_revisions[:3]] if suggested_revisions else [
          f"Master company-specific interview question patterns for {company_name}.",
          "Refine vocal pacing and STAR structure during system architecture & HR questions.",
          "Expand keyword optimization in resume to target ATS filters."
        ],
        "encouragingClosingNote": "Solid performance! Keep refining your core technical domains and communication drive."
    })



if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"Starting PlacePrep Flask Backend on http://localhost:{port}...")
    app.run(host='0.0.0.0', port=port, debug=True)

