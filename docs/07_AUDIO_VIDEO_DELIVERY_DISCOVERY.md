# 07 — AYURQUEST 1.5 AUDIO & VIDEO MEDIA DELIVERY INFRASTRUCTURE

**Origin Route:** `/app1.5/audio-video.php`  
**Reference Screenshot:** `Screenshot 2026-11-14 192606.png`  
**Total Audio Catalog:** 2,071 High-Definition Lectures (676 Hours 21 Min)  
**Total Video Catalog:** 1,000+ Classroom Video Hours  
**Date:** November 2026  

---

## 1. Media Delivery Overview

AyurQuest 1.5 pioneered specialized audio-based Ayurvedic learning designed for students commuting to college, clinical hospital duty, or memorizing Sanskrit shlokas. The media architecture is divided into two distinct subsystems:
1. **Audio Book & Chapterwise Recitation Engine (`/app1.5/audio-video.php`)**
2. **Video Classroom & Interactive Lecture Player (`/lecture/:courseId/:lectureId`)**

---

## 2. Audio Book Architecture & Specifications

### A. High-Level Metrics (Screenshot 192606.png)
- **Total Audio Lectures:** **2,071**
- **Total Catalog Duration:** **676 Hours / 21 Minutes**
- **Registered Audio Listeners:** **14,232 Students**

### B. The 3 Primary Audio Categories

| Category | Total Lectures | Duration | Classical Content & Scope |
|---|---|---|---|
| **Samhita's Lectures** | **1,288** | 394 Hrs / 19 Min | Shloka recitation, Pada-chheda, and grammatical explanation of Charaka Samhita, Sushruta Samhita, and Ashtanga Hridaya. |
| **Subject's Lectures** | **695** | 244 Hrs / 11 Min | Comprehensive lectures on Kayachikitsa, Dravyaguna (Rasapanchaka audio guides), Rasa Shastra, Shalya, and Shalakya. |
| **Book's Lectures** | **910** | 357 Hrs / 58 Min | Audio renditions of Ayurveda Samgraha, competitive exam boosters, and rapid revision notes. |

### C. Audio Player Features
- Native HTML5 Audio Player with custom playback controls.
- Speed Adjustment: 0.8x, 1.0x, 1.25x, 1.5x, 2.0x (essential for rapid revision).
- Background Playback support on mobile devices.
- Interactive chapter playlist with active lecture highlighting.

---

## 3. Video Lecture Delivery Architecture

- **Classroom Player (`LecturePlayer.tsx`):**
  - High-definition video player container with 16:9 responsive aspect ratio.
  - Controls: Play/pause, seek bar, time display, volume control, fullscreen toggle.
  - Dual-pane layout:
    - Left/Top Pane: Video classroom instruction by expert tutors.
    - Right/Bottom Pane: Interactive chapter index, synchronized timestamp markers, and embedded PDF study notes viewer.
- **Delivery Protocols:**
  - Streaming via HTTPS video blobs and progressive MP4/HLS fallback.
  - Quality Switcher: Auto, 360p (low data), 480p, 720p, 1080p Full HD.
  - Offline Download option in mobile application builds.

---

## 4. Localhost Emulation & Fallback Strategy

In the localhost development replica:
- Audio tracks are served through verified HTML5 audio streams with local sample fallbacks (`SoundHelix` high-quality audio samples).
- Video lectures utilize sample MP4 educational lecture feeds and interactive slides to simulate realistic bandwidth and seeking behavior without requiring remote cloud CDN subscription keys.

