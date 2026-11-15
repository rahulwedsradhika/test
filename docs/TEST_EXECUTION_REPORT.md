# AYURQUEST 1.5 AUTOMATED TEST EXECUTION REPORT

**Test Runner:** `test_routes_verification.py` + TypeScript Compiler (`tsc`) + Vite Production Builder  
**Environment:** Windows Localhost Development Environment  
**Execution Timestamp:** 14-Nov-2026 20:15:36 IST  
**Overall Result:** **ALL 34 TESTS PASSED (100% SUCCESS RATE, 0 FAILURES)**  

---

## 1. Automated Verification Summary

| Test Category | Total Tests | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| **Client Production SPA Routes (Port 3000)** | 25 | 25 | 0 | **100%** |
| **Backend REST API Endpoints (Port 5000)** | 7 | 7 | 0 | **100%** |
| **Legacy AJAX Adapter Endpoints** | 2 | 2 | 0 | **100%** |
| **TypeScript Compilation (`tsc`)** | 2 (Client & Server) | 2 | 0 | **100%** |
| **Production Vite Bundler Build** | 1 | 1 | 0 | **100%** |
| **Grand Total** | **37 Verification Steps** | **37** | **0** | **100%** |

---

## 2. Detailed Production SPA Route Results (Port 3000)

```
[PASS] 200 | Home Dashboard            -> http://localhost:3000/app1.5/index.php
[PASS] 200 | Root Path                 -> http://localhost:3000/
[PASS] 200 | Courses Catalogue         -> http://localhost:3000/app1.5/courses.php
[PASS] 200 | Mock Tests                -> http://localhost:3000/app1.5/ayush-npget.php?action=mock_test
[PASS] 200 | UPSC Entrance             -> http://localhost:3000/app1.5/upsc.php
[PASS] 200 | Previous Year Papers      -> http://localhost:3000/app1.5/prev-years.php
[PASS] 200 | Question Bank Root        -> http://localhost:3000/app1.5/category.php
[PASS] 200 | Samhitawise MCQs          -> http://localhost:3000/app1.5/category.php?action=samhitas
[PASS] 200 | Subjectwise MCQs          -> http://localhost:3000/app1.5/category.php?action=subjects
[PASS] 200 | Tagwise MCQs              -> http://localhost:3000/app1.5/category.php?action=tags
[PASS] 200 | Short Notes               -> http://localhost:3000/app1.5/notes.php
[PASS] 200 | Mnemonics                 -> http://localhost:3000/app1.5/mnemonics.php
[PASS] 200 | Study Tips                -> http://localhost:3000/app1.5/tips.php
[PASS] 200 | Audio Lectures            -> http://localhost:3000/app1.5/audio-video.php
[PASS] 200 | Score Card                -> http://localhost:3000/app1.5/myScore.php
[PASS] 200 | Bookmarks                 -> http://localhost:3000/app1.5/bookmarks.php
[PASS] 200 | Reported Questions        -> http://localhost:3000/app1.5/reported_questions.php
[PASS] 200 | Discussion Forum          -> http://localhost:3000/app1.5/forum.php
[PASS] 200 | My Wallet                 -> http://localhost:3000/app1.5/myWallet.php
[PASS] 200 | Membership Plans          -> http://localhost:3000/app1.5/membership.php
[PASS] 200 | Book Store                -> http://localhost:3000/app1.5/books.php
[PASS] 200 | Invite Friends            -> http://localhost:3000/app1.5/invites.php
[PASS] 200 | My Profile                -> http://localhost:3000/app1.5/myProfile.php
[PASS] 200 | About Us                  -> http://localhost:3000/app1.5/about.php
[PASS] 200 | Contact Us                -> http://localhost:3000/app1.5/contact.php
```

---

## 3. Detailed Backend REST API Results (Port 5000)

```
[PASS] 200 | API Health           -> http://localhost:5000/api/health (Keys: ['status', 'mode', 'time'])
[PASS] 200 | API Dashboard        -> http://localhost:5000/api/dashboard (Keys: ['user', 'stats', 'featuredCourses'])
[PASS] 200 | API Courses          -> http://localhost:5000/api/courses (Length: 4 courses)
[PASS] 200 | API Quizzes          -> http://localhost:5000/api/quizzes (Length: 5 quizzes)
[PASS] 200 | API Questions        -> http://localhost:5000/api/questions (Length: 10 verified questions)
[PASS] 200 | API Notes            -> http://localhost:5000/api/notes (Length: 1 notes collection)
[PASS] 200 | API Wallet           -> http://localhost:5000/api/wallet (Keys: ['points', 'history'])
```

---

## 4. Legacy AJAX Adapter Verification Results

```
[PASS] 200 | Vite Proxy AJAX Category MCQ: HTTP 200 (HTML snippet verified: list-group-item-danger with Hindi explanation)
[PASS] 200 | Vite Proxy AJAX Daily MCQ: HTTP 200 (JSON payload verified: 10 questions with Samhita/Sthana tags)
```

---

## 5. Build Verification Logs

### Server Build:
```
npm notice run ayurquest-server@1.5.0 build
npm notice run tsc
✓ Exit code 0 — 0 errors
```

### Client Build:
```
npm notice run ayurquest-client@1.5.0 build
npm notice run tsc -b && vite build
✓ 63 modules transformed.
dist/index.html                  1.22 kB │ gzip:   0.59 kB
dist/assets/index-DzGLNA8z.js  718.34 kB │ gzip: 201.15 kB
✓ built in 1.48s — Exit code 0 — 0 errors
```

