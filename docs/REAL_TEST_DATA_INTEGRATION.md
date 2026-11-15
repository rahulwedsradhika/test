# REAL TEST DATA & EXAMINATION ENGINE INTEGRATION

**Origin Routes:**  
- `/app1.5/ayush-npget.php?action=mock_test` (AIAPGET Mock Tests)  
- `/app1.5/prev-years.php` (Previous Year Papers)  
- `/app1.5/upsc.php` (UPSC Ayurveda Medical Officer Portal)  
- `/quiz/:id?mode=exam` (AIAPGET Computer-Based Test Simulation)  
**Marking Scheme:** +4 Correct, -1 Incorrect (Negative Marking 25%), 0 Unattempted  
**Date:** November 2026  

---

## 1. Complete Test Journey Demonstration

The application delivers an end-to-end, local-safe examination simulation:

```
Test Listing (/app1.5/ayush-npget.php?action=mock_test)
  │
  ├── [Step 1] Select Test: "AIAPGET All India Mega Mock Test - 1"
  │     - 120 Questions | 120 Minutes | 480 Maximum Marks
  │     - 0 Wallet deduction in local dev mode
  │
  ├── [Step 2] CBT Simulation Engine (/quiz/1?mode=exam)
  │     - 120-Minute Synchronized Countdown Timer
  │     - Interactive 120-Question Palette (NTA Color Standards)
  │     - Action Buttons: Save & Next, Clear, Mark for Review
  │
  ├── [Step 3] Answer Submission & Scoring Engine
  │     - Raw Score = (Correct * 4) - (Incorrect * 1)
  │     - Accuracy = (Correct / Attempted) * 100
  │
  └── [Step 4] Score Card & Review (/quiz/1/results & /app1.5/myScore.php)
        - Performance Analytics & All India Projected Percentile
        - Item-by-item question review with classical shloka solutions
```

---

## 2. Test Specifications & Series Overview

### A. AIAPGET Mock Test Series
- **Year Schedules:** Four independent series representing `2027`, `2026`, `2025`, and `2024`.
- **Scheduled vs Active State:**
  - `MOCK TEST-1 (2027)`: Faithfully displays `TEST WILL BE AVAILABLE ON 16 May 2027` with 30 pts unlocking requirement.
  - `AIAPGET ALL INDIA FULL MOCK TEST - 1 (2026)`: Fully accessible test containing 120 verified classical questions covering Brihattrayi and 14 clinical subjects.

### B. NTA Examination Palette (120 Items)
Conforming strictly to National Testing Agency computerized testing norms:
- **Gray Circle:** Question not yet visited.
- **Orange Circle:** Question visited but no option chosen.
- **Green Circle:** Question answered and recorded.
- **Purple Circle:** Question marked for review (unanswered).
- **Purple Circle with Green Dot:** Question answered AND marked for review (evaluated in final score).

### C. UPSC Ayurveda Medical Officer Portal
- Rapid Fire Challenge: 20 clinical questions designed for rapid assessment under 10 minutes.
- Solved UPSC MO examination papers from Central ESIC and State Public Service Commissions.

### D. Previous Year Examination Papers
- Curated repository of 125+ solved entrance papers from 2012 to 2026 spanning NIA Jaipur, BHU Varanasi, IPGT&RA Jamnagar, and national AIAPGET sessions.

---

## 3. Results Calculation & Historical Persistence

When the student submits an exam:
1. The submission is evaluated locally by `database.ts` without making destructive remote API writes.
2. The user's wallet and attempt ledger record the attempt:
   ```json
   {
     "testId": 1,
     "testName": "AIAPGET All India Mega Mock Test - 1",
     "totalQuestions": 120,
     "attempted": 112,
     "correct": 96,
     "incorrect": 16,
     "score": 368,
     "accuracy": "85.7%",
     "date": "14 Nov 2026"
   }
   ```
3. The record is instantly populated in `/app1.5/myScore.php` with DataTable pagination and solution review links.

