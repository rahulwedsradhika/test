# Content Architecture & Data Model

## 1. Overview & Content Philosophy

AyurQuest 1.5 is structured around authentic classical Ayurvedic pedagogy, designed specifically for candidates targeting:
- **AIAPGET** (All India AYUSH Post Graduate Entrance Test - MD/MS Ayurveda)
- **UPSC Medical Officer** (Ayurveda)
- **State PSC Examinations** (UPPSC, HPPSC, MPPSC, BPSC, etc.)

Content is organized systematically across two primary navigational axes:
1. **Curriculum Course Series:** Structured video lecture courses with progression milestones, syllabus coverage, and companion reading materials.
2. **Classical Samhita Question Bank:** Comprehensive, chapter-wise MCQs categorized by classical treatise, section (*Sthana*), and chapter (*Adhyaya*).

---

## 2. Learning Content Hierarchy

The verified content structure follows this hierarchical relationship:

```
Course Program
└── Module (Samhita or Subject)
    └── Lecture
        ├── Video Stream (Vimeo Event Embed) / Audio Stream
        ├── Metadata (Speaker, Duration, Chapter, Sthana)
        ├── Companion Notes (PDF downloads)
        └── Associated Question Bank Drill
```

### Classical Samhita Taxonomy

```
Samhita (e.g. Charaka Samhita)
└── Sthana (e.g. Sutra Sthana - 30 Chapters)
    └── Chapter / Adhyaya (e.g. Ch 1: Dirghanjivitiya)
        └── Questions (MCQs with 4 Options, Key, Sanskrit Commentary)
```

---

## 3. The 16 Classical Samhitas Catalogue

Production AyurQuest provides targeted question banks across 16 classical Ayurveda texts:

| ID | Samhita Name | Classical Author | Major Sthanas | Verified Questions |
|---|---|---|---|---|
| 1 | **Charaka Samhita** | Maharshi Agnivesha / Charaka | Sutra, Nidana, Vimana, Sharira, Indriya, Chikitsa, Kalpa, Siddhi | 1,250+ |
| 2 | **Sushruta Samhita** | Acharya Sushruta | Sutra, Nidana, Sharira, Chikitsa, Kalpa, Uttara Tantra | 980+ |
| 3 | **Ashtanga Hridaya** | Acharya Vagbhata | Sutra, Sharira, Nidana, Chikitsa, Kalpa, Uttara | 720+ |
| 4 | **Ashtanga Samgraha** | Vriddha Vagbhata | Sutra, Sharira, Nidana, Chikitsa, Kalpa, Uttara | 450+ |
| 5 | **Madhava Nidana** | Madhavakara | Rogavinishchaya (Vol 1 & 2) | 380+ |
| 6 | **Sharngadhara Samhita** | Acharya Sharngadhara | Prathama, Madhyama, Uttara Khanda | 320+ |
| 7 | **Bhavaprakasha** | Bhavamishra | Purva, Madhyama, Uttara Khanda | 510+ |
| 8 | **Kashyapa Samhita** | Maharshi Kashyapa | Kaumarbhritya & Sutra, Chikitsa | 290+ |
| 9 | **Bhela Samhita** | Acharya Bhela | Sutra, Nidana, Sharira, Chikitsa | 180+ |
| 10 | **Harita Samhita** | Maharshi Harita | Prathama to Shashta Sthana | 160+ |
| 11 | **Chakradatta** | Chakrapanidatta | Systemic Chikitsa & Bhaishajya | 220+ |
| 12 | **Rasa Tarangini** | Sadananda Sharma | Rasa Shastra, Parada, Maharasa, Uparasa | 340+ |
| 13 | **Rasa Ratna Samucchaya** | Rasa Vagbhata | Rasa Yantras, Mushas, Puta, Mineral Alchemy | 280+ |
| 14 | **Dravyaguna Vijnana** | Classical Pharmacopoeia | Namarupa, Guna, Karma, Yoga, Rogaghnata | 650+ |
| 15 | **Bhaishajya Kalpana** | Pharmaceutical Principles | Panchavidha Kashaya, Sneha Kalpana, Asava/Arishta | 410+ |
| 16 | **Kaumarbhritya & Stri Roga** | Obstetrics & Pediatrics | Prasuti Tantra, Jataharini, Dhatri, Stanya | 350+ |

---

## 4. Question Data Model Schema

Every question entity in AyurQuest adheres to the following verified schema:

```typescript
export interface Question {
  id: number;              // Unique integer ID (e.g. 101)
  Q: string;               // Question stem text
  O1: string;              // Option A
  O2: string;              // Option B
  O3: string;              // Option C
  O4: string;              // Option D
  A: number;               // Correct Answer key (1, 2, 3, or 4)
  UA?: number | string;    // Student's previously attempted answer or 'AQ_quiz'
  B: string;               // Bookmark status: '0' = not bookmarked, '1' = bookmarked
  sam_id: number;          // Foreign key: Samhita ID
  sam: string;             // Samhita name string
  sth_id: number;          // Foreign key: Sthana ID
  sth: string;             // Sthana name string
  sub_id: number;          // Subject ID
  sub: string;             // Subject name string
  com: string;             // Authentic commentary, classical shloka reference, and rationale
  note?: { notes: string }[]; // Array of student sticky notes attached to question
}
```

### Sanitized Example Entity:
```json
{
  "id": 101,
  "Q": "According to Acharya Charaka, how many chapters are included in Sutra Sthana of Charaka Samhita?",
  "O1": "28 chapters",
  "O2": "30 chapters",
  "O3": "32 chapters",
  "O4": "36 chapters",
  "A": 2,
  "UA": "AQ_quiz",
  "B": "0",
  "sam_id": 1,
  "sam": "Charaka Samhita",
  "sth_id": 101,
  "sth": "Sutra Sthana",
  "sub_id": 1,
  "sub": "Maulik Siddhanta",
  "com": "Charaka Samhita Sutrasthana contains 30 chapters divided into 7 Chatushkas (Bheshaja, Svastha, Nirdesha, Kalpana, Roga, Yojana, and Annapana Chatushka) plus 2 concluding chapters (Samgraha Dwaya)."
}
```

---

## 5. Assessment Models: Practice Mode vs Exam Simulation

The AyurQuest engine distinguishes two fundamental test modes:

1. **Practice Mode (Formative Learning):**
   - Immediate feedback upon clicking an option.
   - Enhanced audio chimes for correct and wrong responses.
   - Comprehensive commentary and textual references displayed immediately below question.
   - Non-timed, permissive navigation, instant bookmarking, and sticky note additions.

2. **Exam Mode (Summative Simulation):**
   - Strictly timed countdown timer based on `qt` (e.g. 15 or 90 minutes).
   - Question Palette in right sidebar with color-coded states:
     - Green: Answered
     - Purple: Marked for Review
     - Light Gray: Unanswered
     - Blue Border: Current Question
   - Negative marking applied per wrong answer (`-0.25` or `-1.0`).
   - Summary scorecard generated upon test submission with accuracy percentage, score breakdown, and wallet point incentives.

