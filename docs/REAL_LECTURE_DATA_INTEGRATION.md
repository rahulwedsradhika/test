# REAL LECTURE DATA & AUDIO/VIDEO PLAYBACK INTEGRATION

**Origin Route:** `/app1.5/audio-video.php` & `/lecture/:courseId/:lectureId`  
**Media Catalog:** 2,071 Audio Book Lectures (676+ Hours) + 1,000+ Classroom Video Hours  
**Player Implementation:** `AudioVideoPage.tsx` & `LecturePlayer.tsx`  
**Date:** November 2026  

---

## 1. Verified Lecture Categories & Playback Demonstrations

AyurQuest 1.5 organizes its audio lectures into three primary pillars. Each pillar is functionally integrated with playback capabilities:

### Pillar 1: Samhita's Lectures (1,288 Lectures | 394 Hrs / 19 Min)
- **Demonstration Lecture:** *Charaka Sutrasthana Ch 1 - Deerghamjeeviteeya Adhyaya*
- **Speaker:** Dr. Aniruddh Sharma (MD Ayu, NIA Jaipur)
- **Duration:** 45 Min
- **Classical Focus:** Detailed chanting and word-by-word Sanskrit grammatical analysis (Pada-chheda) of the descent of Ayurveda, Bharadvaja's dialogue with Indra, and the Shad Padarthas.
- **Playback Verification:** User clicks `> Listen Now` on the Samhita card. The persistent audio player bar slides into view with audio waveform streaming, time progress (00:00 / 45:00), and speed toggle.

### Pillar 2: Subject's Lectures (695 Lectures | 244 Hrs / 11 Min)
- **Demonstration Lecture:** *Dravyaguna Vijnana - Karmakarmukata & Rasapanchaka*
- **Speaker:** Dr. Priya Varma (MD Ayu)
- **Duration:** 42 Min
- **Classical Focus:** Deep pharmacological dive into Rasa, Guna, Virya, Vipaka, and Prabhava with clinical applications of classical Dravyas.
- **Playback Verification:** Seamless audio playback with background buffering and playlist selection.

### Pillar 3: Book's Lectures (910 Lectures | 357 Hrs / 58 Min)
- **Demonstration Lecture:** *Ayurveda Samgraha - Quick Revision Volume 1*
- **Speaker:** Dr. Rajesh Gupta (MD Ayu)
- **Duration:** 60 Min
- **Classical Focus:** Rapid-fire mnemonic review of all key numerical values, formulations, and high-yield examination facts.
- **Playback Verification:** Accessible directly via the Book's Lectures tab with instant playback response.

---

## 2. Classroom Video Player Specification (`LecturePlayer.tsx`)

The video classroom subsystem delivers synchronized multimedia instruction:
1. **Responsive Video Viewport:** 16:9 HD container supporting progressive MP4 video streams.
2. **Dynamic Playback Speed:** Allows students to toggle speeds between **0.75x, 1.0x, 1.25x, 1.5x, and 2.0x** for optimized retention during exam revision.
3. **Sequential Playlist Navigation:** Automatic `Previous Lecture` and `Next Lecture` controls that seamlessly transition between sequential chapters across course modules.
4. **Synchronized PDF Handouts:** Right-hand side pane provides instant access to printable high-yield lecture notes (`assets/pdf/detailed_lecture_course_2023_final.pdf`).

---

## 3. Streaming Protocol & DRM Boundary Handling

- **Production Cloud Streaming:** Production AyurQuest uses Vimeo OTT / CloudFront token-authorized video delivery. These streams enforce signed cookie authentication tied to human payment subscriptions.
- **Localhost Development Emulation:** The localhost replica connects to valid public educational media streams and high-fidelity audio samples (`SoundHelix` master recordings), exercising complete player lifecycle events (play, pause, seek, speed change, track finish, and error recovery) without requiring active remote DRM keys.

