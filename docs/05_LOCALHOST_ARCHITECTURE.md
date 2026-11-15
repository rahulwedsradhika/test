# Localhost Replica Architecture & Development Guide

## 1. Architectural Philosophy & Dual-Tier Design

The AyurQuest 1.5 localhost replica is engineered as a high-fidelity, dual-tier application designed to run completely offline or in hybrid integration with upstream AyurQuest servers.

```
+-------------------------------------------------------------------+
|               CLIENT: React 18 + Vite (Port 3000)                |
|  - Bootstrap 3.3.7 + AdminLTE Skin                                |
|  - Production SvgSprite & Flaticon Webfont Integration            |
|  - React Router DOM v6 Page Routing                               |
|  - Practice & Exam Simulation Controllers                         |
+-------------------------------------------------------------------+
                               |
                        Vite HTTP Proxy
             (/api/*, /ajax*, /app1.5/*, /*.php)
                               |
                               v
+-------------------------------------------------------------------+
|             SERVER: Node.js Express + TS (Port 5000)              |
|  - Dual Router: RESTful /api/* & 1:1 Legacy PHP Adapters         |
|  - LOCAL_DEV_NO_LOGIN=true Middleware & Session Seeder            |
|  - Persistent State Engine: local_store.json                      |
|  - Diagnostics & Health Monitor Subsystem                         |
+-------------------------------------------------------------------+
                               |
                    Upstream Network Bridge
                               |
                               v
+-------------------------------------------------------------------+
|             UPSTREAM: Production AyurQuest 1.5 Origin             |
|  - https://ayurquest.com/app1.5/                                 |
|  - Vimeo Video CDN / Live Event Streams                           |
+-------------------------------------------------------------------+
```

---

## 2. The Non-Interactive Login Mechanism (`LOCAL_DEV_NO_LOGIN=true`)

In accordance with Section 6 of the Master Project Prompt:
> *"When the localhost application starts, it must open directly into the main learning platform dashboard without requiring an interactive login, username/password form, or OTP entry."*

### Implementation Breakdown:
1. **Environment Flag:** The backend server initializes with `process.env.LOCAL_DEV_NO_LOGIN = "true"`.
2. **Deterministic Identity Seeding:** Upon server boot, the persistent state engine (`server/src/data/database.ts`) seeds a default verified scholar identity:
   ```typescript
   {
     id: 10086,
     name: "Dr. Ayur Scholar",
     email: "scholar@ayurquest.local",
     phone: "+91 9876543210",
     examTarget: "AIAPGET 2027",
     membershipPlan: "AyurQuest Pro All-Access (Local Dev)",
     isPremium: true
   }
   ```
3. **Frontend Immediate Boot:** When the user accesses `http://localhost:3000/`, the React application boots directly into the root route `/` (`<Dashboard />`). Protected route guards evaluate `user !== null` instantly from `/api/dashboard`, bypassing all OTP modals and redirect loops.
4. **Authentic Session State:** Subsequent API actions (bookmarking, adding sticky notes, recording attempts, spending wallet points) operate against this persistent authenticated local profile.

---

## 3. Legacy PHP Adapter vs Modern REST Routing

To support authentic legacy HTML forms alongside modern React state management, the Express backend exposes two parallel routing engines:

### 1. Legacy PHP Adapter (`server/src/routes/ajaxAdapter.ts`)
Serves exact 1:1 endpoints matching production PHP scripts:
- `POST /ajax_category_mcq.php`: Form-encoded request yielding HTML response with `.list-group-item-success` markup.
- `POST /ajax_bookmark.php`: Form-encoded request returning scalar text `'1'` or `'2'`.
- `POST /ajax_sticky_note.php`: Form-encoded note creation handler.
- `GET /ajax.php?type=free_daily_quiz`: Query-parameter based JSON feed.

### 2. Modern RESTful API (`server/src/routes/api.ts`)
Provides structured JSON interfaces for modern client components:
- `GET /api/dashboard`: Aggregated dashboard metrics, user session, and banner promotions.
- `GET /api/courses`, `GET /api/courses/:id`: Complete course curriculum and module trees.
- `GET /api/samhitas`, `GET /api/samhitas/:id`: Classical treatise hierarchy and Sthana catalog.
- `GET /api/questions`, `POST /api/questions/:id/solve`: Question retrieval and instant evaluation.
- `GET /api/quizzes`, `POST /api/quizzes/:id/submit`: Timed exam simulation and grading.
- `GET /api/bookmarks`, `POST /api/bookmarks/toggle`: User saved questions manager.
- `GET /api/notes`, `POST /api/notes`: User personal sticky notes manager.
- `GET /api/scorecard`, `GET /api/wallet`: Performance ledger and reward point balances.
- `GET /api/diagnostics`: System health and upstream connectivity monitor.

---

## 4. Local Persistence (`local_store.json`)

To ensure development changes survive server restarts without requiring a separate MySQL database instance, state is managed by `LocalDatabase` in `server/src/data/database.ts`:
- **State Store File:** `server/local_store.json`
- **Managed Entities:**
  - `bookmarks`: Array of bookmarked question IDs
  - `notes`: Map of question IDs to array of user notes
  - `attempts`: History of solved questions, selected choices, accuracy, and timestamps
  - `quizResults`: Completed mock exams, scores, accuracy percentages, and submission UUIDs
  - `wallet`: Current reward points balance and credit/debit transaction log
- **Atomic File Sync:** Writes are serialized and committed synchronously to prevent corruption during concurrent requests.

