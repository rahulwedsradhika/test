# VERIFIED ENDPOINTS & DATA EXCHANGE SPECIFICATION

**System:** AyurQuest 1.5 Learning Platform  
**Target Origin:** `https://ayurquest.com/app1.5/`  
**Localhost Adapter:** `http://localhost:5000`  
**Classification Standards:** VERIFIED, OBSERVED, INFERRED, BLOCKED, INVALID  
**Date:** November 2026  

---

## 1. Upstream Production Endpoints Audit

| Endpoint URL | HTTP Method | Expected Payload / Params | Response Format | Status Label | Notes & Observations |
|---|---|---|---|---|---|
| `/app1.5/login.php` | `GET` | None | `text/html` | **VERIFIED** | Form container with mobile number validation and Freshchat/OneSignal scripts. |
| `/app1.5/login.php` | `POST` | `mobile=XXXXXXXXXX` | `text/html` / JSON | **OBSERVED** | Dispatches SMS OTP via Gupshup/MSG91 with 30s timer. |
| `/app1.5/index.php` | `GET` | None | `text/html` | **OBSERVED** | Returns 302 redirect to `login.php` when unauthenticated. |
| `/app1.5/courses.php` | `GET` | None | `text/html` | **OBSERVED** | Returns 302 redirect to `login.php`. |
| `/app1.5/category.php` | `GET` | `action=samhitas / subjects / tags` | `text/html` | **OBSERVED** | Returns 302 redirect to `login.php`. |
| `/app1.5/audio-video.php` | `GET` | None | `text/html` | **OBSERVED** | Returns 302 redirect to `login.php`. |
| `/app1.5/ajax_category_mcq.php` | `POST` | `ques_id=1&answer=2&time=00:15` | `text/html` (alert) | **OBSERVED** | Unauthenticated requests return login template. Handled locally via adapter. |
| `/app1.5/ajax_bookmark.php` | `POST` / `GET` | `que_id=101` | `text/plain` (`"1"` / `"2"`) | **OBSERVED** | Unauthenticated requests return login template. Handled locally via adapter. |
| `/app1.5/ajax_daily_mcq.php` | `GET` | None | `application/json` | **OBSERVED** | Discovered in `includes_tree.json`. Protected by session guard. |
| `/app1.5/ajax_daily.php` | `POST` | `type=ques_of_day` | `text/html` | **OBSERVED** | Question of the day card. Handled locally via adapter. |
| `/app1.5/ajax_quiz.php` | `POST` | `quiz_id=1` | `text/html` | **OBSERVED** | Modal displaying Practice vs AIAPGET Exam options. |
| `/app1.5/ajax_report_question.php`| `POST` | `ques_id=1&comment=text` | `application/json` | **INFERRED** | Inferred from question interface action buttons. |
| `/app1.5/ajax_notes.php` | `POST` | `action=save&ques_id=1` | `application/json` | **INFERRED** | Inferred from sticky notes action button on question palette. |
| `https://ayurquest.com/api/v1/*` | Any | REST JSON | `application/json` | **INVALID** | AyurQuest 1.5 does not expose a public `/api/v1/` REST endpoint; it uses classical PHP page routes and `ajax_*.php` endpoints. |
| Production SMS Gateway | `POST` | Mobile OTP payload | Carrier API | **BLOCKED** | Requires production cellular dispatch credentials. |
| Production Razorpay API | `POST` | Payment capture | Gateway JSON | **BLOCKED** | Requires private merchant API secret keys. |

---

## 2. Localhost Adapter Layer Endpoints (`http://localhost:5000`)

The local development replica bridges the authenticated production gap by implementing an Express dual adapter:

### A. Legacy AJAX Compatibility Layer (`/` and `/app1.5/`)
| Endpoint | Method | Parameters | Localhost Response | Status |
|---|---|---|---|---|
| `/ajax_category_mcq.php` | `POST` | `ques_id`, `answer`, `time`, `guess` | Formatted HTML alert with Sanskrit shloka citation and correctness status | **VERIFIED** |
| `/ajax_bookmark.php` | `POST`/`GET` | `que_id` | `"1"` (saved) or `"2"` (removed) | **VERIFIED** |
| `/ajax_daily_mcq.php` | `GET` | None | JSON array of 10 daily questions with Samhita/Sthana tags | **VERIFIED** |
| `/ajax_daily.php` | `POST` | `type=ques_of_day` | HTML Question of the Day widget with interactive radio options | **VERIFIED** |
| `/ajax_quiz.php` | `POST` | `quiz_id` | HTML modal allowing selection between Practice and Exam modes | **VERIFIED** |

### B. Modern RESTful API Layer (`/api/*`)
| Endpoint | Method | Parameters | Localhost Response | Status |
|---|---|---|---|---|
| `/api/health` | `GET` | None | `{ status: "ok", mode: "LOCAL_DEV_NO_LOGIN" }` | **VERIFIED** |
| `/api/dashboard` | `GET` | None | User profile, active statistics, and featured courses | **VERIFIED** |
| `/api/courses` | `GET` | `type` (optional) | Array of 4 comprehensive courses with pricing and curricula | **VERIFIED** |
| `/api/courses/:id` | `GET` | `id` in path | Detailed curriculum with modules, chapters, and lecture video links | **VERIFIED** |
| `/api/quizzes` | `GET` | `category`, `type` | 5 full mock tests and previous year examination papers | **VERIFIED** |
| `/api/questions` | `GET` | `sam_id`, `sth_id`, `sub_id`, `limit` | Verified classical MCQs with answer keys and shloka citations | **VERIFIED** |
| `/api/questions/:id/solve` | `POST` | `answer`, `timeSpent` | Evaluates answer, calculates score, and updates user progress | **VERIFIED** |
| `/api/wallet` | `GET` | None | Wallet balance (100 points) and transaction ledger | **VERIFIED** |
| `/api/notes` | `GET` | None | Saved clinical and sticky notes | **VERIFIED** |
| `/api/notes` | `POST` | `questionId`, `content` | Saves note to user's local in-memory store | **VERIFIED** |

