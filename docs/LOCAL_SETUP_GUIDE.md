# AYURQUEST 1.5 LOCALHOST REPLICA — LOCAL SETUP & DEVELOPER GUIDE

**Origin Production Reference:** `https://ayurquest.com/app1.5/index.php`  
**Target Platform:** Windows / macOS / Linux Localhost Development  
**Zero-Login Access Mode:** `LOCAL_DEV_NO_LOGIN=true` (Pre-configured)  
**Date:** November 2026  

---

## 1. System Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** 3.8+ (for automated verification scripts)
- **Modern Web Browser:** Chrome, Edge, Firefox, or Safari

---

## 2. Quick Start (Run in 2 Minutes)

The workspace is organized into two primary folders: `server/` (Express backend adapter) and `client/` (React Vite frontend).

### Step 1: Start the Backend Server (Port 5000)
Open a terminal in the project root:
```bash
cd server
npm install
npm run build
node dist/server.js
```
*The server will start on `http://localhost:5000` with `LOCAL_DEV_NO_LOGIN=true`.*

### Step 2: Start the Frontend Client (Port 3000)
Open a second terminal in the project root:
```bash
cd client
npm install
npx vite --port 3000 --host
```
*The Vite development server will start on `http://localhost:3000`.*

### Step 3: Open the Application in Your Browser
Navigate directly to:
```
http://localhost:3000/app1.5/index.php
```
*The application will load immediately with the authentic AyurQuest 1.5 interface, pre-authenticated as Vd. Rohit with 100 wallet points.*

---

## 3. Production Route Reference (All Functional)

You can navigate directly to any authentic production route in your browser:

| Section | Route URL | Purpose |
|---|---|---|
| **Home Dashboard** | `http://localhost:3000/app1.5/index.php` | Main learning dashboard |
| **Courses Catalogue** | `http://localhost:3000/app1.5/courses.php` | AIAPGET & UPSC course packages |
| **AIAPGET Mock Tests** | `http://localhost:3000/app1.5/ayush-npget.php?action=mock_test` | 2027/26/25/24 mock tests |
| **UPSC Entrance** | `http://localhost:3000/app1.5/upsc.php` | UPSC MO daily rapid fire & papers |
| **Previous Year Papers** | `http://localhost:3000/app1.5/prev-years.php` | 125+ solved previous year papers |
| **Question Bank Root** | `http://localhost:3000/app1.5/category.php` | 57,375 total questions overview |
| **Samhitawise MCQs** | `http://localhost:3000/app1.5/category.php?action=samhitas` | 16 Samhita question banks |
| **Subjectwise MCQs** | `http://localhost:3000/app1.5/category.php?action=subjects` | 9 Ayurveda subject question banks |
| **New Pattern MCQs** | `http://localhost:3000/app1.5/category.php?action=tags` | Statement, assertion, numerical MCQs |
| **Short Notes** | `http://localhost:3000/app1.5/notes.php` | Topicwise Hindi revision notes |
| **Mnemonics** | `http://localhost:3000/app1.5/mnemonics.php` | 10 Hindi memorization tricks |
| **Study Tips** | `http://localhost:3000/app1.5/tips.php` | Toppers study guidelines |
| **Audio Lectures** | `http://localhost:3000/app1.5/audio-video.php` | 2,071 chapterwise audio lectures |
| **Score Card** | `http://localhost:3000/app1.5/myScore.php` | Test attempt reports & analytics |
| **Bookmarks** | `http://localhost:3000/app1.5/bookmarks.php` | 3,000 bookmark revision engine |
| **Reported MCQs** | `http://localhost:3000/app1.5/reported_questions.php` | 41,864 reported questions & answers |
| **Discussion Forum** | `http://localhost:3000/app1.5/forum.php` | Peer forum across 6 categories |
| **My Wallet** | `http://localhost:3000/app1.5/myWallet.php` | Points balance (100) & recharge |
| **Subscriptions** | `http://localhost:3000/app1.5/membership.php` | Membership plans (₹650/₹1499) |
| **Book Store** | `http://localhost:3000/app1.5/books.php` | 12 Ayurveda entrance books |
| **Invite Friends** | `http://localhost:3000/app1.5/invites.php` | Referral code 126448 & rewards |
| **My Profile** | `http://localhost:3000/app1.5/myProfile.php` | Student profile & chat toggle |
| **About Us** | `http://localhost:3000/app1.5/about.php` | Academic council & credentials |
| **Contact Us** | `http://localhost:3000/app1.5/contact.php` | WhatsApp helpline & support |

---

## 4. Running the Automated Verification Suite

To verify that all 25 production routes, 7 backend REST APIs, and legacy AJAX proxies are running with 100% success:
```bash
python test_routes_verification.py
```
Expected output:
```
ALL ROUTES & ENDPOINTS VERIFIED: 100% OPERATIONAL WITH 0 ERRORS
```

---

## 5. Configuration Options (`server/.env`)

```ini
# Server Port (default 5000)
PORT=5000

# Enable direct developer access without SMS/OTP prompts
LOCAL_DEV_NO_LOGIN=true

# Local User Pre-population
USER_NAME="Rohit"
USER_EMAIL="rohit@ayurquest.com"
USER_WALLET_POINTS=100
```

