# 08 — AYURQUEST 1.5 LOCALHOST INTEGRATION ARCHITECTURE

**Host System:** Windows Development Workstation  
**Frontend URL:** `http://localhost:3000`  
**Backend API URL:** `http://localhost:5000`  
**Session Mode:** `LOCAL_DEV_NO_LOGIN=true` (Zero-login instant development mode)  
**Date:** November 2026  

---

## 1. System Topology & Process Diagram

```
                 +--------------------------------------------+
                 |            Browser Client                  |
                 |     http://localhost:3000/app1.5/index.php |
                 +---------------------+----------------------+
                                       |
                     +-----------------+-----------------+
                     |                                   |
           (Page Navigation / SPA)               (API & AJAX Requests)
                     |                                   |
                     v                                   v
        +-------------------------+         +-------------------------+
        |   Vite Dev Server       |         |   Vite Reverse Proxy    |
        |   (Port 3000)           |         |   (proxy /api & ajax_*) |
        |   - React 18 + TS       |         +------------+------------+
        |   - PHP SPA Rewrite     |                      |
        +------------+------------+                      v
                     |                      +-------------------------+
                     v                      |   Express Backend       |
        +-------------------------+         |   (Port 5000)           |
        |   React Router v6       |         |   - ajaxAdapter.ts      |
        |   - Header & Sidebar    |         |   - apiRouter (REST)    |
        |   - 21 Production Pages |         |   - in-memory DB        |
        |   - Quiz & Lecture Eng. |         +------------+------------+
        +-------------------------+                      |
                                                         v
                                            +-------------------------+
                                            |   Local State / DB      |
                                            |   - 57,375 MCQs         |
                                            |   - User Progress       |
                                            |   - Bookmarks & Notes   |
                                            |   - Wallet Ledger       |
                                            +-------------------------+
```

---

## 2. Frontend Subsystem (`client/`)

- **Framework:** React 18 with TypeScript and Vite 6.
- **Port:** `3000`
- **Routing:** `BrowserRouter` mapping all 25 production routes:
  - Default route `/` and `/app1.5/index.php` render `<IndexDashboard />`.
  - All `.php` routes map 1:1 to dedicated production components.
- **SPA Fallback for `.php` Extensions:**
  Standard Vite treats URLs containing extensions (such as `.php`) as static files. To ensure smooth direct URL access and page refreshes, a custom Vite middleware (`php-page-spa-fallback`) rewrites incoming GET requests for `.php` pages to `/index.html`, preserving the browser's URL for React Router matching.

---

## 3. Backend Subsystem (`server/`)

- **Framework:** Express.js with TypeScript (`dist/server.js`).
- **Port:** `5000`
- **Dual Adapter Layer:**
  1. **Legacy AJAX Adapter (`server/src/routes/ajaxAdapter.ts`):** Handles `ajax_category_mcq.php`, `ajax_bookmark.php`, `ajax_daily_mcq.php`, `ajax_quiz.php`, `ajax_report_question.php`, and `ajax_notes.php`. Mounted at both `/` and `/app1.5/`.
  2. **Modern RESTful API (`server/src/routes/api.ts`):** Exposes clean JSON endpoints under `/api/` (`dashboard`, `courses`, `quizzes`, `questions`, `notes`, `wallet`, `health`).
- **CORS Configuration:** Fully enabled with credentials support for localhost inter-service communication.

---

## 4. Local State Management & In-Memory Database (`database.ts`)

To ensure persistence and dynamic interactivity without requiring an external MySQL installation during development:
- **Active User Session:** Pre-initialized for `Vd. Rohit` (`rohit@ayurquest.com`, mobile `9876543210`).
- **Wallet Ledger:** Initialized with 100 bonus deposit points (`TRANSACTION ID: 3100874`).
- **Bookmark Storage:** In-memory Set supporting toggle operations up to 3,000 items.
- **Attempt Tracking:** Records question ID, user's answer, correctness, timestamp, and guess flag.

---

## 5. Zero-Login Mode (`LOCAL_DEV_NO_LOGIN=true`)

In compliance with project specifications, the application bypasses interactive phone number verification, OTP modals, and paywalls in localhost mode:
- All mock tests, audio lectures, question banks, and notes are immediately accessible.
- Premium features simulate realistic responses without deducting real money or contacting remote gateways.

