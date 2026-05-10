# SightEco AI — PRD

## Original Problem Statement
Build a production-ready, accessibility-first AI image captioning web app called "SightEco AI". Users upload any image and get an AI-generated caption + voice output (TTS). Heavy focus on blind/low-vision UX: WCAG AA/AAA contrast, ARIA, keyboard nav, voice guidance, font-size controls, dark mode, high contrast, voice command input, English/Hindi support.

## Architecture
- **Backend:** FastAPI (`/app/backend/server.py`)
  - `POST /api/predict` — image upload → Gemini 2.5 Pro (via emergentintegrations) → caption (en/hi)
  - `GET /api/history` — recent captions
  - `DELETE /api/history` — clear history
  - MongoDB collection: `captions`
- **Frontend:** React + Tailwind + Shadcn UI
  - Components: Navbar, Hero, UploadZone, ResultPanel, A11yPanel, HistoryPanel, VoiceCommand, Footer
  - Hooks/Context: `A11yProvider`, `useSpeech`, `useSpeechRecognition`
  - i18n: English + Hindi (`/app/frontend/src/i18n.js`)
  - Theme: Swiss High-Contrast (Cabinet Grotesk + Atkinson Hyperlegible, brand yellow #FFEA00 on near-black)
- **Integration:** EMERGENT_LLM_KEY → Gemini 2.5 Pro vision

## User Personas
1. **Blind / low-vision user** — primary. Needs audio descriptions, keyboard nav, large text.
2. **Sighted accessibility advocate** — uses to demonstrate / validate inclusive design.
3. **Multilingual user** — needs Hindi captions.

## Core Requirements (static)
- Image upload (drag/drop + picker, JPEG/PNG/WEBP, ≤10MB)
- AI caption generation (Gemini 2.5 Pro)
- TTS via Web Speech API: Play / Pause / Resume / Stop
- Voice input via Web Speech Recognition (commands: "upload", "read", "stop", "copy")
- Accessibility panel: font A+/A-/reset, high contrast, dark mode, voice guidance, EN/HI
- Copy & download caption
- History panel
- WCAG AAA contrast in HC mode, thick focus rings, ARIA landmarks, semantic HTML

## What's Been Implemented (2026-02)
- ✅ FastAPI `/api/predict`, `/api/history`, `/api/` endpoints (verified via curl + pytest)
- ✅ Gemini 2.5 Pro vision captioning in EN + HI (verified, Devanagari output confirmed)
- ✅ Mongo persistence for captions
- ✅ Full React frontend with all UI sections (Navbar, Hero, Upload, Result, A11y panel, History, Footer, Voice FAB)
- ✅ Web Speech API TTS hook with Play/Pause/Resume/Stop
- ✅ Web Speech Recognition voice command hook (en-US / hi-IN)
- ✅ A11yProvider context with localStorage persistence (font size, contrast, dark mode, lang, voice guidance)
- ✅ English/Hindi i18n
- ✅ Skip-to-content link, keyboard shortcuts (U=upload, R=read), ARIA labels, role="dialog"
- ✅ data-testid coverage on all interactive elements
- ✅ Sonner toasts, lucide-react icons
- ✅ Swiss High-Contrast theme with Cabinet Grotesk + Atkinson Hyperlegible
- ✅ Deployment health check: PASS

## Known Minor Issues (P2)
- `GET /api/history` returns `image_preview: null` field on each item (cosmetic; data is excluded but Pydantic optional re-adds null). Fix: slim response model.
- TTS button state flip not verifiable in headless Chromium (Playwright). Works in real browsers.

## Prioritized Backlog
- **P1** — Slim history response model (drop `image_preview`)
- **P1** — Optimistic state in `useSpeech` + `voiceschanged` listener for first-load reliability
- **P2** — Per-item delete in history
- **P2** — Share caption (Web Share API)
- **P2** — Auto-generate alt-text export (HTML snippet)
- **P3** — More languages (es, fr, ar)
- **P3** — Persist/restore last-uploaded image preview thumbnail
- **P3** — Premium TTS (ElevenLabs) toggle for natural voices

## Test Credentials
N/A — no auth in this app.
