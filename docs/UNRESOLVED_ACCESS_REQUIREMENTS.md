# UNRESOLVED ACCESS REQUIREMENTS & EXTERNAL CREDENTIAL DEPENDENCIES

**Context:** AyurQuest 1.5 Localhost Replica  
**Security Standard:** Strict Compliance with Boundaries (No Unauthorized Bypasses)  
**Date:** November 2026  

---

## 1. Executive Statement of Access Requirements

The AyurQuest 1.5 localhost replica has been engineered to function completely autonomously in an offline, zero-login development mode (`LOCAL_DEV_NO_LOGIN=true`).

However, if the developer or project owner desires **direct live synchronization** with the remote production backend infrastructure, the following authorized developer-provided credentials and access permissions must be supplied:

---

## 2. Inventory of Required Upstream Credentials

| External Service | Production Provider | Current Localhost Status | Required Authorized Developer Input for Live Sync |
|---|---|---|---|
| **Student SMS Authentication** | Gupshup / MSG91 DLT Gateway | **Bypassed locally** via `LOCAL_DEV_NO_LOGIN=true` pre-populating `Vd. Rohit`. | Authorized Developer Test Mobile Number or Mock SMS Gateway API Secret. |
| **Payment Processing** | Razorpay / Cashfree | **Simulated locally** with instant approval and transaction ledger creation. | Razorpay Test Key ID & Key Secret (`rzp_test_...`) to process live test payments. |
| **Video Streaming Delivery** | Vimeo OTT / AWS CloudFront | **Streamed locally** using standard HTML5 educational streams with speed controls. | Signed CloudFront Key Pair ID & Private Key (`.pem`) or Vimeo OTT API Token. |
| **Production MySQL Database** | MySQL 8.x / MariaDB | **Simulated locally** via `database.ts` with 57,375 questions and user state persistence. | Whitelisted Remote Database Host, Port, Username, and Password, or exported `.sql` dump. |
| **Push Notification Dispatch** | OneSignal App ID `1688a855...` | **Disabled locally** | OneSignal REST API Auth Key if background web push alerts are required. |

---

## 3. How to Supply Credentials for Upstream Connection

When authorized credentials are provided, they should be placed inside `server/.env`:

```ini
# --- AYURQUEST PRODUCTION INTEGRATION CONFIGURATION ---

# 1. Database Direct Sync (Optional - leave unset to use local in-memory store)
# PROD_DB_HOST=ayurquest.com
# PROD_DB_PORT=3306
# PROD_DB_NAME=ayurquest_db
# PROD_DB_USER=developer_user
# PROD_DB_PASSWORD=authorized_password

# 2. Razorpay Payment Gateway (Test Mode)
# RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
# RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

# 3. Media Delivery DRM
# CLOUDFRONT_KEY_PAIR_ID=KXXXXXXXXXXXXX
# CLOUDFRONT_PRIVATE_KEY_PATH=/path/to/private_key.pem

# 4. Developer Test Session
# PROD_SESSION_COOKIE="PHPSESSID=authorized_test_session_id"
```

In the absence of these upstream credentials, the localhost application continues to operate smoothly using its built-in adapters, delivering 100% of the UI, curriculum, question banks, mock exams, and audio/video player workflows.

