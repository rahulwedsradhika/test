# AyurvedSiddhi — Classical & Subjectwise Ayurvedic MCQ Test Portal

An authentic, student-first Ayurvedic question practice and examination platform.

**Live Application URL:** [http://localhost:5167](http://localhost:5167)  
**Backend API URL:** [http://localhost:5168](http://localhost:5168)  
**Total Validated Questions:** **114,928** (57,452 Samhitawise + 57,476 Subjectwise)

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
  - Zero cross-subject leakage, verified answer keys, and authentic source references.

- **🎯 AIAPGET Examination Simulator:**
  - Configurable question count, duration, and shuffle.
  - Interactive question palette, mark-for-review, and real-time timer.
  - Accurate scoring (+4 for correct, -1 for incorrect, 0 for unattempted).
  - Detailed scorecard, review screen, classical commentary citations, and persistent bookmarks.

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

# Run End-to-End Test Suite
python tests/test_phase3_e2e.py
```

---

## Repository Structure

```
├── data/                                 # Authoritative SQLite databases
│   ├── fresh_samhita_questions.sqlite    # Phase 1: 26,113 questions (Charaka, Sushruta, AH)
│   ├── phase2_fresh_questions.sqlite     # Phase 2: 31,339 questions (14 Samhitas)
│   ├── subjectwise_fresh.sqlite.gz       # Phase 3: 57,476 questions (38 Subjects, GZ archive)
│   └── portal_sessions.sqlite            # Practice attempts, bookmarks, history
├── docs/                                 # Audit evidence, crosswalks & screenshots
│   ├── phase3_subjectwise_crosswalk.json # 38 subjects native ID crosswalk
│   ├── phase3_reconciliation.json        # 38 subjects post-fetch audit
│   └── screenshots/                      # Responsive screenshots (Desktop, Tablet, Mobile)
├── server/
│   └── api_server.cjs                    # Unified API server with auto-decompression
├── src/                                  # React 18 + TailwindCSS + Vite frontend
│   ├── components/                       # Modals, Navbar, Question Palette, Breadcrumbs
│   ├── pages/                            # Home, Subject List, Chapter List, Practice, Results
│   ├── api.ts                            # REST API client
│   └── types.ts                          # TypeScript domain interfaces
├── tests/
│   └── test_phase3_e2e.py                # Automated E2E verification test suite
└── package.json
```

---

## License & Integrity

All questions originate from authenticated source extractions with cryptographic SHA-256 signatures recorded in the audit ledger. No synthetic or AI-generated questions are used.
