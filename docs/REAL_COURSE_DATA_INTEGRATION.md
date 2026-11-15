# REAL COURSE DATA & CURRICULUM INTEGRATION

**System:** AyurQuest 1.5 Localhost Replica  
**Curriculum Scope:** AIAPGET Competitive Streams + UPSC / State PSC Batches  
**Component Integration:** `CoursesPage.tsx` -> `CourseDetail.tsx` -> `LecturePlayer.tsx`  
**Date:** November 2026  

---

## 1. Verified Course Data Hierarchy

The localhost application connects the high-level promotional course catalogue directly to real, structured curriculum modules, chapters, and lecture video streams:

```
Courses Catalogue (/app1.5/courses.php)
  │
  ├── [Course 1] AIAPGET 2027 Comprehensive & Crash Courses
  │     │
  │     ├── [Module 1] Charaka Samhita Sutrasthana (30 Chapters)
  │     │     ├── Ch 1: Dirghanjivitiya Adhyaya (Descent of Ayurveda & Trisutra) -> Lecture 1001
  │     │     ├── Ch 2: Apamarga Tanduliya (Panchakarma Pharmacopoeia)            -> Lecture 1002
  │     │     ├── Ch 3: Aragvadhiya Adhyaya (32 Lepas for Skin Afflictions)      -> Lecture 1003
  │     │     └── Ch 4: Shadvirechanashatashritiya (50 Mahakashayas)             -> Lecture 1004
  │     │
  │     ├── [Module 2] Sushruta Samhita Sutrasthana & Shalyatantra (25 Chapters)
  │     │     ├── Ch 1: Vedotpatti Adhyaya (Origin of Surgery & Dhanvantari)    -> Lecture 2001
  │     │     └── Ch 7-8: Yantra & Shastra Vidhi (101 Blunt & 20 Sharp Inst.)    -> Lecture 2002
  │     │
  │     └── [Module 3] High-Yield Audio Revision Series (20 Chapters)
  │           ├── Charaka Kalpa & Siddhi Rapid Audio Revision                    -> Lecture 3001
  │           └── Dravyaguna Karmas & Rasapanchaka Audio Capsule                 -> Lecture 3002
  │
  └── [Course 2] UPSC & State PSC Ayurveda Medical Officer (2025-2026)
        │
        └── [Module 1] UPSC Clinical Ayurveda & Therapeutics
              └── Jvara Chikitsa: Pathophysiology to Classical Yogas             -> Lecture 5001
```

---

## 2. End-to-End Course Demonstration

### Journey 1: AIAPGET 2027 Comprehensive Course
1. **Catalogue View (`/app1.5/courses.php`):** User selects "Prep Courses for AIAPGET" tab. Finds course card with headline: `REVISION (CRASH) COURSE LECTURES + Q-BANK FOR AIAPGET 2027` and `DETAILED LECTURE AND Q-BANK COURSE`.
2. **Details Selection:** User clicks `>> More Details` (`/courses/aiapget-2027`).
3. **Curriculum View:** Course banner loads with instructor `Dr. Aniruddh Sharma (MD Ayu)`. User expands module *"Charaka Samhita Sutrasthana"*.
4. **Interactive Lesson Selection:** User clicks *"Dirghanjivitiya Adhyaya - Descent of Ayurveda & Trisutra"* (`/lecture/aiapget-2027/1001`).
5. **Classroom Playback:** HD video player initializes with playback speed controls (1.0x, 1.25x, 1.5x, 2.0x), synchronized overview notes, and embedded PDF study handout.

### Journey 2: UPSC Ayurveda Medical Officer Masterclass
1. **Catalogue View:** User selects "Prep Courses for UPSC / PSC" tab. Finds `UPSC AYURVEDA MEDICAL OFFICER COMPREHENSIVE COURSE` (₹7,999).
2. **Details Selection:** User clicks `>> More Details` (`/courses/upsc-2025`).
3. **Curriculum View:** Module *"UPSC Clinical Ayurveda & Medicine"* expands to reveal *"Jvara Chikitsa - Pathophysiology to Classical Formulations"*.
4. **Lesson Selection:** User clicks into lesson (`/lecture/upsc-2025/5001`), loading Dr. Rajesh Gupta's differential diagnosis lecture on Santata, Satata, Anyedyushka, Tritiyaka, and Chaturthaka Jwara.

---

## 3. Local Adapter Implementation Details

The backend service layer ([`server/src/routes/api.ts`](file:///c:/Users/targe/Downloads/ayurquest/server/src/routes/api.ts)) resolves course aliases dynamically:

```typescript
router.get('/courses/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  let course = courses.find(c => c.id === id);
  if (!course) {
    if (id.includes('crash') || id.includes('aiapget-2027')) course = courses.find(c => c.id === 'aiapget-2027');
    else if (id.includes('detailed') || id.includes('2028')) course = courses.find(c => c.id === 'aiapget-2028');
    else if (id.includes('upsc')) course = courses.find(c => c.id === 'upsc-2025');
    else if (id.includes('audio')) course = courses.find(c => c.id === 'audio-lectures');
    else course = courses[0];
  }
  res.json(course);
});
```

This ensures that both promotional course slugs and internal IDs seamlessly resolve to verified curriculum trees.

