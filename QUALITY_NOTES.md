# PlacePrep Quality & Demo Guide (Internal Reference)

> **CONFIDENTIAL / INTERNAL USE ONLY**  
> This document guides team members and demo presenters on which company/field combinations offer our deepest, most thoroughly validated end-to-end experience for judging and live evaluation.

---

## 1. Demo Tiering Matrix

All 10 fields and 20 recruiters remain fully selectable and functional in the application. However, data depth and rubric specificity vary across combinations. For high-stakes live demos and judging rounds, use **Tier 1 (Recommended Demo Paths)**.

### Tier 1: Recommended Demo Paths (★ Highest Polish — Safe for Live Judging)

These combinations feature 100% end-to-end coverage: curated topic rubrics, unit-tested coding test cases, company-specific behavioral playbooks, evidence-anchored evaluator prompts, and tailored course mappings.

| Field Track | Recruiter | Rubric Coverage | Coding / DSA Depth | Behavioral / HR Calibration | Demo Notes |
|:---|:---|:---|:---|:---|:---|
| **Software Development (SDE)** | **Google** | **Complete** (OOP Inheritance, Polymorphism, System Design, Trees, DP) | **Complete** (Two Sum, Valid Parentheses, Longest Substring, etc. with unit tests) | **Complete** (Technical depth, algorithmic articulation, Googleyness) | **Primary Demo Choice**: Demonstrates evidence quotes, Big-O analysis, deterministic 4-dimension scoring, and zero-emotion gaze telemetry. |
| **QA / Software Testing** | **Amazon** | **Complete** (STLC, TestNG, Selenium, Bug Lifecycle, Automation, SQL) | **Complete** (Test case logic, API validation questions, SQL data joins) | **Complete** (Amazon Leadership Principles: Customer Obsession, Ownership, Bias for Action) | **Secondary Demo Choice**: Ideal for showing non-DSA role customization and adaptive question flow. |
| **Data Science / ML** | **Microsoft** | **Complete** (SQL CTEs, Statistics, Evaluation Metrics, ML System Design) | **Complete** (SQL schemas, data modeling, algorithm analysis) | **Complete** (Collaborative problem solving, design trade-offs) | **Alternative Choice**: Demonstrates analytical reasoning and system scalability rubrics. |

---

### Tier 2: Standard Supported Paths (Good for General Exploration)

These combinations have complete recruiter profiles, verified DSA timers, and standard topic seeds. When candidates answer role-specific questions, PlacePrep pairs curated core rubrics (OOP, SQL, DSA) with adaptive Gemini LLM evaluations.

| Field Tracks | Recruiters | Coverage Details |
|:---|:---|:---|
| **SDE**, **Mobile Dev**, **DevOps / Cloud** | **Meta**, **Apple**, **Netflix**, **Goldman Sachs**, **JPMorgan**, **TCS Digital** | Curated company playbooks and hiring stages; uses general software engineering rubrics. Degraded banner displays cleanly if LLM calls fail. |

---

### Tier 3: Thinner Paths (Avoid During Live Judging)

These tracks are fully selectable in the UI, but rely more heavily on dynamic generative AI generation rather than extensive pre-seeded rubric databases:

- **UI/UX Design + FinTech (e.g., Morgan Stanley / Bloomberg)**
- **Cybersecurity + IT Services (e.g., Wipro / Cognizant)**
- **Business Analyst + Boutique Product Companies**

*Guidance*: Do not proactively select Tier 3 during a 5-minute judge pitch. Guide judges to the highlighted **"⭐ Recommended Demo Path"** badges on the selection screens.

---

## 2. Facial Telemetry & Evaluation Trust Rules

In accordance with architectural reliability requirements:
1. **Zero Emotion Scoring**: No expression classification (`happy`, `sad`, `nervous`, `stressed`, `smile ratio`) feeds into any score, report dimension, or rating anywhere in PlacePrep.
2. **Verifiable Signals Only**: Facial webcam tracking is strictly limited to:
   - **Candidate Presence Detection**: Is the candidate in frame? (Used for "No Candidate Detected" alerts).
   - **Gaze / Eye-Contact Centering**: Percentage of time candidate maintains forward eye contact with the camera.
   - **Head Landmark Stability**: Posture steadiness over time.
3. **Communication Composure Dimension**: Computed strictly from measurable signals:
   - Speech Pace Consistency (25%)
   - Filler Word Frequency (25%)
   - Response Latency & Pauses (25%)
   - Eye Contact & Presence Telemetry (25%)
4. **Sourcing Transparency**: All company interview calibrations and difficulty ratings carry the disclaimer:  
   *"Based on publicly available interview experience reports"*.
