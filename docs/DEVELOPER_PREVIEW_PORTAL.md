# AyurQuest 35-Test Series Developer Preview & Cloudflare Tunnel Guide

**Live Public Preview URL:**  
**`https://generators-domains-oclc-analog.trycloudflare.com/preview`**

**Alternative Local URL:**  
`http://localhost:3000/preview`

---

## 1. Overview

This developer preview portal exposes the complete extracted **35-Test Series (4,200 MCQs)** from AyurQuest's production system in a systematic, developer-friendly interface.

All questions are backed by the local SQLite database (`server/data/ayurquest.db`), containing:
* **Canonical Questions:** 5,070 unique questions
* **Total Tests Available:** 95 tests
* **Test Series Questions:** 4,200 questions across 35 structured tests (120 questions per test)

---

## 2. Systematic Series Organization

The 35 tests are categorized into 6 curriculum tracks:

| Series Group | Test Range | Total Tests | Total Questions | Focus & Syllabus |
|---|---|---|---|---|
| **Charaka Samhita Track** | Tests 1–12 (IDs 10001–10012) | 12 Tests | 1,440 MCQs | Sutra (1-30), Nidana, Vimana, Sharira, Indriya, Kalpa, Siddhi, Chikitsa |
| **Sushruta Samhita Track** | Tests 13–22 (IDs 10013–10022) | 10 Tests | 1,200 MCQs | Sutra (1-46), Nidana, Sharira, Kalpa, Chikitsa, Uttara Tantra (1-66) |
| **Ashtanga Hridaya & Sangraha** | Tests 23–26 (IDs 10023–10026) | 4 Tests | 480 MCQs | Vagbhata Sutra, Nidana & Sharira, Chikitsa/Kalpa/Uttara, Sangraha All Sthanas |
| **Laghu Trayi & Compendiums** | Tests 27–29 (IDs 10027–10029) | 3 Tests | 360 MCQs | Kashyapa, Madhava Nidana, Sharngadhara, Bhavaprakasha, Chakradatta, Bhela |
| **Modern Ayurvedic Sciences** | Test 30 (ID 10030) | 1 Test | 120 MCQs | Modern Anatomy, Physiology, Pathology, Forensics, and Pharmacology |
| **AIAPGET Grand Mock Tests** | Tests 31–35 (IDs 10031–10035) | 5 Tests | 600 MCQs | Complete 120-Q Entrance Examination Simulators strictly following NTA pattern |

---

## 3. Developer Features Available on `/preview`

1. **Systematic Series Filtering:**
   * One-click filter pills to isolate specific Samhitas or view all 35 tests simultaneously.
2. **Full Question Deck Viewer:**
   * Displays all 120 questions per test.
   * Renders bilingual stems with Sanskrit/Hindi Devanagari and English translations.
   * Renders 4 options (A, B, C, D) with the verified official answer key highlighted in green (`✓ Verified Answer Key`).
   * Highlights classical verse references (e.g., *चरक सूत्र १०/१८*, *सुश्रुत शारीर ४/३२*).
3. **One-Click JSON Download:**
   * "Download Test JSON" button exports the complete test and all 120 question objects for external integration.
4. **Interactive Schema Modal:**
   * Click "JSON" on any question to view its exact JSON schema and copy it to the clipboard.
5. **Direct REST API Links:**
   * Quick link to `/api/tests/:id` to test backend JSON responses directly in browser or Postman.

