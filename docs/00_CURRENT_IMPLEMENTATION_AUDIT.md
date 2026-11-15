# Current Implementation Audit & Remediation Plan

## 1. Executive Summary

This audit evaluates the preliminary AyurQuest 1.5 replica against the 24 authoritative production screenshots provided in `AyurQuest_24_Production_Screenshots_and_Route_Map.zip`.

While the initial build established a solid Node.js backend adapter, local JSON state persistence, and basic component shells, the visual styling and navigation diverged significantly from the authentic production application. The preliminary build utilized a generic AdminLTE dark sidebar and custom REST URL paths rather than replicating the exact sky-blue theme, original PHP route hierarchy, and real educational content captured in the production screenshots.

---

## 2. Comprehensive Feature-by-Feature Audit

| Feature / Screen | Production Route | Previous Status | Flaws Identified | Required Fix | Verification Procedure |
|---|---|---|---|---|---|
| **Header** | Global | Working but visually inaccurate | Dark blue background (`#2098c7`), AdminLTE user pill, missing direct `Back`, `Dashboard`, and `Subscribe` white action buttons | Rebuild with sky-blue (`#2aacdd`), hamburger icon, `Hello Rohit, Welcome to AyurQuest Education`, white `C Back`, `Dashboard`, and `Subscribe` buttons | Verify against `Screenshot 2026-11-14 192307.png` |
| **Sidebar Navigation** | Global | Working but visually inaccurate | Dark charcoal background (`#222d32`), generic treeview, missing the 27 exact production entries in order | Rebuild with full sky-blue background (`#2aacdd`), circular logo, white text/icons, active/hover item turning WHITE with dark text, and all 27 exact entries | Verify against `Screenshot 2026-11-14 192325.png` & `192334.png` |
| **Home Dashboard** | `/app1.5/index.php` | Visually inaccurate | 21 tiles grid from `dashboard.php` rendered directly instead of the authentic welcome banner, "Go to Dashboard" button, quote, and "WHATS NEW FOR AIAPGET" cards | Implement exact welcome banner, quote, orange "Go to Dashboard" button, and grid of AIAPGET 2028 cards | Verify against `Screenshot 2026-11-14 192307.png` |
| **Courses Catalogue** | `/app1.5/courses.php` | Missing real data & layout | Rendered 4 generic courses in modern card grid; missing the 1000+ Hrs / 10+ Tutors / 13600+ Students ribbon, "Prep Courses for AIAPGET" vs "UPSC/PSC" tabs, exact pricing (₹5999 & ₹9999), and WhatsApp/EMI bars | Reconstruct exact header, statistics strip, tabs, course cards, discount badges, pricing, and More Details actions | Verify against `Screenshot 2026-11-14 192345.png` |
| **Mock Tests** | `/app1.5/ayush-npget.php?action=mock_test` | Wrong route & layout | Used `/quizzes?mode=mock`; missing the trophy hero illustration, Year tabs (2027/26/25/24), All/Solved/Unsolved filter, and Mock Test-1 card with 480 marks/120 MCQs/120 min | Implement exact route, hero illustration, year tabs, filter tabs, and Mock Test-1 card | Verify against `Screenshot 2026-11-14 192355.png` |
| **UPSC Ayurveda** | `/app1.5/upsc.php` | Completely missing | Route did not exist; relied on generic course type | Build `/app1.5/upsc.php` with university building illustration, Daily Rapid Fire / Question challenge cards, and 4 UPSC list items | Verify against `Screenshot 2026-11-14 192404.png` |
| **Previous Year Papers** | `/app1.5/prev-years.php` | Completely missing | Route did not exist | Build `/app1.5/prev-years.php` with checklist illustration and 3 centered test cards (All Ayurveda, Post Graduate, UPSC) | Verify against `Screenshot 2026-11-14 192417.png` |
| **Question Bank Home** | `/app1.5/category.php` | Wrong route & layout | Used `/question-bank`; missing 57375 count, Subscription/Support blue buttons, Solved 0 / Unsolved 57375 icons, and Samhitawise / Subjectwise cards | Build `/app1.5/category.php` matching exact layout and stats | Verify against `Screenshot 2026-11-14 192437.png` |
| **Samhitawise MCQs** | `/app1.5/category.php?action=samhitas` | Wrong layout | Simple grid; missing the stacked books illustration, list layout with pink question mark icons, question counts (11175, 8709, etc.), and Devanagari titles | Rebuild list with exact question counts, pink question badges, and Devanagari labels | Verify against `Screenshot 2026-11-14 192446.png` |
| **Subjectwise MCQs** | `/app1.5/category.php?action=subjects` | Completely missing | Relied on placeholder dropdown | Build `/app1.5/category.php?action=subjects` with open book illustration, 9 subjects, and black pill question count badges | Verify against `Screenshot 2026-11-14 192500.png` |
| **Tagwise MCQs** | `/app1.5/category.php?action=tags` | Completely missing | Route did not exist | Build `/app1.5/category.php?action=tags` with 6 tagwise question formats (Statement, Reason Assertion, Match Making, Numerical, Fill in blank, Image) | Verify against `Screenshot 2026-11-14 192523.png` |
| **Short Notes** | `/app1.5/notes.php` | Wrong layout | Used generic sticky note cards; missing the authentic 10 Hindi short notes accordion with pink `+` expand buttons and Sticky Notes button | Rebuild with exact 10 Hindi short notes, Sticky Notes button, and expand/collapse logic | Verify against `Screenshot 2026-11-14 192535.png` |
| **Mnemonics** | `/app1.5/mnemonics.php` | Completely missing | Route did not exist | Build `/app1.5/mnemonics.php` with exact 10 Hindi mnemonics and pink `+` expand buttons | Verify against `Screenshot 2026-11-14 192543.png` |
| **Study Tips** | `/app1.5/tips.php` | Completely missing | Route did not exist | Build `/app1.5/tips.php` with Toppers Study Tips banner and 9 General Tips with pink lightbulb icons | Verify against `Screenshot 2026-11-14 192557.png` |
| **Audio Lectures** | `/app1.5/audio-video.php` | Wrong layout & counts | Simple player; missing the mobile phone/headphones illustration, 3 category cards (Samhita 1288, Subject 695, Book 910), and bottom summary bar (2071 lectures, 676 hrs) | Reconstruct exact layout, 3 cards, and bottom summary ribbon | Verify against `Screenshot 2026-11-14 192606.png` |
| **Score Card** | `/app1.5/myScore.php` | Wrong route & layout | Used `/scorecard` with custom boxes; missing trophy illustration and dataTable pagination | Rebuild `/app1.5/myScore.php` with exact empty/populated state and table layout | Verify against `Screenshot 2026-11-14 192616.png` |
| **Bookmarks** | `/app1.5/bookmarks.php` | Wrong layout | Card grid; missing screen illustration, 3000 limit, and Samhitas/Subjects breakdown | Rebuild `/app1.5/bookmarks.php` with exact metrics and cards | Verify against `Screenshot 2026-11-14 192625.png` |
| **Reported MCQs** | `/app1.5/reported_questions.php` | Completely missing | Route did not exist | Build `/app1.5/reported_questions.php` with Q&A illustration, 41864 count, authentic MCQ, user query and Dr. Vandana resolution | Verify against `Screenshot 2026-11-14 192641.png` |
| **Discussion Forum** | `/app1.5/forum.php` | Completely missing | Route did not exist | Build `/app1.5/forum.php` with 6 categories and topic counts | Verify against `Screenshot 2026-11-14 192652.png` |
| **My Wallet** | `/app1.5/myWallet.php` | Wrong route & layout | Used `/wallet`; missing wallet illustration, 100 Balance, Recharge/Free Points buttons, and Transaction 3100874 | Discovered verified route `/app1.5/myWallet.php`; implement exact layout and transaction card | Verify against `Screenshot 2026-11-14 192703.png` |
| **Membership Plans** | `/app1.5/membership.php` | Completely missing | Route did not exist | Build `/app1.5/membership.php` with 3 subscription cards (Test Series ₹650, Video ₹1499, Audio) | Verify against `Screenshot 2026-11-14 192714.png` |
| **Book Store** | `/app1.5/books.php` | Completely missing | Route did not exist | Build `/app1.5/books.php` with 3x4 grid of 12 authentic Ayurveda competitive entrance books | Verify against `Screenshot 2026-11-14 192730.png` |
| **Invite Friends** | `/app1.5/invites.php` | Completely missing | Route did not exist | Build `/app1.5/invites.php` with megaphone illustration, referral link, referral code 126448, copy buttons, and social share icons | Verify against `Screenshot 2026-11-14 192742.png` |
| **My Profile** | `/app1.5/myProfile.php` | Completely missing | Route did not exist | Build `/app1.5/myProfile.php` with Vd. Rohit, member since Nov 2026, 100 Wallet/Expense/Deposit, account settings, and on/off chat toggle | Verify against `Screenshot 2026-11-14 192750.png` |

---

## 3. Underlying Technical Causes & Required Architecture Shifts

1. **Theme / Skin Departure:** The previous implementation assumed a standard dark AdminLTE theme (`#222d32`). The actual production site uses a custom sky-blue theme (`#2aacdd`) with bright blue sliding navigation and white/pink accents.
2. **Route Mismatch:** Previous routes were generic React SPA routes (`/courses`, `/quizzes`, etc.). They must be mapped to the exact production PHP route format (`/app1.5/*.php`) with query parameter support.
3. **Missing Illustrated Hero Banners:** In production, nearly every page has a themed SVG/vector illustration on a pale-cyan background (`#eef9fb`) representing the subject matter. These must be created as high-fidelity SVG components.
4. **Missing Production Data Fixtures:** The short notes, mnemonics, reported question resolution, books catalog, and forum topics were missing. We must populate them with the verified content visible in the screenshots.

---

## 4. Execution Plan & Rollback Safety

- Maintain working backend server on port 5000 and proxy in Vite.
- Create modular page components in `client/src/pages/production/` matching each production route.
- Configure `client/src/App.tsx` to handle both `/app1.5/*.php` and root routes.
- Execute automated end-to-end tests and visual verification tests.

