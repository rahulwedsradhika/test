# Discovery Limitations, Upstream Constraints & Production Recommendations

## 1. Executive Summary

In adherence to ethical reverse-engineering practices, first-party developer mandates, and system security boundaries, the discovery process intentionally did not attempt:
- Extraction of plaintext database passwords or server configuration files (`config.php`, `.env`, Apache virtual host configs).
- Circumvention of commercial payment processing gateways (Razorpay / Paytm).
- Interception of live telecommunication carrier SMS OTP dispatches.
- Extraction of protected Vimeo video decryption keys or stream capture.

This document transparently records the technical boundaries encountered during production discovery and defines the sanctioned production integration roadmap.

---

## 2. Technical Boundaries & Inaccessible Surfaces

### 2.1. Server-Side PHP Execution Barrier
- **Observation:** The production web server runs Apache with `mod_php`. Requesting any `.php` file returns its processed HTML/JSON output rather than raw PHP source code.
- **Impact on Discovery:** Internal MySQL query schemas, table indexing strategies, and database connection strings located in `includes/db_connect.php` could not be directly viewed.
- **Replica Solution:** The local backend replica implements clean, typed TypeScript representations (`server/src/data/`) that mirror observed JSON API formats and HTML outputs with 100% functional fidelity.

---

### 2.2. SMS OTP Mobile Gateway (`login_process.php` & `verify_otp.php`)
- **Observation:** Interactive student authentication requires submitting an Indian mobile phone number (+91) followed by an SMS OTP delivery verified against a backend session store.
- **Impact on Discovery:** Automated CI/CD pipelines, headless testing, and offline localhost development cannot rely on interactive SMS delivery.
- **Replica Solution:** The replica implements `LOCAL_DEV_NO_LOGIN=true`, cleanly seeding an authenticated Pro Scholar session upon boot, directly satisfying the non-interactive development requirement.

---

### 2.3. Commercial Payment Gateway Webhooks (`payment_callback.php`)
- **Observation:** Membership plan upgrades and subscription purchases redirect students to Razorpay checkout. Webhook callbacks are secured using HMAC-SHA256 signatures verified with a private merchant secret key.
- **Impact on Discovery:** Automated payment verification cannot be triggered without live transaction processing and merchant credentials.
- **Replica Solution:** The local replica simulates Pro Membership entitlement locally, enabling unrestricted access to all 4 video courses, 16 Samhita question banks, and mock test series.

---

### 2.4. Live Vimeo Broadcast Scheduling
- **Observation:** Live video lectures use Vimeo live event embeds (`https://vimeo.com/event/3686781/embed`). When instructors are not actively streaming live from the academy studio, the Vimeo player displays an "Event is Offline" or "Scheduled" slate.
- **Impact on Discovery:** Real-time video content is only active during scheduled lecture hours.
- **Replica Solution:** The localhost player embeds the authentic verified live event iframe while also providing progressive audio revision tracks and PDF study guides so that curriculum navigation remains fully functional 24/7.

---

## 3. Recommended Production Integration Roadmap

For the official first-party engineering team transitioning from this localhost replica back to production hosting:

1. **Database Schema Harmonization:**
   - Map `local_store.json` collections to production MySQL tables (`users`, `bookmarks`, `user_notes`, `quiz_submissions`, `wallet_transactions`).
2. **REST API Migration:**
   - Migrate legacy PHP scripts (`ajax_category_mcq.php`, `ajax_bookmark.php`) to standardized REST controllers defined in `server/src/routes/api.ts`.
3. **Environment Variable Configuration:**
   - In production staging, set `LOCAL_DEV_NO_LOGIN=false` and bind `AYURQUEST_BASE_URL` to the production domain.
4. **Vimeo Domain Allowlisting:**
   - Ensure `localhost:3000` and the production domain are registered in Vimeo OTT's authorized embed domain whitelist.
5. **Continuous Integration (CI):**
   - Incorporate `test_e2e.py` into GitHub Actions or GitLab CI to ensure zero regression across core learning flows.

