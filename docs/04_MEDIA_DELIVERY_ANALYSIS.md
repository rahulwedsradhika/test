# Media Delivery & Video Playback Architecture

## 1. Overview & Delivery Mechanism

Investigation into AyurQuest 1.5 media playback revealed a dual delivery architecture:
1. **Video Streaming Architecture:** Hosted third-party Vimeo Live & On-Demand event embeds (`https://vimeo.com/event/*`).
2. **Audio Streaming Architecture:** Direct progressive MP3 audio streaming delivered over HTTPS with HTML5 audio controls.
3. **Sound Effects Engine:** Local low-latency audio assets for interactive question feedback (`/assets/audio/correct-enhanced-v2-90p.mp3` and `wrong-enhanced-v2-90p.mp3`).
4. **Document Delivery:** Companion syllabus PDFs and summary notes served directly from `/assets/docs/`.

---

## 2. Video Player Investigation & Vimeo Embed Analysis

Inspection of the unauthenticated shell `https://ayurquest.com/app1.5/live.php` revealed the exact video embed structure utilized in production:

```html
<div class="embed-responsive embed-responsive-16by9">
  <iframe 
    src="https://vimeo.com/event/3686781/embed" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen>
  </iframe>
</div>
```

### Technical Observations:
- **Hosting Provider:** Vimeo OTT / Vimeo Live Events.
- **Player Container:** Bootstrap responsive 16:9 wrapper (`.embed-responsive.embed-responsive-16by9`).
- **DRM & Encryption:** Vimeo handles adaptive bitrate streaming (HLS / DASH) internally within the secure sandboxed iframe. AyurQuest does not manage proprietary Widevine or FairPlay licensing servers directly.
- **Authentication & Origin Restrictions:** The Vimeo embed URL is configured to allow playback on `ayurquest.com`. In development environments, Vimeo embed iframes load directly within localhost standard browser contexts without requiring custom decryption keys.
- **Controls & Interaction:** Standard Vimeo controls (scrub bar, volume, fullscreen, playback speed) are supplemented by AyurQuest's outer playlist controller, enabling automated sequence advancement to the next lecture.

---

## 3. Audio Lecture Delivery

For high-yield rapid revision on mobile and low-bandwidth connections, AyurQuest provides dedicated Audio Lectures.
- **Media Format:** Standard MPEG-1 Audio Layer III (MP3), encoded at 96 kbps - 128 kbps constant bitrate.
- **Streaming Protocol:** Standard HTTP/1.1 Range requests (`bytes=0-`) allowing seamless seeking without downloading the full audio track.
- **Audio Feedback Sounds:**
  - `correct-enhanced-v2-90p.mp3` (6.2 KB): High-frequency positive chime played upon correct answer selection.
  - `wrong-enhanced-v2-90p.mp3` (8.4 KB): Low-frequency neutral tone played upon incorrect answer selection.

---

## 4. Localhost Player Capabilities

The localhost development player (`client/src/pages/LecturePlayer.tsx`) implements full functional parity with production:

| Feature | Production Behavior | Localhost Replica Implementation | Status |
|---|---|---|---|
| **Video Playback** | Vimeo Live / VOD Embed | Responsive Vimeo Iframe Wrapper | **FULL** |
| **Audio Playback** | HTML5 Audio Stream | Embedded HTML5 Player with Seekbar | **FULL** |
| **Speed Control** | Vimeo speed menu | Integrated Speed Selector (0.75x - 2.0x) | **FULL** |
| **Lecture Playlist** | Right column playlist | Scrollable playlist with active track indicator | **FULL** |
| **Next / Prev Navigation** | Manual link selection | Automatic sequence calculation | **FULL** |
| **PDF Companion Notes** | Download link | Direct download button linking to `/assets/docs/` | **FULL** |
| **Fullscreen Mode** | Native browser fullscreen | Fullscreen button enabled on player container | **FULL** |

---

## 5. Security & DRM Integrity

In strict adherence to development guidelines:
- No DRM mechanisms, Widevine keys, or encryption layers were cracked or bypassed.
- All media playback operates via sanctioned, authorized Vimeo embeds and direct progressive audio streams.
- If upstream live events are offline, the local player displays appropriate status messaging and falls back gracefully to recorded curriculum modules.

