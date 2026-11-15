# 01 — AYURQUEST 1.5 COMPLETE PRODUCTION SITE MAP & NAVIGATION ARCHITECTURE

**Origin Reference:** `https://ayurquest.com/app1.5/index.php`  
**Base URL:** `https://ayurquest.com/app1.5/`  
**Verification Method:** 24 Authoritative Production Screenshots + Live Route Inspection + Network Analysis  
**Date:** November 2026  

---

## 1. Production Site Architecture Overview

The AyurQuest 1.5 learning platform is structured as a single-origin web application with classical PHP URL endpoints (`/app1.5/*.php`). The navigation is anchored by a persistent top header (`#2aacdd`) with hamburger drawer trigger and a 27-item sliding navigation drawer.

```
AyurQuest 1.5 (/app1.5/)
│
├── Top Level Dashboard
│   └── /app1.5/index.php (Home Dashboard: Welcome banner, Quote of the Day, Whats New cards)
│
├── Structured Courses & Curriculum
│   ├── /app1.5/courses.php (Full Courses Catalogue: AIAPGET & UPSC/PSC streams)
│   ├── /courses/:id (Detailed Subject & Chapterwise Curriculum View)
│   └── /lecture/:courseId/:lectureId (Interactive Video Classroom & PDF notes)
│
├── Examinations & Performance
│   ├── /app1.5/ayush-npget.php?action=mock_test (AIAPGET Mock Tests: 2027, 2026, 2025, 2024)
│   ├── /app1.5/daily-tests.php (Daily Rapid Fire & Question Challenge)
│   ├── /app1.5/test-series.php (Subjectwise & Sectional Test Series)
│   ├── /app1.5/upsc.php (UPSC Ayurveda Medical Officer Entrance Portal)
│   ├── /app1.5/prev-years.php (125+ Previous Year Examination Papers)
│   └── /app1.5/myScore.php (Comprehensive Score Card, Attempt History & Performance Analytics)
│
├── Question Bank & Subjectwise MCQs (57,375 Total Questions)
│   ├── /app1.5/category.php (Question Bank Overview & Solved/Unsolved Status)
│   ├── /app1.5/category.php?action=samhitas (16 Samhitawise Question Banks: Charaka, Sushruta, Vagbhata...)
│   ├── /app1.5/category.php?action=subjects (9 Core Ayurveda Subject Banks: Kayachikitsa, Dravyaguna...)
│   ├── /app1.5/category.php?action=tags (6 Tagwise Question Formats: Statement, Reason Assertion...)
│   ├── /app1.5/reported_questions.php (41,864 Reported Questions with Faculty Resolutions)
│   └── /app1.5/bookmarks.php (3,000 Capacity Bookmark Revision Engine)
│
├── High-Yield Learning Resources
│   ├── /app1.5/notes.php (Topicwise Short Notes & Sticky Notes)
│   ├── /app1.5/mnemonics.php (Ayurveda Tricks & Shloka Memorization Codes)
│   ├── /app1.5/tips.php (Study Tips & Exam Strategies by Top Rankers)
│   └── /app1.5/audio-video.php (2,071 Audio Lectures / 676+ Hours Audio Book)
│
├── Community & Peer Learning
│   └── /app1.5/forum.php (Discussion Forum across 6 Academic Categories)
│
├── Commercial, Financial & Referral
│   ├── /app1.5/myWallet.php (Points Ledger, Recharge & Registration Bonus)
│   ├── /app1.5/membership.php (Subscription Plans: Test Series ₹650, Video ₹1499, Audio ₹499)
│   ├── /app1.5/books.php (Online Partner Bookstore: 12 Core Ayurveda Books)
│   └── /app1.5/invites.php (Referral System: Code 126448, Social Sharing)
│
└── Account & Administrative
    ├── /app1.5/myProfile.php (Student Profile, Academic Details, Chat Toggle)
    ├── /app1.5/about.php (About AyurQuest Academy & Academic Council)
    ├── /app1.5/contact.php (Helpline Support & WhatsApp Concierge)
    └── /app1.5/logout.php (Secure Session Invalidation)
```

---

## 2. Exhaustive Route Map & Metadata

| # | Production Route | Page Title | Primary UI Components | Data Source / Backing API |
|---|---|---|---|---|
| 1 | `/app1.5/index.php` | Home Dashboard | Welcome Card, Motivational Quote, 4 Feature Cards ("WHATS NEW FOR AIAPGET") | `GET /api/dashboard` |
| 2 | `/app1.5/courses.php` | Courses Catalogue | Stats Strip, AIAPGET/UPSC Stream Tabs, Crash & Comprehensive Course Cards, ₹5999 & ₹9999 pricing | `GET /api/courses` |
| 3 | `/app1.5/ayush-npget.php?action=mock_test` | AIAPGET Mock Tests | Trophy Hero Illustration, Year Tabs (2027/26/25/24), Filter (All/Solved/Unsolved), Mock Test Cards | `GET /api/quizzes?category=mock` |
| 4 | `/app1.5/upsc.php` | UPSC Ayurveda | University Illustration, Daily Rapid Fire / Question challenge cards, 4 list items, Social Groups bar | `GET /api/quizzes?stream=upsc` |
| 5 | `/app1.5/prev-years.php` | Previous Year Papers | Checklist Hero Illustration, 3 Centered Exam Seals (All Ayurveda, Post Graduate, UPSC) | `GET /api/quizzes?type=pyp` |
| 6 | `/app1.5/category.php` | Question Bank Overview | 57,375 Total Counter, Solved 0 / Unsolved 57375, Subscription Plans & Support buttons, Samhita/Subject cards | `GET /api/questions/stats` |
| 7 | `/app1.5/category.php?action=samhitas` | Samhitawise MCQs | Stacked Books Hero, 16 Samhita Cards with Pink `?` and Question Counts (Charaka 11175, Sushruta 8709...) | `GET /api/questions/samhitas` |
| 8 | `/app1.5/category.php?action=subjects` | Subjectwise MCQs | Open Book Hero, 9 Subject Cards with Question Counts (Kayachikitsa 6759, Dravyaguna 3139...) | `GET /api/questions/subjects` |
| 9 | `/app1.5/category.php?action=tags` | New Pattern MCQs | Open Book Hero, 6 Tag Format Cards (Statement 5070, Reason Assertion 416, Match Making 208...) | `GET /api/questions/tags` |
| 10 | `/app1.5/notes.php` | Short Notes | Sticky Notes button, 10 Hindi Notes Accordion with Pink `+` Expand buttons | `GET /api/notes` |
| 11 | `/app1.5/mnemonics.php` | Mnemonics | 10 Hindi Mnemonics Accordion with Pink `+` Expand buttons | `GET /api/notes?type=mnemonic` |
| 12 | `/app1.5/tips.php` | Study Tips | Toppers Study Tips Banner, 9 General Tips with Pink Lightbulbs | `GET /api/notes?type=tips` |
| 13 | `/app1.5/audio-video.php` | Audio Lectures | Headphone Girl Hero, 3 Pale-cyan Cards (Samhitas 1288, Subjects 695, Books 910), Summary Ribbon (2071 lectures, 676 hrs) | `GET /api/lectures?type=audio` |
| 14 | `/app1.5/myScore.php` | Score Card | Trophy Hero, DataTable Controls (Show 10 entries, Search), Attempts Table, AIR Ranking | `GET /api/wallet/history` |
| 15 | `/app1.5/bookmarks.php` | Bookmarks | Screen Hero, Metrics Strip (Bookmarks 0 / Limit 3000), 2 Cards (0 in 0 Samhitas, 0 in 0 Subjects) | `GET /api/questions/bookmarks` |
| 16 | `/app1.5/reported_questions.php` | Reported Questions | Q&A Hero, Metrics (Total 41864, My 0), Authentic Question (Susruta Sutra 27/5), Query & Faculty Resolution | `GET /api/questions/reported` |
| 17 | `/app1.5/forum.php` | Discussion Forum | 6 Categories Table (Samhitas 54, Subjects 21, Modern 9, AIAPGET 18, UPSC 8, State GK 24), New Topic Modal | `GET /api/forum/categories` |
| 18 | `/app1.5/myWallet.php` | My Wallet | Wallet Hero, Metrics (Balance 100, Expense 0, Deposit 100), Recharge & Free Points buttons, Transactions Ledger | `GET /api/wallet` |
| 19 | `/app1.5/membership.php` | Subscriptions | 3 Pricing Cards: Test Series ₹650, Video Lectures ₹1499, Audio Book ₹499 | `GET /api/subscriptions/plans` |
| 20 | `/app1.5/books.php` | Book Store | 3x4 Grid of 12 Authentic Ayurveda Textbooks & Competitive Guides | `GET /api/books/catalog` |
| 21 | `/app1.5/invites.php` | Invite Friends | Megaphone Hero, Referral Link, Referral Code 126448, Copy buttons, Social Share bar | `GET /api/user/referrals` |
| 22 | `/app1.5/myProfile.php` | My Profile | User Header (Vd. Rohit, 100 Wallet), Account Settings, Personal Info, On/Off Chat Toggle | `GET /api/user/profile` |
| 23 | `/app1.5/about.php` | About Us | Academic Council, History of AyurQuest, Milestone Metrics | Static Academic Content |
| 24 | `/app1.5/contact.php` | Contact Support | WhatsApp Helpline (+91 91720 00000), Support Email, Inquiries Form | `POST /api/support/inquire` |

---

## 3. Sidebar Drawer Organization (Exact 27 Items)

The sliding navigation drawer precisely follows the verified production order:

```
[Logo: Circular AyurQuest Emblem]
1.  Dashboard             -> /app1.5/index.php
2.  Courses               -> /app1.5/courses.php
3.  Mock Tests            -> /app1.5/ayush-npget.php?action=mock_test
4.  Daily Tests           -> /app1.5/daily-tests.php
5.  Test Series           -> /app1.5/test-series.php
6.  AIAPGET               -> /app1.5/ayush-npget.php
7.  UPSC Entrance         -> /app1.5/upsc.php
8.  Previous Year Papers  -> /app1.5/prev-years.php
9.  Samhitawise MCQs      -> /app1.5/category.php?action=samhitas
10. Subjectwise MCQs      -> /app1.5/category.php?action=subjects
11. New Pattern MCQs      -> /app1.5/category.php?action=tags
12. Notes                 -> /app1.5/notes.php
13. Mnemonics             -> /app1.5/mnemonics.php
14. Tips                  -> /app1.5/tips.php
15. Audio Lectures        -> /app1.5/audio-video.php
16. Score Card            -> /app1.5/myScore.php
17. Bookmarks             -> /app1.5/bookmarks.php
18. Reported MCQs         -> /app1.5/reported_questions.php
19. Discussion Forum      -> /app1.5/forum.php
20. My Wallet             -> /app1.5/myWallet.php
21. Membership Plans      -> /app1.5/membership.php
22. Book Store            -> /app1.5/books.php
23. Invite Friends        -> /app1.5/invites.php
24. My Profile            -> /app1.5/myProfile.php
25. About Us              -> /app1.5/about.php
26. Contact Us            -> /app1.5/contact.php
27. Sign Out              -> /app1.5/logout.php
```

All 27 navigation items are active, functional, and accurately routed.

