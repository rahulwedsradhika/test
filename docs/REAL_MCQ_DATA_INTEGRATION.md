# REAL MCQ QUESTION DATA & EXAMINATION INTERACTIONS

**Origin Routes:**  
- `/app1.5/category.php?action=samhitas` (Samhitawise MCQs)  
- `/app1.5/category.php?action=subjects` (Subjectwise MCQs)  
- `/app1.5/category.php?action=tags` (New Pattern Tagwise MCQs)  
- `/quiz/practice` (Interactive Practice Engine)  
**Database Taxonomy:** 57,375 Total Classical Questions across 16 Samhitas & 9 Subjects  
**Date:** November 2026  

---

## 1. Verified Question Data Structures

Every question in the AyurQuest 1.5 system is modeled with complete classical attribution:

```typescript
export interface Question {
  id: number;
  Q: string;           // Question Text (Hindi / Sanskrit / English)
  O1: string;          // Option (A)
  O2: string;          // Option (B)
  O3: string;          // Option (C)
  O4: string;          // Option (D)
  A: number;           // Correct Answer Index (1, 2, 3, 4)
  sam_id: number;      // Samhita Reference ID
  sam: string;         // Samhita Classical Name (e.g. "Charaka Samhita")
  sth_id: number;      // Sthana Reference ID (e.g. "Sutra Sthana")
  sth: string;         // Sthana Name
  sub_id: number;      // Core Subject ID
  sub: string;         // Subject Name (e.g. "Dravyaguna Vijnana")
  com: string;         // Authentic Classical Commentary & Shloka Citation
  tag?: string;        // "statement" | "reason_assertion" | "numerical" | "match_making" | "image"
}
```

---

## 2. Real Question Workflow Demonstrations

### Demonstration 1: Samhitawise Question Workflow
1. **Selection:** Student opens `/app1.5/category.php?action=samhitas` and clicks **Charaka Samhita** (11,175 questions).
2. **Practice Launch:** Navigates to `/quiz/practice?sam_id=1`.
3. **Question Loaded:**
   - **Q:** *"According to Acharya Charaka, how many chapters are included in Sutra Sthana of Charaka Samhita?"*
   - **Options:** (A) 28 chapters | (B) 30 chapters | (C) 32 chapters | (D) 36 chapters
4. **Answer Selection:** Student selects **(B) 30 chapters**.
5. **Real-Time Evaluation:** Option turns emerald green. Audio chime plays.
6. **Classical Commentary:** Injects:
   > *"Charaka Samhita Sutrasthana contains exactly 30 chapters divided into 7 Chatushkas (Bheshaja, Svastha, Nirdesha, Kalpana, Roga, Yojana, and Annapana Chatushka) plus 2 concluding chapters (Samgraha Dwaya)."*

### Demonstration 2: Subjectwise Question Workflow
1. **Selection:** Student opens `/app1.5/category.php?action=subjects` and clicks **Shalya Tantra** (4,292 questions).
2. **Practice Launch:** Navigates to `/quiz/practice?sub_id=2`.
3. **Question Loaded:**
   - **Q:** *"According to Sushruta, what is the total number of Shastras (sharp surgical instruments)?"*
   - **Options:** (A) 14 | (B) 20 | (C) 24 | (D) 101
4. **Answer Selection:** Student selects **(B) 20**.
5. **Classical Commentary:** Injects:
   > *"Acharya Sushruta describes 101 blunt instruments (Yantras) and 20 sharp surgical instruments (Shastras) in Sutrasthana Chapter 8 (Shastravacharaniya Adhyaya)."*

### Demonstration 3: New Pattern Tagwise Question Workflow
1. **Selection:** Student opens `/app1.5/category.php?action=tags` and selects **Reason Assertion MCQs** (416 questions).
2. **Question Loaded:**
   - **Assertion (A):** *Abhyanga is contraindicated in Taruna Jwara (Acute Fever).*
   - **Reason (R):** *Oil application in Ama stage obstructs the Srotas and exacerbates Doshas.*
   - **Options:**
     - (A) Both (A) and (R) are true and (R) is the correct explanation of (A).
     - (B) Both (A) and (R) are true but (R) is not the correct explanation.
     - (C) (A) is true but (R) is false.
     - (D) Both (A) and (R) are false.
3. **Answer Selection:** Student selects **(A)**.
4. **Classical Citation:** Injects:
   > *"आमे न दीयते तैलं ज्वरिते न कदाचन। (चरक चि. ३) In acute fever with Ama dosha, unctuous therapy blocks the channels and impairs digestion."*

---

## 3. Discrepancy Reporting & Bookmark Integration

- **Bookmark Persistence:** Clicking the bookmark ribbon toggles the item's state via `POST /ajax_bookmark.php`, recording the question into the user's 3,000-capacity persistent revision library.
- **Sticky Notes:** Clicking `Notes` opens an inline annotation modal saving personalized study notes via `POST /api/notes`.
- **Discrepancy Reporting:** Clicking `Report` submits feedback directly to the faculty review desk via `POST /ajax_report_question.php`.

