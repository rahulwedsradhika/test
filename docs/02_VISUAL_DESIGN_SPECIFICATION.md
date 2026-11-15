# 02 — AYURQUEST 1.5 VISUAL DESIGN SPECIFICATION & COMPONENT SYSTEM

**Authoritative Baseline:** 24 High-Resolution Production Screenshots  
**System Theme:** Sky Blue (`#2aacdd`) & Pale Cyan (`#eef9fb` / `#d2f2fa`) with Pink/Magenta Accents (`#e83e8c` / `#d81b60`)  
**Typography:** Open Sans, Helvetica Neue, Arial, sans-serif  
**Target Environment:** Localhost Development Replica  

---

## 1. Color Palette System

| Color Token | Hex Value | Usage in Production Interface |
|---|---|---|
| **Primary Sky Blue** | `#2aacdd` | Main top header bar, sliding drawer background, active buttons, course stats ribbons, section headers |
| **Secondary Pale Cyan** | `#eef9fb` | Hero illustration background boxes, active selection cards, stats badges, info containers |
| **Accent Pink / Magenta** | `#e83e8c` / `#d81b60` | Question mark badges (`?`), expand buttons (`+`), "Subscribe" buttons, "Listen Now" pills, tab underlines |
| **Card Pale Tint** | `#d2f2fa` | Question bank overview cards, Samhita/Subject cards, audio lecture category cards |
| **Text Dark Navy** | `#2c3e50` | Primary page headings, course titles, test names, active sidebar item text |
| **Text Muted Gray** | `#6c757d` / `#8c9ba5` | Subtitles, footnotes, durations, question references, metadata |
| **Success Emerald** | `#28a745` | Solved indicators, correct option highlights, positive points (`+100 Points`), active tags |
| **Danger Crimson** | `#dc3545` | Incorrect option indicators, strikethrough original prices, logout button |
| **Background Light Gray** | `#f4f6f9` | Master page background, off-canvas backdrop (`rgba(0,0,0,0.35)`) |

---

## 2. Header Component Architecture (`Header.tsx`)

- **Height:** 50px fixed sticky header
- **Background:** `#2aacdd` (Sky Blue)
- **Elevation:** `0 2px 4px rgba(0,0,0,0.1)`
- **Left Region:**
  - Hamburger menu icon (`☰`, 22px white font-awesome `fa fa-bars`)
  - User greeting: `Hello Rohit, Welcome to AyurQuest Education` (13px, font-weight 400 with bold spans)
- **Right Region:**
  - `Back` button with return icon (`↺`, white, 13px)
  - `Dashboard` link with home icon (`⌂`, white, 13px)
  - `Subscribe` pill button (`#e83e8c` pink background with white bold text or white bordered badge)

---

## 3. Sidebar Drawer Architecture (`Sidebar.tsx`)

- **Width:** 260px fixed width sliding drawer
- **Background:** `#2aacdd`
- **Animation:** `left 0.25s ease-in-out` (slides from -280px off-screen to 0)
- **Drawer Header:**
  - Circular white emblem container (72px diameter, `border-radius: 50%`) containing the AyurQuest logo
  - Bold title: `AyurQuest` in 20px white bold text
  - Close cross (`✕`, 22px) in top right corner
- **Navigation Items (27 Items):**
  - **Inactive Item:** Transparent background, pure white text (`#ffffff`), 13px, font-awesome icon on left with 14px gap
  - **Hover State:** `rgba(255, 255, 255, 0.15)` subtle translucent white highlight
  - **Active Selected Item:** Pure white background (`#ffffff`), dark navy text (`#2c3e50`), bold font-weight (`600`), extends edge-to-edge

---

## 4. Page Hero Illustration Container (`PageHeroIllustration.tsx`)

All primary learning pages feature a distinctive top hero container:
- **Background:** Soft pale cyan (`#eef9fb`)
- **Border:** `1px solid #d8edf3` or `1px solid #d9f0f5`
- **Padding:** 25px 15px (desktop)
- **Centering:** Perfectly centered themed vector artwork
- **Themed Vector Sets:**
  1. `mock_test`: Golden trophy with ribbon, two students seated at modern monitors
  2. `upsc`: Classical university dome building with columns and national flag
  3. `prev_years`: Examination checklist clipboard with tick marks and vintage red/gold seal
  4. `samhitas`: Stacked classical Ayurvedic codices and manuscripts with bookmark ribbon
  5. `subjects`: Open anatomy and medical textbook with stethoscope
  6. `tags`: Medical knowledge tag cloud with magnifying glass and examination sheet
  7. `audio_video`: Student listening with modern headphones next to mobile player
  8. `bookmarks`: Smartphone displaying verified checklist and prominent green ribbon
  9. `reported`: Question mark speech bubble surrounded by student discussion dialogs
  10. `wallet`: Digital wallet holding coins, debit cards, and reward stars
  11. `invites`: Girl announcing with megaphone and envelope rewards
  12. `scorecard`: Podium trophy, ranking laurel wreath, and analytics report

---

## 5. Content Card Systems

### A. Question Bank & Samhita Cards
- **Card Background:** Light sky tint (`#d2f2fa`)
- **Border:** `1px solid #bce6f2`
- **Border Radius:** 10px
- **Hover:** Elevates 2px with `#2aacdd` border highlight
- **Icon Badge:** Pink circle (`#e83e8c`) with white question mark (`?`)
- **Count Ribbon:** White capsule with `#2aacdd` bold count digits

### B. Course Cards (`CoursesPage.tsx`)
- **Container:** Pure white card (`#ffffff`) with 1px border (`#e1e8ed`)
- **Header Badge:** `AIAPGET FAST TRACK` or `COMPREHENSIVE BATCH`
- **Discount Badge:** Green `SAVE 40%` pill
- **Price Block:** Large bold price `₹5999` / `₹9999` with strikethrough original MRP
- **Feature Checkmarks:** Emerald checkmarks (`✓`) next to key offerings

### C. Accordion Expanders (`NotesPage.tsx` & `MnemonicsPage.tsx`)
- **Header:** White or pale cyan strip with full Devnagari/Hindi title
- **Action Button:** Vivid pink circle (`#e83e8c`) containing white plus (`+`) or minus (`-`)
- **Body Panel:** Expands smoothly to display full classical shloka, transliteration, Hindi meaning, and high-yield mnemonic phrase

---

## 6. Typography & Responsive Breakpoints

```css
/* Responsive Grid Breakpoints */
@media (max-width: 768px) {
  .header-greeting { display: none; }
  .hero-box { flex-direction: column; text-align: center; }
  .courses-grid { grid-template-columns: 1fr; }
  .samhita-grid { grid-template-columns: 1fr; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .courses-grid { grid-template-columns: repeat(2, 1fr); }
  .samhita-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1025px) {
  .courses-grid { grid-template-columns: repeat(2, 1fr); }
  .samhita-grid { grid-template-columns: repeat(2, 1fr); }
  .books-grid { grid-template-columns: repeat(4, 1fr); }
}
```

