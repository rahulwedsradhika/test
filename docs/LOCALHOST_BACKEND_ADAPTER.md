# LOCALHOST BACKEND ADAPTER ARCHITECTURE & SECURITY SPECIFICATION

**Server Process:** Node.js Express Server (`http://localhost:5000`)  
**Source Implementation:** `server/src/server.ts`, `server/src/routes/ajaxAdapter.ts`, `server/src/routes/api.ts`  
**Data Storage:** `server/src/data/database.ts` (Local In-Memory State)  
**Security Boundary:** Zero Credential Leaks, Safe Sandboxed Mocking  
**Date:** November 2026  

---

## 1. Architectural Mission

The Localhost Backend Adapter acts as an authorized integration bridge between the public frontend application and protected educational resources. It fulfills two essential mandates:
1. **100% Legacy Fidelity:** Supports the original PHP application's jQuery AJAX endpoints (`ajax_category_mcq.php`, `ajax_bookmark.php`, `ajax_daily_mcq.php`, etc.) returning authentic HTML snippets and JSON structures.
2. **Modern SPA Integration:** Supplies clean, typed RESTful JSON APIs (`/api/courses`, `/api/quizzes`, `/api/questions`, `/api/wallet`) consumed by modern React components.

```
+--------------------------------------------------------------------------+
|                         Vite Client (:3000)                              |
|   React SPA  ---(REST)--> /api/*               ---(AJAX)--> ajax_*.php   |
+-----------------------------+------------------------------+-------------+
                              |                              |
                    [Vite Reverse Proxy]           [Vite Reverse Proxy]
                              |                              |
                              +--------------+---------------+
                                             |
                                             v
+--------------------------------------------------------------------------+
|                     Express Backend Adapter (:5000)                      |
|                                                                          |
|   +----------------------------+    +--------------------------------+   |
|   |   apiRouter (/api/*)       |    |   ajaxAdapter (legacy PHP)     |   |
|   |   - /courses, /courses/:id |    |   - ajax_category_mcq.php      |   |
|   |   - /quizzes, /quizzes/:id |    |   - ajax_bookmark.php          |   |
|   |   - /questions             |    |   - ajax_daily_mcq.php         |   |
|   |   - /wallet, /notes        |    |   - ajax_quiz.php              |   |
|   +--------------+-------------+    +---------------+----------------+   |
|                  |                                  |                    |
|                  +----------------+-----------------+                    |
|                                   |                                      |
|                                   v                                      |
|                 +-----------------------------------+                    |
|                 |    Local In-Memory Database       |                    |
|                 |    (database.ts & static seed)    |                    |
|                 +-----------------------------------+                    |
+--------------------------------------------------------------------------+
```

---

## 2. Security & Compliance Principles

- **Zero Credential Exposure:** No production database passwords, JWT tokens, SMS gateway API keys, or private user session tokens are exposed to client-side bundles.
- **Controlled Upstream Allowlist:** The adapter operates strictly as a self-contained provider; it does not function as an open or unrestricted HTTP proxy.
- **CORS Safety:** Configured strictly to allow loopback origins (`http://localhost:3000`) with credentials support.
- **Safe State Isolation:** User progress, test attempts, wallet deductions, and bookmarks are written to a localized in-memory state engine (`database.ts`), eliminating risks of accidental modification of live production student records.

---

## 3. Implementation Modules

### A. Legacy AJAX Adapter (`server/src/routes/ajaxAdapter.ts`)
- **`handleCategoryMcq`:** Evaluates question submissions and generates classical Hindi HTML alerts with Sanskrit shloka references, question status, and timing metadata.
- **`handleBookmark`:** Manages toggling question bookmarks up to the 3,000 question limit, returning `"1"` (saved) or `"2"` (removed).
- **`handleDailyMcq`:** Emits JSON arrays of daily challenge questions with Samhita/Sthana categorization.

### B. RESTful API Router (`server/src/routes/api.ts`)
- **Course Services:** Dynamic resolution of curriculum hierarchies with automatic course ID alias matching.
- **Assessment Services:** Delivery of full simulated examination packages (120 questions with duration, instructions, and scoring metrics).
- **Taxonomy Services:** Flexible querying of 57,375 questions by Samhita ID, Sthana ID, Subject ID, or keyword search.

