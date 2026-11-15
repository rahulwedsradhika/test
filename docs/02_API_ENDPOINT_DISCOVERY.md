# API Endpoint Discovery & Schema Registry

## 1. Overview

AyurQuest 1.5 employs a hybrid architectural pattern combining traditional server-side PHP page rendering with asynchronous AJAX endpoints. Rather than relying entirely on a modern REST/JSON microservices architecture, the legacy frontend communicates with individual PHP scripts located at the application root (`app1.5/*.php`).

These handlers return either **formatted HTML fragments** (which jQuery injects directly into DOM containers such as `#qr_{ques_id}`) or **raw scalar status codes** (`'1'`, `'2'`, `'3'`), along with targeted JSON arrays for daily quizzes.

---

## 2. API Endpoint Inventory

| Feature | Endpoint | Method | Authentication | Request Data | Response Structure | Status |
|---|---|---|---|---|---|---|
| **Question Solution & Explanation** | `/ajax_category_mcq.php` | POST | Session Cookie | `ques_id`, `answer`, `mcq_source_id`, `time`, `guess` | HTML fragment with `.list-group-item-success`, reference text, and Sanskrit commentary | **VERIFIED** |
| **Bookmark Toggle** | `/ajax_bookmark.php` | POST | Session Cookie | `que_id` (integer) | Scalar text: `'1'` (added), `'2'` (removed), `'3'` (quota full) | **VERIFIED** |
| **Sticky Note Annotation** | `/ajax_sticky_note.php` | POST | Session Cookie | `ques_id`, `note_text`, `action` | JSON status object or HTML note list | **VERIFIED** |
| **Question Error Report** | `/ajax_report.php` | POST | Session Cookie | `ques_id`, `comment`, `reason_id` | JSON `{ "status": "success", "message": "Report logged" }` | **VERIFIED** |
| **Free Daily Quiz Feed** | `/ajax.php?type=free_daily_quiz` | GET | Session Cookie | Query parameter: `type` | JSON array of quiz objects (`id`, `name`, `sub`, `m`, `q`, `qt`, `w`, `d`, `pt`, `uuid`) | **VERIFIED** |
| **Pre-Entrance Mock Feed** | `/ajax.php?type=pre_entrance` | GET | Session Cookie | Query parameter: `type` | JSON array of entrance examination mock tests | **VERIFIED** |
| **Daily MCQs List** | `/ajax_daily_mcq.php` | GET | Session Cookie | `date`, `category_id` | JSON array of daily challenge items | **VERIFIED** |
| **Question of the Day** | `/ajax_daily.php` | POST | Session Cookie | `action=qod`, `ques_id` | JSON question definition or HTML daily card | **VERIFIED** |
| **Modal Quiz Launcher** | `/ajax_quiz.php` | POST | Session Cookie | `quiz_id`, `mode=modal` | HTML dialog containing instructions & Start button | **VERIFIED** |
| **Solved Question Stats** | `/ajax_ques_solved.php` | GET | Session Cookie | None | JSON summary `{ "total_solved": N, "accuracy": N }` | **VERIFIED** |
| **Login OTP Dispatch** | `/login_process.php` | POST | None (Public) | `mobile_number`, `country_code` | JSON `{ "status": true, "otp_sent": true }` | **OBSERVED** |
| **OTP Verification** | `/verify_otp.php` | POST | None (Public) | `mobile_number`, `otp_code` | JSON `{ "auth": true, "redirect": "index.php" }` | **OBSERVED** |
| **Payment Gateway Webhook** | `/payment_callback.php` | POST | Gateway Signature | `razorpay_order_id`, `razorpay_payment_id` | JSON transaction confirmation | **BLOCKED** |

---

## 3. Deep Endpoint Request & Response Schemas

### 3.1. Question Solve (`/ajax_category_mcq.php`)
- **HTTP Method:** `POST`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Request Parameters:**
  - `ques_id` (int): Unique identifier of the question (e.g. `101`)
  - `answer` (int): Student's selected option (`1`, `2`, `3`, or `4`)
  - `mcq_source_id` (int): Context ID (`1` = Samhita, `2` = Subject, `3` = Daily)
  - `time` (int/string): Time taken in seconds before answering (e.g. `12`)
  - `guess` (int): Flag indicating whether the answer was a guess (`0` or `1`)
- **Verified Response (HTML):**
  ```html
  <div class="list-group-item lb-justify list-group-item-success" style="margin-top: 10px;">
    <h5 class="list-group-item-heading text-bold">
      <i class="fa fa-check-circle"></i> Correct Answer: Option B
    </h5>
    <p class="list-group-item-text" style="font-size: 13px; line-height: 1.5;">
      <strong>Reference &amp; Commentary:</strong> Charaka Samhita Sutrasthana contains 30 chapters divided into 7 Chatushkas plus 2 concluding chapters (Samgraha Dwaya).
    </p>
    <div style="font-size: 11px; color: #666; margin-top: 4px;">
      Source: Charaka Samhita &bull; Sutra Sthana &bull; Maulik Siddhanta
    </div>
  </div>
  ```

---

### 3.2. Bookmark Toggle (`/ajax_bookmark.php`)
- **HTTP Method:** `POST`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Request Body:**
  ```
  que_id=102
  ```
- **Response Codes:**
  - `'1'`: Successfully added to user bookmarks.
  - `'2'`: Successfully removed from user bookmarks.
  - `'3'`: User bookmark storage quota reached (requires Pro membership).

---

### 3.3. Daily Quiz Feed (`/ajax.php?type=free_daily_quiz`)
- **HTTP Method:** `GET`
- **Response Format:** `application/json`
- **Response Payload Schema:**
  ```json
  [
    {
      "id": 501,
      "name": "Daily Test 1 - Charaka Samhita Sutrasthana Ch. 1-10",
      "sub": "Charaka Samhita Fundamentals",
      "m": 10,
      "q": 10,
      "qt": 15,
      "w": 50,
      "p": true,
      "d": "2026-11-14",
      "pt": "08:00 AM",
      "uuid": null,
      "r": true,
      "pm": 1,
      "nm": 0.25
    }
  ]
  ```
  - `id`: Unique quiz identifier
  - `name`: Display title
  - `sub`: Subject / topic description
  - `m`: Maximum marks
  - `q`: Total MCQ question count
  - `qt`: Quiz time in minutes
  - `w`: Reward wallet points awarded upon successful completion
  - `p`: Published status boolean
  - `d`: Scheduled date (`YYYY-MM-DD`)
  - `pt`: Publication time string
  - `uuid`: String UUID if previously attempted, otherwise `null`
  - `r`: Rank visibility flag
  - `pm`: Positive marks per correct question (`+1.0`)
  - `nm`: Negative marks deduction per incorrect question (`-0.25`)

---

## 4. Localhost RESTful Adaptation

To provide modern React SPA client integration alongside 1:1 legacy PHP AJAX form compatibility, the local replica backend implements dual routing:
1. **Legacy 1:1 PHP Adapter:** Exact URI endpoints (`/ajax_category_mcq.php`, `/ajax_bookmark.php`, `/ajax.php`) to service original components.
2. **Modern RESTful API (`/api/*`):** Clean JSON endpoints for `/api/dashboard`, `/api/courses`, `/api/samhitas`, `/api/questions`, `/api/quizzes`, `/api/bookmarks`, `/api/notes`, `/api/scorecard`, and `/api/diagnostics`.

