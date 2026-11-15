# PRO SUBSCRIPTION LOCAL DEVELOPMENT USER CONFIGURATION

**Application:** AyurQuest 1.5 Local Development Environment  
**Mode:** Zero-Interactive-Login Pro Development Profile  
**Specification Level:** Mandatory P0 Requirement  

---

## 1. Overview & Behavioral Specification

The localhost AyurQuest environment operates with a permanent, zero-barrier **Pro Subscription Development Profile**.

### Expected User Experience
1. **No Interactive Login Required:** Opening `http://localhost:3000` or `http://localhost:5000` immediately opens the application dashboard without blocking on mobile OTP or credentials.
2. **Pro Development Identity:** The active user profile is configured with `subscription_tier: "PRO"` and `user_type: "TEST_STUDENT"`.
3. **Unlocked Learning Features:** All locally implemented Pro educational features are enabled, including:
   - Full Question Bank access across 16 Classical Samhitas.
   - Core Subjectwise question banks.
   - NTA/AIAPGET New Pattern tagged questions (Assertion-Reason, Numerical, Fill in Blank, Statement).
   - Interactive Test Engine with Evaluation Mode, Practice Mode, and AIAPGET Examination Simulator.
   - Full explanation keys and classical shloka references.
   - Faculty-resolved question discrepancy archive.
   - Video and audio lecture playback.
   - Real-time bookmarking and personal sticky notes saved to SQLite.
   - Persistent test scoring and performance diagnostics.

---

## 2. Environment Variables Configuration

The environment configuration is established in `.env` and `server/.env`:

```ini
# Permanent Local Development Pro Configuration
LOCAL_DEV_NO_LOGIN=true
LOCAL_DEV_SUBSCRIPTION=PRO
LOCAL_DEV_USER_TYPE=TEST_STUDENT
LOCAL_DEV_USER_ID=local_dev_user
LOCAL_DEV_USER_NAME="Rohit (Pro Dev User)"
LOCAL_DEV_USER_EMAIL="rohit@ayurquest.local"

# Port Assignments
PORT=5000
LOCAL_PORT=5000
FRONTEND_PORT=3000

# Upstream Production Target Reference
AYURQUEST_BASE_URL=https://ayurquest.com/app1.5/
AYURQUEST_API_BASE_URL=https://ayurquest.com/app1.5/
AYURQUEST_DEV_CREDENTIAL_REFERENCE=authorized_dev_identity
MEDIA_INTEGRATION_MODE=authorized
REQUEST_TIMEOUT=8000
CACHE_TTL=300

# Secure Server-Side Upstream Credentials (Never exposed to client)
PROD_SESSION_COOKIE="PHPSESSID=8ljh52u54bd84q0is60ka09km3"
PROD_USER_NAME="Rohit"
```

---

## 3. Database Representation

The local development user identity is stored in `server/data/ayurquest.db` under the `user_profile` table:

```sql
INSERT OR REPLACE INTO user_profile (
    id, name, email, phone, subscription_tier, user_type, is_pro
) VALUES (
    'local_dev_user',
    'Rohit (Pro Dev User)',
    'rohit@ayurquest.local',
    '+917006923314',
    'PRO',
    'TEST_STUDENT',
    1
);
```

### Profile Retrieval API (`GET /api/profile`)
```json
{
  "id": "local_dev_user",
  "name": "Rohit (Pro Dev User)",
  "email": "rohit@ayurquest.local",
  "phone": "+917006923314",
  "subscription_tier": "PRO",
  "user_type": "TEST_STUDENT",
  "is_pro": 1,
  "local_no_login": true,
  "features": {
    "allQuestionsUnlocked": true,
    "allSamhitasUnlocked": true,
    "allSubjectsUnlocked": true,
    "allTagsUnlocked": true,
    "aiapgetMockTests": true,
    "reportedQuestionsResolution": true,
    "audioVideoLectures": true,
    "explanationsAndReferences": true
  }
}
```

---

## 4. Important Security & Authorization Distinction

In strict compliance with project guidelines and Section 4 of the critical directive:

1. **Local vs Upstream Isolation:**
   - The local `LOCAL_DEV_SUBSCRIPTION=PRO` setting exclusively governs access to the local Express backend, Vite frontend, and local SQLite question database.
   - It **does not** forge or falsify credentials against AyurQuest's production servers.
   - When communicating with upstream production endpoints, the backend uses the legitimate session cookie (`PHPSESSID=8ljh52u54bd84q0is60ka09km3`) belonging to the project owner's authorized account.
2. **No Frontend Credential Leakage:**
   - Production session cookies, tokens, and secrets are strictly confined to the backend server environment (`server/.env`).
   - Zero authentication tokens or cookies are bundled into the client-side React code.
3. **Respect for Production Boundaries:**
   - Gated upstream production tests that require server-side paid subscription (e.g. live 2026 test series) are cleanly recognized as requiring production subscription upgrade without attempting unauthorized circumvention.

