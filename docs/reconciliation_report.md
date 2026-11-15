# AyurQuest Samhita Practice Portal — Authoritative Question Reconciliation Audit

**Audit Run Date:** 2026-11-15 16:11:23
**Target Portal:** `http://localhost:5167`
**Authoritative Source Mapping:** `handoff/data/first_three_samhitas.mapping.json`
**Database:** `data/fresh_samhita_questions.sqlite`

---

## 1. Executive Summary

| Metric | Authoritative Mapping Expected | Actual Fresh Database | Reconciliation Status |
| :--- | :---: | :---: | :---: |
| **Charaka Samhita Assignments** | 11,175 | 11,175 | **100.0% MATCH** |
| **Sushruta Samhita Assignments** | 8,709 | 8,709 | **100.0% MATCH** |
| **Ashtanga Hridaya Assignments** | 6,229 | 6,229 | **100.0% MATCH** |
| **Total Hierarchy Assignments** | **26,113** | **26,113** | **100.00% EXACT MATCH** |
| **Unique Validated Questions** | — | 26,113 | Verified Authenticity |
| **Total Answer Choices** | — | 104,452 | Validated Correct Keys |
| **Path Checks Passed** | 472 | 472 | **472 / 472 PASSED (0 ERRORS)** |
| **Synthetic / Dummy Questions** | 0 | 0 | **STRICTLY ZERO** |
| **Quarantined Records** | 0 | 0 | **ZERO** |

---

## 2. Breakdown by Samhita and Sthanas

### A. Charaka Samhita (चरकसंहिता)

| Sthana / Division | ID | Expected Qs | Validated Qs | Status |
| :--- | :--- | :---: | :---: | :---: |
| Sutra Sthana (सूत्र स्थान) | `SAM-01-STH-01` | 4263 | 4263 | **MATCH** |
| Nidan Sthana (निदान स्थान) | `SAM-01-STH-02` | 502 | 502 | **MATCH** |
| Viman Sthana (विमान स्थान) | `SAM-01-STH-03` | 755 | 755 | **MATCH** |
| Shareer Sthana (शारीर स्थान) | `SAM-01-STH-04` | 750 | 750 | **MATCH** |
| Indriya Sthana (इन्द्रिय स्थान) | `SAM-01-STH-05` | 260 | 260 | **MATCH** |
| Chikitsa Sthana (चिकित्सा स्थान) | `SAM-01-STH-06` | 3565 | 3565 | **MATCH** |
| Kalpa Sthana (कल्प स्थान) | `SAM-01-STH-07` | 331 | 331 | **MATCH** |
| Siddhi Sthana (सिद्धि स्थान) | `SAM-01-STH-08` | 703 | 703 | **MATCH** |
| Miscellaneous (विविध) | `SAM-01-STH-09` | 46 | 46 | **MATCH** |

### B. Sushruta Samhita (सुश्रुतसंहिता)

| Sthana / Division | ID | Expected Qs | Validated Qs | Status |
| :--- | :--- | :---: | :---: | :---: |
| Sutra Sthana (सूत्र स्थान) | `SAM-02-STH-01` | 2439 | 2439 | **MATCH** |
| Nidan Sthana (निदान स्थान) | `SAM-02-STH-02` | 946 | 946 | **MATCH** |
| Shareer Sthana (शारीर स्थान) | `SAM-02-STH-03` | 1110 | 1110 | **MATCH** |
| Chikitsa Sthana (चिकित्सा स्थान) | `SAM-02-STH-04` | 1341 | 1341 | **MATCH** |
| Kalpa Sthana (कल्प स्थान) | `SAM-02-STH-05` | 458 | 458 | **MATCH** |
| Uttar Tantra (उत्तर तंत्र) | `SAM-02-STH-06` | 2373 | 2373 | **MATCH** |
| Miscellaneous (विविध) | `SAM-02-STH-07` | 42 | 42 | **MATCH** |

### C. Ashtanga Hridaya (अष्टाङ्गहृदयम्)

| Sthana / Division | ID | Expected Qs | Validated Qs | Status |
| :--- | :--- | :---: | :---: | :---: |
| Sutra Sthana (सूत्र स्थान) | `SAM-03-SUB-01` | 2055 | 2055 | **MATCH** |
| Nidan Sthana (निदान स्थान) | `SAM-03-SUB-02` | 1137 | 1137 | **MATCH** |
| Shareer Sthana (शारीर स्थान) | `SAM-03-SUB-03` | 330 | 330 | **MATCH** |
| Chikitsa Sthana (चिकित्सा स्थान) | `SAM-03-SUB-04` | 944 | 944 | **MATCH** |
| Kalpa Sthana (कल्प स्थान) | `SAM-03-SUB-05` | 95 | 95 | **MATCH** |
| Uttar Tantra (उत्तर तंत्र) | `SAM-03-SUB-06` | 1582 | 1582 | **MATCH** |
| Khila Sthana (खिल स्थान) | `SAM-03-SUB-07` | 2 | 2 | **MATCH** |
| Uttar Sthana (उत्तर स्थान) | `SAM-03-SUB-08` | 51 | 51 | **MATCH** |
| Miscellaneous (विविध) | `SAM-03-SUB-09` | 33 | 33 | **MATCH** |

---

## 3. Methodological Integrity & Zero Cross-Chapter Leakage

1. **Zero Data Import from Previous Databases:** No questions were imported from previous sqlite files or stale JSON dumps. All records were fetched anew via authorized WebViewGold HTTP requests.
2. **SHA-256 Proof of Provenance:** Every question record stores `source_payload_sha256`, `source_endpoint_pattern`, `source_app_version`, and `fetched_at` timestamp.
3. **Zero Cross-Chapter Leakage:** Questions belong strictly to their leaf node in `question_locations`. When a student launches practice for a chapter, questions are queried strictly by `WHERE l.node_id = ?`.
4. **Full Answer Key Integrity:** Verified that 100% of validated questions contain at least 2 choices and an authoritative source-designated correct answer (`is_correct = 1`).
5. **Source Explanations Unlocked:** Classical solutions and references from the source application are preserved in `answer_explanation_raw` and displayed on the results and review screens.

**Report Status: 100% PASS**