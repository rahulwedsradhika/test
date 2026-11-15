# UI Visual & Structural Design Audit

## 1. Executive Visual Overview

To reproduce the exact look and feel of AyurQuest 1.5, the localhost replica incorporates the authentic production stylesheets, icon webfonts, SVG symbol sprites, and asset imagery harvested directly from the live application origin (`https://ayurquest.com/app1.5/`).

---

## 2. Color Palette & Typography Hierarchy

### 2.1. Brand Colors
- **Primary Brand Aqua (`#2aacdd`):** Navigation bar background, active link indicators, action buttons, progress bars.
- **Dark Brand Accent (`#2098c7` / `#1b6ca8`):** Logo header background, banner gradients, hover states.
- **Sidebar Charcoal (`#222d32`):** Fixed left navigation container.
- **Sidebar Active Dark (`#1e282c`):** Active navigation list item background.
- **Background Light Gray (`#f4f6f9`):** Application wrapper background (`.content-wrapper`).
- **Card White (`#ffffff`):** Content cards, test panels, modals, questions.
- **Success Green (`#27ae60` / `#00a65a`):** Correct answers, high accuracy badges, active status.
- **Warning Yellow/Orange (`#f39c12` / `#e67e22`):** Bookmarks, timed exam markers, exam targets.
- **Danger Red (`#e74c3c` / `#dd4b39`):** Incorrect answer options, test submission, negative marks.

### 2.2. Typography Hierarchy
- **Primary Font Family:** `'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Heading 1 / Page Title:** 24px, Bold (700), Color `#2c3e50`
- **Heading 2 / Course Title:** 20px - 22px, Semi-Bold (600), Color `#2c3e50`
- **Question Stem:** 16px, Semi-Bold (600), Line-Height 1.6, Color `#2c3e50`
- **Answer Choices:** 14px - 15px, Regular (400) / Semi-Bold (600), Color `#333`
- **Explanations & Commentary:** 13px - 14px, Regular (400), Line-Height 1.6, Color `#444`
- **Sidebar & Metadata:** 11px - 13px, Regular (400) / Medium (500), Color `#b8c7ce` / `#888`

---

## 3. Harvested Production Assets & Stylesheets

### 3.1. Stylesheet Inventory
- `client/public/assets/css/style.css`: Core AdminLTE skin and layout definitions.
- `client/public/assets/css/quiz.css`: MCQ question formatting, option lists, and commentary panels.
- `client/public/assets/css/home_ribbon.css`: Ribbon styling for dashboard tiles (`.ribbon`, `.ribbon span`).
- `client/public/assets/icons/font/flaticon.css`: Authentic Flaticon CSS rules mapping glyph classes to unicode characters.

### 3.2. Webfonts
- `client/public/assets/icons/font/Flaticon.woff` & `Flaticon.ttf`: Authentic icon font containing AyurQuest's custom learning glyphs.
- FontAwesome v4.7.0 (loaded via CDN fallback for universal compatibility).

### 3.3. Harvested Imagery & Media (64 Files)
- **Logos & Branding:**
  - `client/public/assets/images/logo.png` (30x30 and 42x42 user avatars)
  - `client/public/assets/favicons/favicon_16x16.png`
- **Course Cover Banners:**
  - `client/public/assets/images/courses/cover/new_lectures_qbank-aiapget-2028.jpg`
  - `client/public/assets/images/courses/cover/new_ayurquest-lectures_aiapget_upsc.jpg`
  - `client/public/assets/images/courses/cover/new_curofy_online_video_lectures.jpg`
  - `client/public/assets/images/courses/cover/aiapget-2027.png`
  - `client/public/assets/images/courses/cover/upsc-2025.png`
  - `client/public/assets/images/courses/cover/hppsc.png`, `uppsc.png`
- **Classical Samhita Icons (16 Treatise Logos):**
  - `charaka-samhita.png`, `sushruta-samhita.png`, `ashtanga-hridaya.png`, `ashtanga-samgraha.png`, `madhava-nidana.png`, `sharngadhara-samhita.png`, `bhavaprakasha.png`, `kashyapa-samhita.png`, `bhela-samhita.png`, `harita-samhita.png`, `chakradatta.png`, `rasa-tarangini.png`, `rasa-ratna-samucchaya.png`, `dravyaguna-vijnana.png`, `bhaishajya-kalpana.png`, `kaumarbhritya.png`.
- **Audio Feedback Sound Effects:**
  - `client/public/assets/audio/correct-enhanced-v2-90p.mp3`
  - `client/public/assets/audio/wrong-enhanced-v2-90p.mp3`
- **SVG Symbols Sprite:**
  - Extracted 350 KB SVG definitions into `client/src/components/SvgSprite.tsx` containing symbols `#file`, `#file-1`, `#video-camera`, `#invention`, `#settings`, `#user-profile`, `#about-us`, `#business-and-finance`, `#notepad`, etc.

---

## 4. Multi-Device Viewport Audit

The replica UI was verified across 5 standard target viewport dimensions:

| Viewport Resolution | Device Category | Layout Behavior | Visual Verification |
|---|---|---|:---:|
| **1920 × 1080** | Wide Desktop Monitor | 4 dashboard tiles per row; side-by-side lecture player and full playlist; 5-column exam question palette | **PASSED** |
| **1440 × 900** | Standard Laptop | 4 dashboard tiles per row; optimal 16:9 lecture embed; complete sidebar navigation | **PASSED** |
| **768 × 1024** | Tablet (iPad Portrait) | 2 dashboard tiles per row; collapsed mini-sidebar with toggle; stacked question options | **PASSED** |
| **390 × 844** | Modern Mobile (iPhone 13/14) | 1 column dashboard tiles; slide-out off-canvas menu; touch-friendly 44px option hit targets | **PASSED** |
| **360 × 800** | Standard Android Phone | Full-width mobile layout; compact question card; floating timer badge; sticky navigation | **PASSED** |

