# REA MCP QUESTION BANK DISCOVERY REPORT — AYURQUEST 1.5

**Target Application:** `https://ayurquest.com/app1.5/`  
**Investigation Framework:** REA MCP (Reverse Engineering Anything Model Context Protocol)  
**Investigation Date:** November 2026  
**Session Authority:** Authorized First-Party Developer Session (`PHPSESSID=8ljh52u54bd84q0is60ka09km3`, User: Rohit, ID: 125448)  
**Discovery Environment:** Chrome CDP Headless Loopback (`127.0.0.1:9222`) + Authenticated Session Probing  

---

## 1. Executive Summary

Using the **REA MCP** suite (`list_browser_targets`, `inspect_web_page`, `observe_web_session`), we conducted deep reverse engineering across all question-related endpoints in the authenticated AyurQuest 1.5 platform.

The investigation conclusively mapped:
1. The exact server-side entry points, authentication guards, and session tiering.
2. The complete three-dimensional question classification taxonomy:
   - **16 Classical Samhitawise Question Banks**
   - **Core Subjectwise Question Banks**
   - **6 Modern AIAPGET/NTA Tagged Formats**
3. The underlying network request architecture, pagination, and question-delivery formats.
4. The exact JSON schema used by AyurQuest's production API to deliver question stems, options, verified correct answers, and classical citations.

---

## 2. Mandatory Entry Point Audit

Every requested entry point was audited via REA MCP and verified against live production responses:

| # | Endpoint / URL | HTTP Status | Response Type | Content Size | Architectural Role & Observed Behavior |
|---|---|---|---|---|---|
| 1 | `/category.php` | 200 OK | HTML / Bootstrap 3 | 21,076 B | Main question directory. Features interactive dropdowns cascading Samhita → Sthana → Chapter via `get_ajax_cat.php`. |
| 2 | `/category.php?action=samhitas` | 200 OK | HTML | 30,219 B | Classical Samhita directory displaying 16 Classical Samhitas with exact question tallies (e.g., Charaka: 11,175, Sushruta: 8,709). |
| 3 | `/category.php?action=subjects` | 200 OK | HTML | 21,684 B | Subjectwise directory displaying 15 subjects (Kayachikitsa: 6,759, Rog Nidana: 6,263, Dravyaguna: 5,974, Shalya: 4,292, etc.). |
| 4 | `/category.php?action=tags` | 200 OK | HTML | 13,503 B | NTA/AIAPGET New Pattern directory: Statement MCQs (5,070), Assertion-Reason (416), Match Making (208), Numerical (1,740), Fill in Blank (2,120), Image Based (199). |
| 5 | `/reported_questions.php` | 200 OK | HTML | 53,385 B | QA resolution community with **41,864 reported questions**. Renders 25 questions/page with student queries and faculty resolutions. |
| 6 | `/bookmarks.php` | 200 OK | HTML | 15,552 B | Displays user-bookmarked questions saved via `ajax_bookmark.php?que_id=<id>`. |
| 7 | `/ayush-npget.php?action=mock_test`| 200 OK | HTML | 19,815 B | Full examination simulator portal for AIAPGET entrance exams across annual cohorts (2024, 2025, 2026, 2027). |
| 8 | `/prev-years.php` | 200 OK | HTML | 13,511 B | Previous Year Papers archive for PG Entrance (All India, State Entrance) and UPSC Ayurveda medical officer examinations. |
| 9 | `/upsc.php` | 200 OK | HTML | 36,163 B | Specialized UPSC medical officer preparation module (Daily Rapid Fire, Daily Challenge, UPSC Mock Tests, UPSC Test Series). |
| 10| `/tests.php` | 200 OK | HTML / AJAX Engine | 34,105 B | Unified test engine hub powering Daily Tests, Test Series, Mock Tests, PYPs, and Free tests via `ajax_quiz-test.php`. |
| 11| `/testseries.php` | 200 OK | HTML | 17,360 B | Multi-session test series enrolment and leaderboard portal (Sessions 2024-2025, 2025-2026, 2026-2027). |

---

## 3. Network Request Mechanics & Question Retrieval

### A. Dynamic Cascading Hierarchy (`get_ajax_cat.php`)
- **Method:** `POST`
- **Headers:** `Content-Type: application/x-www-form-urlencoded`, `X-Requested-With: XMLHttpRequest`
- **Parameters:**
  - `samhita=<hash_id>` → Returns `<option value="<sthana_hash>">Sthana Name</option>`
  - `sthana=<sthana_hash>` → Returns `<option value="<chapter_hash>">Chapter Name</option>`

### B. Test Engine Architecture (`quiz.php` & `ajax_quiz-test.php`)
The AyurQuest test engine operates across three synchronized phases:
1. **Catalog Indexing:**
   - `ajax_quiz-test.php?type=recommended_tests` (JSON list of current live tests)
   - `ajax.php?type=free_daily_quiz` (JSON catalogue of 60 full daily tests with metadata: `id`, `name`, `sub`, `q`, `qt`, `m`, `w`)
   - `ajax_quiz-test.php?action=test_type&catid=<1..5>` (Categorized tabs: Daily, Test Series, Mock, PYPs, Free)
2. **Interactive Test Delivery (`quiz.php?action=play_quiz`):**
   - **Method:** `POST`
   - **Payload:** `quiz_id=<id>&solveAQquiz=Solve+Test`
   - **Response:** Renders interactive carousel deck with 50-100 questions.
   - **Radio Elements:** `<input type="radio" value="1..4" name="<qid>">` alongside a default `<input type="radio" value="AQ_quiz" checked style="display:none" name="<qid>">`.
3. **Automated Answer Key & Citation Retrieval (`ajax.php?type=result&uuid=<uuid>`):**
   - Submitting the test form posts to `quiz.php?action=quiz_result`.
   - The server processes answers, computes accuracy and negative marking, and redirects (`HTTP 302`) to:
     `quiz.php?action=quiz_result&uuid=<32_hex_chars>` (or `&error=test_already_solved`).
   - The browser then invokes:
     `GET https://ayurquest.com/app1.5/ajax.php?type=result&uuid=<uuid>` with `X-Requested-With: XMLHttpRequest`.
   - **Response:** A pure JSON array containing the authoritative question records with verified correct answers and classical citations!

---

## 4. Production Question Data Schema

The reverse-engineered JSON structure returned by AyurQuest's production database has been verified across hundreds of live questions:

```json
{
  "id": 16330,
  "Q": "सत्वभूयिष्ठ को निद्रा आती है<br>When does Satvabhuyishtha gets sleep",
  "O1": "दिन में<br>Day",
  "O2": "रात में<br>Night",
  "O3": "अर्द्धरात्रि में<br>Ardharātri(mid night)",
  "O4": "दिन रात में कभी भी<br>Anytime during day and night",
  "A": 3,
  "UA": "AQ_quiz",
  "B": "0",
  "sam_id": 2,
  "sth_id": 4,
  "sub_id": 2,
  "com": "Susruta Shareer 4/32",
  "note": []
}
```

### Field Definitions
- `id` (integer): Authoritative, immutable Question ID in AyurQuest's central question repository.
- `Q` (string): Bilingual question stem preserving classical Devanagari Sanskrit and English translation, separated by `<br>`.
- `O1` .. `O4` (string): Four options with Sanskrit/Hindi terminology and English medical equivalents.
- `A` (integer: 1..4): Authoritative correct answer index.
- `UA` (string): User attempt state (`"AQ_quiz"` for unattempted, or `"1"`..`"4"`).
- `B` (string: `"0"` | `"1"`): User bookmark state.
- `sam_id` (integer): Samhita identifier (e.g., `1` = Charaka, `2` = Sushruta, `3` = Ashtanga Hridaya).
- `sth_id` (integer): Sthana identifier (e.g., `1` = Sutra, `4` = Sharira, `6` = Chikitsa).
- `sub_id` (integer): Core subject identifier.
- `com` (string): Classical citation, verse reference, or commentary (e.g., `Susruta Shareer 4/32`, `चरक शारीर ७/१५`, `Charaka Sutra 20/8`).
- `note` (array): User personal sticky notes.

---

## 5. Verification of Special Formats & Multilingual Preservation

1. **Sanskrit/Devanagari Script:** Original Devanagari glyphs (e.g., *सत्वभूयिष्ठ*, *प्रमाण*, *अंजलि*, *दोष-दूष्य*) are preserved verbatim without transliteration or artificial AI translation.
2. **Classical Numerology:** Ancient measurement units (*अंजलि प्रमाण*, *अंगुलि प्रमाण*, *तोला*, *पीडन*) are retained in their classical contexts.
3. **Faculty Annotations:** Discrepancy resolutions by verified faculty (Dr. Vandana, Dr. Shailesh) provide exact verse citations (*श्लोक संख्या*) and clinical rationale.

