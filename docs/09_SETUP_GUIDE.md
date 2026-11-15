# Developer Setup & Localhost Replica Onboarding Guide

## 1. Prerequisites

Before setting up the AyurQuest 1.5 replica, ensure your local development machine meets these requirements:
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **Operating System:** Windows 10/11, macOS, or Linux
- **Modern Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox
- **Network Connection:** Required for initial dependency installation and upstream Vimeo video embeds

---

## 2. Repository Layout

```
ayurquest/
├── client/                     # React 18 + Vite Frontend Application
│   ├── public/                 # Authentic harvested production assets & media
│   │   ├── assets/images/      # Logos, Samhita icons, cover banners
│   │   ├── assets/css/         # Production style.css, quiz.css, etc.
│   │   ├── assets/icons/font/  # Flaticon webfonts
│   │   └── assets/audio/       # Correct/wrong answer MP3 sound effects
│   ├── src/                    # TypeScript components, pages, and API client
│   ├── vite.config.ts          # Vite proxy configuration (Port 3000 -> 5000)
│   └── package.json
├── server/                     # Node.js + Express Backend API Adapter
│   ├── src/
│   │   ├── data/               # Samhitas, courses, questions, quizzes & local store
│   │   ├── routes/             # RESTful /api routes & legacy PHP adapters
│   │   └── server.ts           # Express server entry point
│   ├── local_store.json        # Persistent local state database
│   ├── tsconfig.json
│   └── package.json
└── docs/                       # 10 comprehensive architectural reports
```

---

## 3. Installation Steps

### Step 1: Install Backend Dependencies & Compile TypeScript
Open your terminal in the repository root:
```bash
cd server
npm install
npm run build
```

### Step 2: Configure Environment Variables
Verify or create `server/.env`:
```env
PORT=5000
LOCAL_DEV_NO_LOGIN=true
AYURQUEST_BASE_URL=https://ayurquest.com/app1.5/
NODE_ENV=development
```

### Step 3: Install Frontend Dependencies
```bash
cd ../client
npm install
npm run build
```

---

## 4. Launching the Localhost Replica

To run the application, open two terminal windows (or background tasks):

### Terminal 1: Start Backend API Adapter (Port 5000)
```bash
cd server
npm start
```
*Expected Console Output:*
```
=======================================================
  AyurQuest 1.5 Local Backend Adapter & Replica Server
  Running on: http://localhost:5000
  Mode: LOCAL_DEV_NO_LOGIN=true
=======================================================
```

### Terminal 2: Start Frontend Development Server (Port 3000)
```bash
cd client
npm run dev
```
*Expected Console Output:*
```
  VITE v6.4.6  ready in 450 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://<local-ip>:3000/
```

---

## 5. Navigating the Application

1. Open your web browser and navigate to:
   ```
   http://localhost:3000/
   ```
2. The application opens **directly into the Learning Dashboard** without prompting for phone number, password, or OTP.
3. Access core modules:
   - **Video Courses:** `http://localhost:3000/courses`
   - **Lecture Player:** `http://localhost:3000/lecture/aiapget-2027/1001`
   - **Samhita Question Bank:** `http://localhost:3000/question-bank`
   - **Practice Mode:** `http://localhost:3000/quiz/practice`
   - **Daily Tests & Mocks:** `http://localhost:3000/quizzes`
   - **My Bookmarks:** `http://localhost:3000/bookmarks`
   - **Personal Notes:** `http://localhost:3000/notes`
   - **Score Card & Analytics:** `http://localhost:3000/scorecard`
   - **Wallet Points:** `http://localhost:3000/wallet`
   - **Developer Diagnostics:** `http://localhost:3000/dev/diagnostics`

---

## 6. Troubleshooting & FAQ

| Symptom | Cause | Solution |
|---|---|---|
| Port 5000 already in use | Previous node server process running | Run `taskkill /F /IM node.exe` (Windows) or `pkill -f node` (Linux) |
| Port 3000 already in use | Previous Vite process running | Pass `--port 3001` or terminate conflicting process |
| Audio feedback does not play | Browser autoplay policy blocked audio before user click | Click anywhere on the webpage to grant audio playback permission |
| Upstream reachability shows offline | Machine is offline or DNS issue reaching `ayurquest.com` | Ensure internet connectivity; local features continue functioning normally via local database |

