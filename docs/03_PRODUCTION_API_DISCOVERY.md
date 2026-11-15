# 03 — AYURQUEST 1.5 DEEP API DISCOVERY & AUTHENTICATED REVERSE ENGINEERING

**Target Origin:** `https://ayurquest.com/app1.5/`  
**Authenticated User:** Rohit (ID: 125448, Mobile: +917006923314)  
**Investigation Tools:** REA MCP, Chrome DevTools Protocol (CDP), Authenticated HTTP Probing  
**Date:** November 2026  

---

## 1. Verified Architecture & Session Handling

1. **Authentication Gate:**
   - All protected routes and AJAX endpoints check `$_SESSION['user_id']`.
   - Without an active `PHPSESSID`, requests return an HTTP 302 redirect to `/app1.5/login.php`.
   - The login flow posts to `login.php` with `mobile` (10 digits) and `login2=Sign In`, sending an SMS OTP.
   - OTP verification posts to `login.php` with `mobile`, `otp`, `remember=1`, and `verify2=Verify OTP`.
   - Once authenticated, the server sets `PHPSESSID` (e.g., `8ljh52u54bd84q0is60ka09km3`).

2. **Access Control & Subscription Tiering:**
   - Free accounts have access to unlocked promotional lectures (e.g., *Charaka Samhita Introduction*), 60 Free Daily Tests (`ajax.php?type=free_daily_quiz`), and general course catalogues.
   - Paid Question Banks (`category.php?action=questions`) and Paid Tests (e.g., 2026-2027 live test series) check subscription status and redirect unsubscribed accounts to `membership.php` (`Membership Plans`).

---

## 2. Complete Catalog of Discovered Production Endpoints

### A. Live Question & Test APIs

| Endpoint | Method | Parameters | Response Type | Description |
|---|---|---|---|---|
| `ajax.php?type=free_daily_quiz` | `GET` | None | JSON | Returns array of 60 free daily revision tests with metadata (`id`, `name`, `sub`, `m`, `q`, `qt`, `w`, `d`, `uuid`). |
| `ajax.php?type=daily&year=2026-2027` | `GET` | `type=daily&year=2026-2027` | JSON | Returns array of 250 scheduled daily tests for the 2026-2027 academic year. |
| `ajax_quiz.php` | `POST` | `quiz_id=<id>` | HTML | Returns test launch modal with Evaluation Mode, Practice Mode, and AIAPGET Mode selectors. |
| `quiz.php?action=play_quiz` | `POST` | `quiz_id=<id>&solveAQquiz=Solve+Test` | HTML | Evaluation Mode test engine. Serves interactive deck with up to 100 questions, radio options, and countdown timer. |
| `quiz.php?action=quiz_with_answers` | `POST` | `quiz_id=<id>&quiz_with_answers=Solve+Test` | HTML | Practice Mode test engine with immediate answer reveal per question. |
| `quiz.php?action=solve_aiapget` | `GET` | `quiz_id=<encrypted_hash>` | HTML | Full NTA AIAPGET examination simulator with question grid and palette. |
| `quiz.php?action=quiz_result` | `POST` | `ans[<qid>]=<val>` | HTML | Calculates score, accuracy, negative marks, and answer key. |
| `ajax_category_question.php` | `POST` | `samhita_id=<hash>&q_from=chapter` | HTML | Returns list of Sthanas for the chosen Samhita in the question bank. |
| `ajax_category_question.php` | `POST` | `samhita_id2=<hash>&sthana_id=<hash>` | HTML | Returns list of Chapters for the chosen Sthana. |
| `category.php?action=questions` | `GET` | `samhita=<hash>&sthana=<hash>&chapter=<hash>` | HTML | Renders chapterwise question deck. (Gated by paid membership). |
| `ajax_category_mcq.php` | `POST` | `ques_id=<id>&answer=<val>&time=<time>&guess=0` | HTML | Evaluates single question response and returns feedback alert with Sanskrit commentary. |
| `ajax_daily_mcq.php` | `GET` | `mode=answers&challenge=` | JSON | Fetches rapid-fire questions with answers and sticky notes. |

---

### B. Audio/Video Lecture Delivery APIs

| Endpoint | Method | Parameters | Response Type | Description |
|---|---|---|---|---|
| `audio-video.php?action=samhitas` | `GET` | None | HTML | Displays Samhitawise lecture directory (1,288 lectures, 394 hrs). |
| `ajax_lecture.php` | `POST` | `samhita_id=<id>` | HTML | Returns Sthanas with durations and counts (e.g., Sutra Sthana: 65 lectures, 31h 57m). |
| `ajax_lecture.php` | `POST` | `samhita_id2=<id>&sthana_id=<id>` | HTML | Returns Chapters with durations (e.g., Deergham Jeeviteeya: 5 lectures, 2h 18m). |
| `ajax_lecture.php` | `POST` | `chapter_id=<id>` | HTML | Returns individual lecture items with IDs and duration in minutes. |
| `ajax_lecture.php` | `POST` | `lecture_id=<id>&ref_id=<ref>` | HTML | Returns embedded Vimeo Player (`https://vimeo.com/<id>`), playback resume position, and note inputs. |
| `ajax_lecture.php` | `POST` | `action=store_time_update&running_time=<sec>` | Text | Real-time playback progress heartbeat. |
| `ajax_lecture.php` | `POST` | `action=mark&lecview_id=<id>` | Text | Marks lecture as Completed (`1`) or Watch Later (`later`). |

---

### C. Sticky Notes, Bookmarks & Discrepancies

| Endpoint | Method | Parameters | Response Type | Description |
|---|---|---|---|---|
| `ajax_bookmark.php` | `POST` | `que_id=<id>` | Text | Toggles question bookmark (`1` = saved, `2` = removed). |
| `ajax_sticky_note.php` | `POST` | `check_ques_id=<id>` | HTML | Returns existing sticky notes and note form for a question. |
| `ajax_sticky_note.php` | `POST` | `check_ques_id=<id>` | HTML | Returns existing sticky notes and note form for a question. |
| `ajax_sticky_note.php` | `POST` | `ques_id=<id>&notes=<text>` | Text | Saves personal sticky note (`1` = success). |
| `ajax_report.php` | `POST` | `check_ques_id=<id>` | HTML | Returns discrepancy report modal for a question. |
| `ajax_report.php` | `POST` | `ques_id=<id>&comment=<text>` | Text | Submits academic discrepancy report to faculty (`1` = success). |
