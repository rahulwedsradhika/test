# AyurvedSiddhi — Classical Samhitawise, Subjectwise & Test Series MCQ Portal

An authentic, student-first Ayurvedic question practice and examination platform.

**Live Application URL:** [http://localhost:5167](http://localhost:5167)  
**Backend API URL:** [http://localhost:5168](http://localhost:5168)  
**Total Validated Questions:** **151,830** (57,452 Samhitawise + 57,476 Subjectwise + 36,902 Test Series)

---

## Features

- **🏛️ Classical Samhitawise (17 Samhitas • 57,452 Questions):**
  - **Brihat Trayi (Great Three):** Charaka Samhita (11,175 Qs), Sushruta Samhita (8,709 Qs), Ashtanga Hridaya (6,229 Qs).
  - **Laghutrayi & Classical Samhitas:** Ashtanga Samgraha (2,164 Qs), Kashyapa Samhita (1,024 Qs), Sharangadhara Samhita (1,197 Qs), Madhava Nidana (1,057 Qs), Bhavaprakash (471 Qs), Yog Ratnakar (207 Qs), Harita Samhita (79 Qs), Bhel Samhita (50 Qs), Chakradatt (25 Qs).
  - **Rasashastra & Nighantus:** Bhaishajya Ratnavali (319 Qs), Ras Ratan Samucchaya (423 Qs), Ras Tarangini (120 Qs), Ras Saar (3 Qs).
  - **Comprehensive Question Bank:** Root Miscellaneous (24,200 Qs).

- **📚 Subjectwise Question Bank (38 Academic Disciplines • 57,476 Questions):**
  - Flat, direct practice across all 38 undergraduate and postgraduate Ayurveda subjects.
  - From *Kayachikitsa* (6,759 Qs), *Rog Nidana* (6,263 Qs), *Dravyaguna* (5,975 Qs), *Shalya Tantra* (4,292 Qs), *Panchkarma* (2,976 Qs) down to *Orthopaedics* (8 Qs).
  - Zero cross-subject leakage, verified answer keys, and authentic classical source references.

- **🏆 Real Test Series Module (7 Series • 362 Tests • 36,902 Questions):**
  - **3 Academic Sessions:**
    - **2026–2027:** AIAPGET 2027 (35 Tests), UPPSC 2026 (87 Tests)
    - **2025–2026:** AyurQuest UPSC 2025 (65 Tests), Free AIAPGET 2026 (35 Tests)
    - **2024–2025:** AyurQuest UPSC 2024 (55 Tests), Free AIAPGET 2025 (35 Tests), HPSC 2024–2025 (50 Tests)
  - **Full Examination Lifecycle Simulator:**
    - Test Overview & Instructions with duration, marks (+4/-1 or +3/-1), and palette rules.
    - Full-screen examination view with live countdown timer, auto-warning states, and question palette (1..N).
    - In-progress autosave, answer changing, mark-for-review, and submit confirmation modal.
    - Scorecard (+score/max, accuracy %, speed, answer breakdown) and in-depth classical solutions review with commentary.

---

## Quickstart (One Command Setup)

### Prerequisites
- Node.js (v18+)
- Python (v3.9+) *(optional, for running automated test suites)*

### 1. Install & Unpack
```bash
git clone https://github.com/rahulwedsradhika/test.git
cd test
npm install
```
*(The `postinstall` script automatically verifies and prepares all local SQLite databases).*

### 2. Launch the Portal
```bash
npm start
```
This runs:
- The Backend API Server on `http://127.0.0.1:5168`
- The Vite React Portal on `http://127.0.0.1:5167`

Open your browser at **[http://localhost:5167](http://localhost:5167)**.

---

## Individual Service Commands

```bash
# Start frontend only (Port 5167)
npm run dev

# Start backend API only (Port 5168)
npm run server

# Build production bundle
npm run build

# Run Phase 4 Test Series End-to-End Test Suite
python tests/test_phase4_e2e.py

# Run Phase 3 Subjectwise End-to-End Test Suite
python tests/test_phase3_e2e.py
```

---

## Repository Structure

```
├── data/                                 # Authoritative SQLite databases
│   ├── fresh_samhita_questions.sqlite    # Phase 1: 26,113 questions (Charaka, Sushruta, AH)
│   ├── phase2_fresh_questions.sqlite     # Phase 2: 31,339 questions (14 Samhitas)
│   ├── subjectwise_fresh.sqlite.gz       # Phase 3: 57,476 questions (38 Subjects, GZ archive)
│   ├── testseries_fresh.sqlite           # Phase 4: 362 Tests, 36,902 questions (7 Series)
│   └── portal_sessions.sqlite            # Practice attempts, bookmarks, exam history
├── docs/                                 # Audit evidence, crosswalks & screenshots
│   ├── phase4_reconciliation.json        # 7 series, 362 tests audit ledger
│   ├── phase4_api_evidence.md            # REA discovery and API protocol traces
│   ├── phase3_subjectwise_crosswalk.json # 38 subjects native ID crosswalk
│   ├── phase3_reconciliation.json        # 38 subjects post-fetch audit
│   └── screenshots/                      # Responsive screenshots (Desktop, Tablet, Mobile)
├── server/
│   └── api_server.cjs                    # Unified API server with test series routes
├── src/                                  # React 18 + TailwindCSS + Vite frontend
│   ├── components/                       # Modals, Navbar, Question Palette, Breadcrumbs
│   ├── pages/                            # Home, Test Series, Exam Screen, Results, Subjects
│   ├── api.ts                            # REST API client
│   └── types.ts                          # TypeScript domain interfaces
├── tests/
│   ├── test_phase4_e2e.py                # Phase 4 Test Series E2E verification suite
│   └── test_phase3_e2e.py                # Phase 3 Subjectwise E2E verification suite
└── package.json
```

---

## License & Integrity

All 151,830 questions originate from authenticated source extractions with cryptographic SHA-256 signatures recorded in the audit ledger. No synthetic or AI-generated questions are used.
