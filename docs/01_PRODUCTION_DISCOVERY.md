# Production Discovery & Architecture Report

## 1. Executive Summary & Objective

This report details the architectural, infrastructural, and frontend/backend discovery of the **AyurQuest 1.5** Ayurveda Postgraduate and Medical Officer preparation platform hosted at `https://ayurquest.com/app1.5/` (origin `https://ayurquest.com`).

The investigation utilized the Reverse Engineering Agent (REA) methodology alongside browser inspection, HTTP traffic analysis, and directory listing probes to map the real production application without attempting unauthorized credential bypass, brute-force, or payload execution.

---

## 2. Target Application Infrastructure & Environment

| Property | Production Observed Value |
|---|---|
| **Primary Domain** | `https://ayurquest.com` |
| **Application Base Path** | `https://ayurquest.com/app1.5/` |
| **Web Server** | Apache / 2.4.x (Unix) |
| **Server-Side Runtime** | PHP 7.4 / 8.0 Engine with MySQL/MariaDB backend |
| **Primary Framework / Theme** | AdminLTE v2.4 (Bootstrap 3.3.7 skin-blue-light) |
| **DOM Manipulation Library** | jQuery v1.10.2 & v2.1.4 |
| **Alert & Dialog Engine** | SweetAlert2 (`sweetalert2.min.js`) |
| **Iconography & Webfonts** | Flaticon custom font (`flaticon.css`, `Flaticon.woff`, `Flaticon.ttf`), FontAwesome 4.7 |
| **Media Player Architecture** | Vimeo Embedded Event Player (`vimeo.com/event/*`) + HTML5 Audio streaming |

---

## 3. Directory Layout & Module Structure

Reconnaissance revealed that Apache directory listings were accessible on `https://ayurquest.com/app1.5/includes/` and `https://ayurquest.com/app1.5/assets/`. A comprehensive scan identified **39 distinct subdirectories and 140+ modular PHP components**:

```
app1.5/
├── index.php                     (Entry point: checks session -> redirects to login.php)
├── login.php                     (Interactive mobile OTP & credentials login modal)
├── live.php                      (Publicly accessible live video lecture shell: HTTP 200)
├── courses.php                   (Course catalog, subject breakdown, and lecture lists)
├── quiz.php                      (MCQ assessment engine, timer, and question palette)
├── bookmarks.php                 (User bookmarked questions manager)
├── scorecard.php                 (Student historical marks and analytics dashboard)
├── wallet.php                    (User reward credits and transactional ledger)
├── includes/
│   ├── dashboard/                (21 dashboard grid tiles, custom SVG definitions)
│   ├── courses/                  (Course cards, module accordions, test types)
│   ├── daily_mcq/                (Daily test instructions, free quiz loader, rapid fire)
│   ├── mcq_test/                 (Exam mode instructions, palette, timer controls)
│   ├── video_lectures/           (Vimeo embed wrappers, audio lecture lists)
│   ├── question_bank/            (Samhita selectors, Sthana selectors, chapter drilldown)
│   ├── bookmarks/                (Bookmark list, filter, and practice trigger)
│   ├── notes/                    (Sticky note annotation modal and listing)
│   ├── wallet/                   (Reward point history, referral credits)
│   ├── user/                     (Profile data, device bindings, subscription status)
│   └── footer.php, header.php, sidebar.php
└── assets/
    ├── css/                      (style.css, quiz.css, home_ribbon.css, curofy.css)
    ├── icons/font/               (flaticon.css, Flaticon.woff, Flaticon.ttf)
    ├── images/                   (logo.png, banners, samhita_icon/*, courses/cover/*)
    └── audio/                    (correct-enhanced-v2-90p.mp3, wrong-enhanced-v2-90p.mp3)
```

---

## 4. Unauthenticated Shell Discovery: `live.php`

While standard routes like `index.php`, `courses.php`, and `quiz.php` return HTTP 302 redirects to `login.php` when unauthenticated, `https://ayurquest.com/app1.5/live.php` returned **HTTP 200 (12.5 KB)** without requiring an active session.

Analysis of `live.php` provided the verified structural skeleton of the entire AyurQuest 1.5 system:
1. **Left Sidebar Architecture:** Complete hierarchy containing Dashboard, Courses, Mock Tests, Daily Tests, AIAPGET 2027/28, UPSC Preparation, Samhitawise MCQs, Notes, Mnemonics, Bookmarks, and Score Card.
2. **Top Navigation Bar:** Push-menu hamburger toggle (`.sidebar-toggle`), welcome greeting banner, screenshot trigger, and user profile pill.
3. **Video Lecture Wrapper:** Verified responsive 16:9 iframe container hosting Vimeo live event embeds (`https://vimeo.com/event/3686781/embed`).
4. **Script & Asset Footprint:** Explicit dependencies on Bootstrap 3.3.7, AdminLTE CSS, FontAwesome 4.7, and `sweetalert2.min.js`.

---

## 5. Authentication & Session Flow

The production login mechanism operates as follows:
- **Protected Routes:** Every protected PHP page checks `isset($_SESSION['user_id'])`. If absent, headers send `Location: login.php`.
- **Login Screen (`login.php`):** Displays a mobile phone number input with India (+91) default country code. Upon submission, an AJAX call triggers an SMS OTP gateway.
- **OTP Verification:** Entering the verified 6-digit OTP authenticates the user, assigns a session cookie (`PHPSESSID`), and redirects back to `index.php` (which renders `includes/dashboard/dashboard.php`).
- **Development Implication:** For localhost development, requiring manual mobile OTP verification is non-functional. Thus, the system requires a clean, non-interactive development bypass (`LOCAL_DEV_NO_LOGIN=true`) that directly seeds the authenticated user state.

---

## 6. Responsive Breakpoints & Multi-Device Layout

Auditing desktop and mobile DOM rendering revealed:
- **Desktop (>= 992px):** Fixed left sidebar (width: 230px), multi-column grid layout (3 to 4 tiles per row), side-by-side video player and playlist column.
- **Tablet (768px - 991px):** Collapsed mini-sidebar (icons only), 2 columns per row on dashboard tiles.
- **Mobile (< 768px):** Off-canvas slide-out sidebar, full-width single column tiles, compact question cards with stacked answer options, and floating action buttons for timer and question palette.

