# 06 — AYURQUEST 1.5 TEST ENGINE & EXAMINATION MODES DISCOVERY

**Origin Routes:**  
- `/app1.5/ayush-npget.php?action=mock_test` (AIAPGET Mock Tests)  
- `/app1.5/upsc.php` (UPSC Entrance Portal)  
- `/app1.5/prev-years.php` (Previous Year Papers)  
- `/app1.5/myScore.php` (Score Card & Performance Analytics)  
**Verification Method:** Screenshot Baselines (`192355.png`, `192404.png`, `192417.png`, `192616.png`) + Engine Source Audits  
**Date:** November 2026  

---

## 1. Test Engine Architecture Overview

The AyurQuest 1.5 assessment platform incorporates two distinct operational modes designed for progressive mastery:
1. **Interactive Practice Mode (`mode=practice`)** — Formative self-study with immediate feedback.
2. **AIAPGET Exam Simulation Mode (`mode=exam`)** — Summative high-stakes computer-based test (CBT) conforming strictly to National Testing Agency (NTA) guidelines.

---

## 2. Examination Modes Specification

### Mode A: Practice Mode (Instant Tutoring)
- **Timer:** Per-question stopwatch (counting up from 00:00).
- **Answer Evaluation:** Immediate on option selection.
- **Audio Feedback:** Authentic chimes for correct responses and subtle buzzers for errors.
- **Immediate Rationale:** Injects classical Sanskrit shloka citation and English commentary.
- **Bookmark / Note / Report Controls:** Embedded below each question card.
- **Use Case:** Chapterwise revision, daily drills, and commuter problem solving.

### Mode B: AIAPGET CBT Exam Simulation Mode
- **Exam Duration:** Exactly 120 Minutes (Countdown timer with color warning at 10 minutes).
- **Question Count:** 120 Objective Multiple Choice Questions.
- **Total Marks:** 480 Marks.
- **Marking Scheme:**
  - **Correct Response:** **+4 Marks**
  - **Incorrect Response:** **-1 Mark** (Negative Marking penalty of 25%)
  - **Unattempted Question:** **0 Marks**
- **NTA Question Palette (Interactive 120-item Grid):**
  - Gray circle: *Not Visited*
  - Orange circle: *Not Answered*
  - Green circle: *Answered*
  - Purple circle: *Marked for Review*
  - Purple with green dot: *Answered & Marked for Review (Evaluated)*
- **Navigation Controls:** `Save & Next`, `Clear Response`, `Mark for Review & Next`, `Submit Exam`.

---

## 3. Examination Catalogues & Series

### A. AIAPGET Mock Tests (`/app1.5/ayush-npget.php?action=mock_test`)
- **Year Tabs:** `2027`, `2026`, `2025`, `2024`
- **Filter Pills:** `All`, `Solved`, `Unsolved`
- **Mock Test 1 Specifications (Screenshot 192355.png):**
  - Title: **MOCK TEST-1**
  - Release Date: 16 May 2027 (Scheduled release)
  - Total Marks: 480
  - Total MCQs: 120
  - Duration: 120 min.
  - Wallet Points to Unlock: 30 pts.
  - Banner: `TEST WILL BE AVAILABLE ON 16 May 2027`
- **Active 2026 Series:** Full syllabus mocks available instantly with 0 wallet deduction in localhost mode.

### B. UPSC Ayurveda Medical Officer Portal (`/app1.5/upsc.php`)
- **Top Actions:**
  - `Daily Rapid Fire` (20 high-speed questions in 10 minutes)
  - `Question Challenge` (Peer challenge mode)
- **Exam Categories:**
  - UPSC Combined Medical Services (Ayurveda)
  - ESIC Medical Officer (Ayurveda)
  - State PSC Ayurveda MO (Rajasthan RPSC, Uttar Pradesh UPPSC, Madhya Pradesh MPPSC, Maharashtra MPSC)

### C. Previous Year Papers (`/app1.5/prev-years.php`)
- **Repository:** 125+ Original Solved Papers from 2012 to 2026.
- **Three Core Streams:**
  1. **All Ayurveda Entrance Exams** (State-level pre-AIAPGET entrance papers)
  2. **Post Graduate Ayurveda Entrance (AIAPGET)** (Official NTA question papers)
  3. **UPSC & PSC Ayurveda Exams** (Official government commission papers)

---

## 4. Score Card & Analytics Engine (`/app1.5/myScore.php`)

After completing an exam, the student receives a detailed diagnostic report:
- **Primary Metrics:**
  - Total Questions & Attempted Count
  - Correct vs Incorrect breakdown
  - Gross Score vs Negative Deduction = Net Score
  - Accuracy Percentage: `(Correct / Attempted) * 100`
  - All India Percentile & Projected Category Rank
- **DataTable Attempt Ledger:**
  - Searchable list of past attempts with date, duration, score, and link to complete item-by-item question analysis.

