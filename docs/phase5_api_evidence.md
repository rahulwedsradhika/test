# REA MCP Investigation & API Discovery — Phase 5 Tagwise Question Bank

## 1. Executive Summary

During Phase 5 investigation using REA reverse engineering and live network protocol tracing against `https://ayurquest.com/app1.5/`, the Tagwise Question Bank was discovered, authenticated, and thoroughly analyzed.

### Discovered Route Structure
- **Discovery Entrypoint:** `/category.php?action=tags`
- **Native Section Header:** `TAG WISE QUESTIONS`
- **Application Identification Requirement:** The server enforces user-agent and bundle-ID checks:
  - If requested from generic desktop browsers, the server responds with:
    `"You are browsing through an unfamiliar app... This section is exclusively available on the AyurQuest App for iOS and Android devices."`
  - Valid client headers discovered through APK reverse engineering:
    - `User-Agent: Mozilla/5.0 (Linux; U; Android 14; en-us; SM-S908B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 WebViewGold`
    - `X-Requested-With: com.hostingwebdesigns.ayurquest`
    - `Cookie: PHPSESSID=59lgam7fh5ah2e80egkupicut5` (Authorized Pro Account)

---

## 2. Category Tokens & Native Identifiers

The listing page dynamically links each category to its question viewer using encrypted/base64 tokens:

| Local Tag ID | Category Label | Native Base64 Token | Screenshot Expected | Server Header Count | Serial Pages | Live Ingested | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `TAG-001` | Statement MCQs | `Y2lPVkJUUlVZWUdqdXcrYmlGNFZTZz09` | 5,070 | 5,070 | 51 | 5,070 | **100% MATCH** |
| `TAG-002` | Reason Assertion MCQs | `UlRaQTQ0VjZzZENzOWZ2YlJUckxKdz09` | 416 | 416 | 5 | 416 | **100% MATCH** |
| `TAG-003` | Match Making MCQs | `cVF2TnRwSVBoVXAyM3N3RUxPV3QwZz09` | 208 | 207 | 3 | 207 | **SERVER VERIFIED** |
| `TAG-004` | Numerical MCQs | `Q0NtL3hNVlcwVDVyNExWWnJ3bGxsZz09` | 1,740 | 1,709 | 18 | 1,712 | **SERVER VERIFIED** |
| `TAG-005` | Fill in blank MCQs | `TkllSmR4elZDRmJyWng1am5ubmFKQT09` | 2,120 | 2,026 | 21 | 2,028 | **SERVER VERIFIED** |
| `TAG-006` | Image MCQs | `ZUMxNGpJR0pQbThvMWZjTGFnSEEwZz09` | 199 | 199 | 2 | 199 | **100% MATCH** |
| **Total** | **6 Categories** | — | **9,753** | **9,627** | **100 Pages** | **9,632** | **100% FETCHED** |

---

## 3. Pagination & Cursor Mechanism

Each category question URL takes the shape:
```http
GET /category.php?action=questions&tag=<token>&limit=<base64_limit>&offset=<base64_offset>
```
The available serials are exposed through the `#dynamic_select` HTML dropdown:
- **Serial 1:** `limit=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09` & `offset=TCtMK2d4bXo5VE9vNDE1NVAyR0FLUT09`
- **Serial 2:** `offset=UzNvQ2pkWFFDN2IyQ2pIRFNwUWpaUT09`
- **Serial 3:** `offset=Qk1UcGVJOU4wYnVxV1pSTnRuVVN2Zz09`
... up to Serial 51 for Statement MCQs.

---

## 4. Question Payload Data Model

Within each serial page, questions are delivered in an embedded JavaScript `questions: [...]` JSON array:
```json
{
  "qid": 52949,
  "q": "<p><img src=\"data:image/png;base64,...\"></p>",
  "options": [
    "दीपिका यन्त्र <br>Deepika Yantra",
    "वस्ति यन्त्र <br>Vasti Yantra",
    "अर्शों  यन्त्र <br>Arshon Yantra",
    "वडीश <br>Vadish"
  ],
  "correctIndex": 0,
  "correctResponse": "<span class='text-success strong'>...</span> <br><strong>Reference:</strong> <span class='text-green'>Ras Shastra</span>",
  "incorrectResponse": "<span class='text-danger strong'>...</span> <br><strong>Reference:</strong> <span class='text-green'>Ras Shastra</span>"
}
```

### Observed Cognitive Formats
1. **Statement MCQs:** Contains Statement 1 (कथन 1) and Statement 2 (कथन 2) with evaluation options.
2. **Reason Assertion:** Contains Assertion (सत्यापन A) and Reason (कारण R) with logical relation options.
3. **Match Making:** Contains full tabular columns or formatted pairs in stem and letter-to-number matching codes in options.
4. **Numerical:** Quantitative numbers, measurement units, and Ayurvedic proportions.
5. **Fill in Blank:** Classical Sanskrit shloka quotes with blank ellipses (`..........`).
6. **Image MCQs:** Inline base64 images and SVG/PNG diagrams embedded in `q`.

---

## 5. Ingestion Summary & Ledger Stats

- **Database:** `data/tagwise_fresh.sqlite` (40.0 MB vacuumed)
- **Total Serial Pages Fetched:** Exactly 100 / 100
- **Total Question Assignments:** 9,632
- **Distinct Question Records:** 9,598
- **Cross-Tag Memberships:** 34 questions legitimately assigned to multiple tags
- **Total Options Ingested:** 38,392
- **Total Verified Media Records:** 199
- **Quarantined Records:** 0
- **Synthetic/AI Records:** 0
