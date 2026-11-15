# PRODUCTION ROUTE MAP — AYURQUEST 1.5

**Origin Base URL:** `https://ayurquest.com/app1.5/`  
**Internal Modular Structure:** Discovered from production `includes_tree.json` + 24 Authoritative Screenshots  
**Date:** November 2026  

---

## 1. Primary Page Routes & Internal Includes Mapping

AyurQuest 1.5 organizes its application logic using a front-controller pattern where root PHP scripts dynamically include modular components from the `includes/` directory based on URL query parameters (`action`, `id`, `mode`).

| Production Route | Query Actions | Internal Include Submodule | Target Learning System |
|---|---|---|---|
| `/app1.5/index.php` | Default | `includes/dashboard/default.php` | Main learning dashboard, quote, feature cards |
| `/app1.5/courses.php` | Default | `includes/courses/default.php` | Full course catalogue (AIAPGET & UPSC streams) |
| `/courses/:id` | `id=aiapget-2027` | `includes/courses/course_detail.php` | Chapterwise video/audio syllabus & modules |
| `/lecture/:courseId/:lectureId` | Default | `includes/courses/course_content.php` | HD video classroom player + PDF notes viewer |
| `/app1.5/ayush-npget.php` | `action=mock_test` | `includes/aia_pget/mock_test.php` | AIAPGET Mock Tests (2027/26/25/24) |
| `/app1.5/daily-tests.php` | Default | `includes/daily_test/default.php` | Daily rapid fire & question challenges |
| `/app1.5/test-series.php` | Default | `includes/test_series/default.php` | Subjectwise & sectional test series |
| `/app1.5/upsc.php` | Default | `includes/upsc/default.php` | UPSC Ayurveda MO preparation portal |
| `/app1.5/prev-years.php` | Default | `includes/prev_year_entrance/default.php` | 125+ solved previous year exam papers |
| `/app1.5/category.php` | Default | `includes/catwise_questions/default.php` | Question bank overview & 57,375 counters |
| `/app1.5/category.php` | `action=samhitas` | `includes/catwise_questions/samhitas.php` | 16 Samhitawise question banks |
| `/app1.5/category.php` | `action=subjects` | `includes/catwise_questions/subjects.php` | 9 Ayurveda subjectwise question banks |
| `/app1.5/category.php` | `action=tags` | `includes/catwise_questions/tags.php` | 6 New Pattern tag formats (Statement, Reason...) |
| `/app1.5/reported_questions.php` | Default | `includes/reported_mcq/default.php` | 41,864 student-reported question resolutions |
| `/app1.5/bookmarks.php` | Default | `includes/bookmarks/default.php` | 3,000 question bookmark revision manager |
| `/app1.5/notes.php` | Default | `includes/notes/short_notes.php` | Topicwise clinical notes & sticky notes |
| `/app1.5/mnemonics.php` | Default | `includes/mnemonics/default.php` | Classical memorization tricks & shloka codes |
| `/app1.5/tips.php` | Default | `includes/tips/default.php` | Exam strategies & toppers' study advice |
| `/app1.5/audio-video.php` | Default | `includes/av_lecture/default.php` | 2,071 Audio Book lectures (676+ hours) |
| `/app1.5/myScore.php` | Default | `includes/score_card/default.php` | Test attempt reports, accuracy & ranking |
| `/app1.5/forum.php` | Default | `includes/forum/default.php` | Community forum across 6 categories |
| `/app1.5/myWallet.php` | Default | `includes/wallet/default.php` | Points balance (100 pts) & recharge ledger |
| `/app1.5/membership.php` | Default | `includes/membership/default.php` | Subscriptions: Test Series, Video, Audio |
| `/app1.5/books.php` | Default | `includes/books/default.php` | Partner bookstore (12 entrance titles) |
| `/app1.5/invites.php` | Default | `includes/invites/default.php` | Referral rewards & social sharing (Code 126448) |
| `/app1.5/myProfile.php` | Default | `includes/profile/default.php` | Student profile, target exam, chat toggle |
| `/app1.5/about.php` | Default | `includes/about/default.php` | Academic council & credentials |
| `/app1.5/contact.php` | Default | `includes/contact/default.php` | WhatsApp helpline & support desk |
| `/app1.5/logout.php` | Default | `includes/common/sessions.php` | Session invalidation and redirect to login |

---

## 2. Interactive Learning Engine Routes

| Engine Route | Operational Mode | Execution Characteristics |
|---|---|---|
| `/quiz/:id?mode=exam` | **AIAPGET Exam Simulation** | 120 questions, 120 minutes, 480 marks, NTA color palette (gray/orange/green/purple), -1 negative marking penalty. |
| `/quiz/practice?sam_id=:id` | **Samhita Practice Mode** | Immediate answer evaluation, Sanskrit shloka references, audio cues, per-question timer. |
| `/quiz/practice?sub_id=:id` | **Subject Practice Mode** | Questions filtered by subject ID (Kayachikitsa, Rog Nidana, Dravyaguna, etc.). |
| `/quiz/practice?tag=:type` | **Tag Practice Mode** | Statement, Assertion-Reason, Numerical, Match-Making question formats. |
| `/quiz/:id/results` | **Examination Analysis** | Itemized score breakdown, percentage accuracy, time per question, and solution review. |
| `/lecture/:courseId/:lectureId` | **Classroom Player** | Video playback with 0.75x–2.0x speed, chapter indexing, and printable PDF study slips. |

