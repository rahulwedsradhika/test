# Phase 2 Source API Evidence & Endpoint Investigation

**Authoritative Documentation for AyurQuest WebViewGold Endpoints (Phase 2)**  
*Date:* November 15, 2026  
*Status:* Verified with live production endpoints  
*Source Scope:* 14 Categories (`SAM-04` through `SAM-17`), 144 Leaf Targets, 33,009 Displayed Question Assignments  

---

## 1. Executive Summary & Verification

In accordance with Phase 2 specifications:
- **Phase 1 Protected Scope:** `SAM-01` Charaka Samhita (11,175 Qs), `SAM-02` Sushruta Samhita (8,709 Qs), and `SAM-03` Ashtanga Hridaya (6,229 Qs) remain completely untouched in `data/fresh_samhita_questions.sqlite`.
- **Phase 2 Ingestion Database:** Created as an isolated database `data/phase2_fresh_questions.sqlite` with strict foreign key constraints and schema adherence (`mapping_nodes`, `fetch_runs`, `fetch_pages`, `questions`, `question_options`, `question_leaf_assignments`, `ingestion_issues`).
- **Endpoint Structure:** Verified across all 14 categories using authorized WebViewGold HTTP headers and active session tokens.

---

## 2. Source Application & Transport Profile

- **App Package:** `com.hostingwebdesigns.ayurquest` (AyurQuest Android WebViewGold v1.6)
- **User-Agent:** `Mozilla/5.0 (Linux; U; Android 14; en-us; SM-S908B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 WebViewGold`
- **Required Headers:**
  - `X-Requested-With: com.hostingwebdesigns.ayurquest`
  - `Referer: https://ayurquest.com/app1.5/category.php`
  - `Cookie: [REDACTED_SECURE_AUTH_COOKIE]`
- **Authentication Source:** `production_dump/auth_session.json`

---

## 3. Endpoint Taxonomy & Navigation Types

The 14 Phase 2 categories utilize three distinct navigation and endpoint flows:

### Category Flow Type A: Hierarchical 3-Level with Chapter Division (SAM-04 Ashtanga Samgraha)
1. **Sthana List Endpoint:**
   - **Method:** `POST https://ayurquest.com/app1.5/ajax_category_question.php`
   - **Payload:** `samhita_id=TkllSmR4elZDRmJyWng1am5ubmFKQT09`
   - **Result:** Returns 8 Sthanas (Sutra 229 Qs, Nidan 467 Qs, Shareer 524 Qs, Chikitsa 95 Qs, Kalpa 2 Qs, Uttar Tantra 813 Qs, Uttar Sthana 8 Qs, Miscellaneous 26 Qs; total = 2,164 Qs).
2. **Chapter List Endpoint:**
   - **Method:** `POST https://ayurquest.com/app1.5/ajax_category_question.php`
   - **Payload:** `samhita_id2=TkllSmR4elZDRmJyWng1am5ubmFKQT09&sthana_id=<STHANA_TOKEN>`
   - **Result:** Returns the exact chapters for that Sthana. Across all 8 Sthanas, exactly 122 chapters were retrieved, matching the 122 leaf targets of `SAM-04` with 100% question count congruence.
3. **Question Acquisition Endpoint:**
   - **Method:** `GET https://ayurquest.com/app1.5/category.php?action=questions&samhita=TkllSmR4elZDRmJyWng1am5ubmFKQT09&sthana=<STHANA_TOKEN>&chapter=<CHAPTER_TOKEN>`
   - **Pagination:** `<select id="dynamic_select">` (multi-serial pagination when questions exceed 100).

---

### Category Flow Type B: Sthana-Based with Aggregated Chapters (SAM-10 Kashyapa Samhita)
- **Mapping Specification:** `SAM-10` is mapped as `hierarchical_to_sthana_then_direct_questions` (9 named Sthanas + 1 Miscellaneous leaf).
- **Source Architecture Discovery:** In the live source backend, `ajax_category_question.php` with `samhita_id=OFo4d1lRcTRMT1FrZlM1blEwSmVyQT09` lists the 10 Sthanas. Querying each Sthana returns sub-chapters whose questions sum to the exact Sthana count:
  - `SAM-10-SUB-01` Sutra Sthana: 13 chapters, sum = 259 Qs (matches mapping 259 Qs).
  - `SAM-10-SUB-02` Nidan Sthana: 1 chapter, sum = 1 Q (matches mapping 1 Q).
  - `SAM-10-SUB-03` Vimana Sthana: 3 chapters, sum = 12 Qs (matches mapping 12 Qs).
  - `SAM-10-SUB-04` Shareer Sthana: 6 chapters, sum = 77 Qs (matches mapping 77 Qs).
  - `SAM-10-SUB-05` Indriya Sthana: 2 chapters, sum = 19 Qs (matches mapping 19 Qs).
  - `SAM-10-SUB-06` Chikitsa Sthana: 19 chapters, sum = 154 Qs (matches mapping 154 Qs).
  - `SAM-10-SUB-07` Kalpa Sthana: 12 chapters, sum = 156 Qs (matches mapping 156 Qs).
  - `SAM-10-SUB-08` Siddhi Sthana: 9 chapters, sum = 52 Qs (matches mapping 52 Qs).
  - `SAM-10-SUB-09` Khila Sthana: 23 chapters, sum = 274 Qs (matches mapping 274 Qs).
  - `SAM-10-MISC` Miscellaneous: 2 chapters (Miscellaneous 19 Qs + Chapter 4 1 Q), sum = 20 Qs!
- **Resolution of `??` Display Uncertainty:** The Kashyapa Miscellaneous leaf, displayed as `??` in the app screenshot, was resolved through source evidence to contain exactly 20 questions, completing the exact 1,024 parent total (1,004 + 20 = 1,024).
- **Leaf Ingestion:** Questions from the constituent chapters are fetched and assigned directly to their parent Sthana leaf ID (`SAM-10-SUB-01` to `SAM-10-SUB-09`, `SAM-10-MISC`), preserving original source provenance in `question_leaf_assignments`.

---

### Category Flow Type C: Direct Root Question Acquisition (12 Categories)
The 12 direct categories have no Sthana or chapter hierarchy. All questions are acquired directly via `category.php?action=questions&samhita=<NATIVE_TOKEN>`:

| Mapping ID | Category Name | Native Token | Expected Qs | Page 1 Qs | Total Serials |
|---|---|---|---|---|---|
| `SAM-05` | Chakradatt Samhita | `cVF2TnRwSVBoVXAyM3N3RUxPV3QwZz09` | 25 | 25 | 1 |
| `SAM-06` | Madhava Nidana | `UlRaQTQ0VjZzZENzOWZ2YlJUckxKdz09` | 1,057 | 100 | 11 |
| `SAM-07` | Yog Ratnakar | `Y2lPVkJUUlVZWUdqdXcrYmlGNFZTZz09` | 207 | 100 | 3 |
| `SAM-08` | Sharangadhara Samhita | `VzMvc0FSMysyZHJtUGtJOUV6bmxEUT09` | 1,197 | 100 | 12 |
| `SAM-09` | Bhavaprakash Samhita | `ZUMxNGpJR0pQbThvMWZjTGFnSEEwZz09` | 471 | 100 | 5 |
| `SAM-11` | Harita Samhita | `eDl6cjlpbHJLc3ludW0xZklKTDlBdz09` | 79 | 79 | 1 |
| `SAM-12` | Bhel Samhita | `NlFJTkYzK2FycTlLekFrcGJxUnNBZz09` | 50 | 50 | 1 |
| `SAM-13` | Bhaishajya Ratnavali | `Vm8zSTR2N0JYWUE4ZC8zQmNnSGFUZz09` | 319 | 100 | 4 |
| `SAM-14` | Ras Ratan Sammuchaya | `aTJ2eUpIb0lFb1ZCUEs4bWtBWGhxZz09` | 423 | 100 | 5 |
| `SAM-15` | Ras Tarangini | `MlRpVWM5RHZ4aHpqMlFuT0d4aGpqQT09` | 120 | 100 | 2 |
| `SAM-16` | Ras Saar Samgraha | `dVIwVU92dTZ3VXRuUTdnTzZySkFvQT09` | 3 | 3 | 1 |
| `SAM-17` | Miscellaneous (Root) | `TCtMK2d4bXo5VE9vNDE1NVAyR0FLUT09` | 25,870 | 100 | 242 |

---

## 4. Question Payload Structure & Field Decoding

Every question retrieved from the source HTML is embedded in a script block starting with `questions: [ ... ]`.
Sample validated decoded object:
```json
{
  "qid": "50438",
  "q": "निम्न में से किस दोष की प्रधानता होने पर लेहन कर्म निर्दिष्ट है ? ( काश्यप )<br>Lehana is indicated in predominance of which dosha? (Kashyapa)",
  "options": [
    "वात <br>Vāta",
    "पित्त<br>Pitta",
    "वात - पित्त<br>Vāta - Pitta",
    "त्रिदोष <br>Tridosha"
  ],
  "correctIndex": 2,
  "correctResponse": "<strong>Reference:</strong> Ka. Sam. Lehana Adhyaya<br><strong>Comments: </strong>...",
  "userSelected": -1
}
```

Field Mappings:
- `qid`: Stored as `source_question_id`, unique per namespace `ayurquest_v1.6_production`.
- `q`: Stored as `stem_raw`, preserving Hindi Devanagari and English bilingual text.
- `options`: Stored as relational rows in `question_options` with position 0..N, preserving 1-based order in student UI.
- `correctIndex`: Evaluated to set `is_correct = 1` for the matching option, ensuring verified answer keys.
- `correctResponse`: Extracted using regex into explanation reference and comments.

