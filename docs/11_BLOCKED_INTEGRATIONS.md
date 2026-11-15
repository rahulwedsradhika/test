# 11 — AYURQUEST 1.5 BLOCKED INTEGRATIONS & EXTERNAL BOUNDARY ANALYSIS

**System Context:** Localhost Development Replica  
**Security & Compliance Directive:** No unauthorized credential probing, credential spoofing, or bypass of external security boundaries  
**Date:** November 2026  

---

## 1. Overview of External Production Boundaries

The production AyurQuest 1.5 platform integrates with several third-party external service providers. In accordance with strict software engineering standards, these services require private vendor API credentials that are not bundled into client-side bundles. The localhost replica cleanly isolates these dependencies through local adapters:

```
+-------------------------------------------------------------------------+
|                  AyurQuest Localhost Replica Runtime                    |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  |  Zero-Login Adapter    |             |  Razorpay Simulation Stub  |  |
|  |  (Bypasses SMS OTP)    |             |  (Simulates ₹0 Test Modes) |  |
|  +------------------------+             +----------------------------+  |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  |  In-Memory Data Store  |             |  Local Audio/Video Stream  |  |
|  |  (57,375 MCQs Offline) |             |  (Bypasses Signed Cookies) |  |
|  +------------------------+             +----------------------------+  |
+-------------------------------------------------------------------------+
                                     |
                       [Boundary Isolations]
                                     |
  x-- Remote SMS Gateway (MSG91 / Gupshup)
  x-- Remote Razorpay Live Payment Gateway
  x-- Remote Signed CDN Media Servers (Vimeo OTT / CloudFront)
  x-- Production MySQL Master Database Server
```

---

## 2. Inventory of Isolated Third-Party Integrations

### 1. SMS OTP Authentication Service (Production: MSG91 / Gupshup)
- **Production Role:** Sends 6-digit one-time passwords to students' mobile phones during initial registration and login.
- **Localhost Boundary Handling:**
  - `LOCAL_DEV_NO_LOGIN=true` is enabled by default.
  - Express backend automatically initializes session state for user `Vd. Rohit` (`rohit@ayurquest.com`, phone `9876543210`).
  - No remote SMS gateway calls are attempted, ensuring offline usability without phone carrier dependency.

### 2. Commercial Payment Gateway (Production: Razorpay / Cashfree)
- **Production Role:** Processes UPI, Net Banking, credit card, and debit card transactions for courses (₹5999/₹9999) and subscription plans (₹650/₹1499).
- **Localhost Boundary Handling:**
  - Mock payment modal simulates immediate transaction authorization.
  - Generates realistic numeric transaction IDs (e.g. `TRANSACTION ID: 3100874`).
  - Grants instant access to test series, courses, and audio lectures without real monetary deductions.

### 3. DRM & Signed Token Video Streaming (Production: Vimeo OTT / CloudFront CDN)
- **Production Role:** Delivers proprietary lecture videos protected with HMAC-SHA256 signed cookie tokens and origin referrer restrictions.
- **Localhost Boundary Handling:**
  - Local classroom player utilizes HTML5 video streams with high-definition fallback educational lectures.
  - Video resolution controls (360p, 480p, 720p, 1080p) and playback speed rates (0.75x–2.0x) function dynamically.

### 4. Direct Production Database Cluster (Production: MySQL Server)
- **Production Role:** Hosts user records, question banks, and live attempt tables.
- **Localhost Boundary Handling:**
  - The local replica uses `server/src/data/database.ts` with comprehensive seed data containing the full taxonomy of 16 Samhitas, 9 subjects, and 6 question tag formats.
  - Prevents external database connection errors or latency issues during local development.

### 5. Live WhatsApp Faculty Helpdesk
- **Production Role:** Connects students directly to AyurQuest counseling and technical assistance.
- **Localhost Boundary Handling:**
  - Deep links open standard `https://wa.me/919172000000` URLs in a new browser tab, allowing realistic student engagement without backend webhook requirements.

