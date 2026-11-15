# AYURQUEST SAMHITA API EVIDENCE & REVERSE ENGINEERING AUDIT

## 1. REA MCP Tool & Artifact Audit
- **Analyzed Artifact:** `AyurQuest.apk` (SHA-256 verified)
- **Target App ID:** `com.hostingwebdesigns.ayurquest`
- **Architecture:** Android WebViewGold Web-Wrapper (Version 1.6)
- **Host Endpoint:** `https://ayurquest.com/app1.5/`
- **Authorized Session:** User Rohit (`ID: 125448`, Phone: `+917006923314`), active session tokens stored in `production_dump/auth_session.json`.

---

## 2. Source Application Flow & Observed Endpoints

```
[Home Dashboard]
       │
       ▼
[Samhitawise Category Directory]
 URL: https://ayurquest.com/app1.5/category.php?action=samhitas
 Returns: 16 Classical Ayurvedic Samhitas with verified question tallies
       │
       ▼
[Cascading Sthana Enumeration]
 Endpoint: POST https://ayurquest.com/app1.5/ajax_category_question.php
 Headers: X-Requested-With: XMLHttpRequest, Referer: https://ayurquest.com/app1.5/category.php
 Payload: samhita_id=<samhita_token>&q_from=chapter
 Returns: HTML anchor tags: <a href="#" class="sthana" data-samhita="..." data-sthana="..."><strong>Sthana Name</strong><br>Total Questions: X</a>
       │
       ▼
[Cascading Chapter Enumeration]
 Endpoint: POST https://ayurquest.com/app1.5/ajax_category_question.php
 Payload: samhita_id2=<samhita_token>&sthana_id=<sthana_token>
 Returns: HTML anchor tags: <a href="?action=questions&samhita=...&sthana=...&chapter=..."><strong>Chapter Name</strong><br>Total Questions: X</a>
       │
       ▼
[Question Delivery & CatQuiz Initialization]
 Endpoint: GET https://ayurquest.com/app1.5/category.php?action=questions&samhita=<sam>&sthana=<sth>&chapter=<ch>&limit=<lim>&offset=<off>
 Returns: Complete HTML document initializing jQueryQuiz (`student.jquery.catquiz.js`) with embedded JSON questions payload:
 $('#quiz').quiz({
   counterFormat: 'Question %current of %total',
   questions: [ ... ]
 });
```

---

## 3. Pagination Architecture
- **Page Size:** 100 questions per serial batch.
- **Batch Selector:** Rendered as `<select id="dynamic_select" class="btn btn-xs bg-aq">`.
- **Batch URLs:**
  - Serial 1 (Questions 1–100): `limit=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09&offset=TCtMK2d4bXo5VE9vNDE1NVAyR0FLUT09`
  - Serial 2 (Questions 101–200): `limit=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09&offset=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09`
  - Serial 3 (Questions 201–300): `limit=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09&offset=...`
- When a chapter has $\le 100$ questions (e.g. Charaka Sutra Ch 2 with 90 Qs), all questions are delivered in the primary response without requiring pagination.

---

## 4. Production Question Data Schema
Each question in the `questions: [...]` array conforms to:
```json
{
  "q": "Question stem text with Hindi, Sanskrit, and English formatting",
  "qid": 50395,
  "b": "0",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "correctIndex": 0,
  "correctResponse": "<span class='text-success strong'><i class='fa fa-check-circle'></i> Your answer is Correct!</span><br><strong>Reference:</strong> <span class=\"text-maroon\">Charaka Samhita</span> - <span class=\"text-navy\">Sutra Sthana</span> - <span class=\"text-green\">Chapter 2</span><br><strong>Comments: </strong>...",
  "incorrectResponse": "<span class='text-danger strong'><i class='fa fa-times-circle'></i> Wrong! Right answer is (A)...</span>"
}
```

---

## 5. Live Transaction Proof
- **Target Node:** `SAM-01-STH-01-CH-02` (Charaka Samhita $\to$ Sutra Sthana $\to$ Chapter 2, Apamarga Tanduliya)
- **Expected Questions (Mapping):** 90
- **Live HTTP GET Request:** `https://ayurquest.com/app1.5/category.php?action=questions&samhita=YVlOYnBYV05IcjFsL0UxeDFHZDZwQT09&sthana=YVlOYnBYV05IcjFsL0UxeDFHZDZwQT09&chapter=Q0NtL3hNVlcwVDVyNExWWnJ3bGxsZz09`
- **Live HTTP Status:** 200 OK (Content-Length: 198,313 bytes)
- **Extracted Validated Questions:** **90** (100% exact match to expected count)
- **First Question Sample:** QID `50395`, Correct Option Index `0`, 4 options present, verified Sanskrit shloka citation.

