# Veyora — Every occasion, extraordinary.
**AI-powered event planning, beautifully simplified.**

Created by **Md Tarique**  
*First-year B.Tech Electronics and VLSI Design student at Jamia Millia Islamia*  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-172033?style=flat&logo=linkedin&logoColor=E8D4A8)](https://www.linkedin.com/in/md-tarique-516476447)
[![GitHub](https://img.shields.io/badge/GitHub-MdTarique2908-172033?style=flat&logo=github&logoColor=E8D4A8)](https://github.com/MdTarique2908)

---

## ✨ Overview

**Veyora** is a luxury, full-stack celebration and event-planning SaaS platform engineered to turn abstract celebration ideas into actionable, editorial-grade operational blueprints. Powered by Google Gemini through pure server-side architecture, Veyora unifies spatial venue choreography, real-time bi-directional voice consultation, intelligent financial modeling, motion invitations, and multi-device co-host synchronization into a unified, responsive interface.

---

## 🌟 Key Features

### 1. 🧠 AI Event Architect (Gemini 3.8 Flash)
- **Comprehensive Blueprint Generation:** Translates event type, date, city, guest headcount, budget limit, and style into structured concepts with tailored color palettes (hex swatches), atmosphere vibe keywords, dress code guidance, and operational milestones.
- **Pure Server-Side Security:** All `@google/genai` calls execute exclusively in Node.js Express (`server.ts`). Client bundles never contain or expose secret keys.
- **Graceful Fallbacks:** In the absence of an API key or during network throttling, Veyora activates a procedural blueprint engine that guarantees uninterrupted workflow.

### 2. 🎙️ Gemini 3.8 Live Bi-Directional Voice Consultant
- **Hands-Free Live Voice Call:** Real-time, full-duplex conversational audio streaming via WebSocket (`/live`).
- **Context-Aware Consultation:** Initialized with the full event context (city, guest count, budget status, venue preferences) to provide concise, practical spoken advice on ceremony timing, vendor negotiations, and emergency contingency plans.
- **PCM 16kHz & 24kHz Audio Processing:** Low-latency Web Audio API client pipeline with recording pulse animations and volume meters.

### 3. 🏛️ Interactive 3D Venue & Seating Planner (Three.js)
- **Spatial Floor Choreography:** Real-time 3D isometric and free-roam camera modes with PBR lighting (Daylight, Warm Ambient, Evening Gala).
- **Table & Seating Inspector:** Round banquet tables, rectangular family tables, stage backdrops, dance floors, bars, and podiums.
- **Real-Time Capacity Headcount:** Tracks total seated vs unallocated guests against the guest headcount budget with instant spatial collision awareness.

### 4. 📍 Google Maps Venue Discovery with AI Grounding
- **Real-World Local Venue Discovery:** Searches grounded venues based on city, guest capacity, and venue preference (`/api/venues/search-maps`).
- **Interactive Information Cards:** Formats address, guest suitability, pricing benchmarks, and rating highlights with direct Google Maps external links.

### 5. 🎬 Motion Video Invitation Studio & Lyria Music Studio
- **Gemini Omni Motion Teasers:** Generates animated MP4 invitations and dynamic canvas particle animations formatted in widescreen (`16:9`) or vertical story (`9:16`) aspect ratios.
- **Lyria AI Theme Fanfare:** Synthesizes custom celebratory background music tracks across styles (Acoustic Folk, Classical Strings, Modern Pop Gala, Jazz Lounge, Cinematic Orchestral) paired with a live frequency visualizer.

### 6. 📊 Intelligent Itemized Budget Planner (Recharts)
- **4-Mode Analytical Visualizations:**
  1. **Donut Share:** Category percentages with centered total estimated allocation.
  2. **Ranked Bar:** Hierarchical vertical spend ranking.
  3. **Market Variance & Realism Index:** Benchmarks allocations against city market standard percentiles (`Balanced`, `High Spend`, `Lean`).
  4. **Month-over-Month Cashflow Trend:** Predicts milestone payment disbursements (Month -3, -2, -1, Event Day).
- **Global Currency Converter:** 10 real-time currencies (USD, EUR, GBP, INR, CAD, AUD, JPY, SGD, CHF, AED) with one-click base currency commit.
- **AI Smart Re-Allocate Assistant:** Automatically rebalances over-budget allocations by protecting essential line items and trimming discretionary costs with full rationale diffs.

### 7. 🤝 Multi-Device Co-Host Cloud Sync (Firebase Auth & Firestore)
- **Real-Time Collaboration:** Synchronizes guest lists, milestone checklists, and run-of-show edits across mobile phones, tablets, and desktops.
- **Dual-Storage Resilience:** Instant offline persistence in `localStorage` paired with seamless Firestore cloud synchronization.

### 8. 🌓 Dual Mode & Editorial Luxury Design System
- **Warm Ivory Light Mode (`#F8F7F3`):** Editorial aesthetics with Midnight Navy typography (`#172033`) and Champagne Gold accents (`#E8D4A8`).
- **Obsidian Dark Mode (`#0D131F`):** Deep navy canvas, elevated cards (`#131B2B`), and muted gold highlights.
- **Print / PDF Briefs:** Dedicated `@media print` engine generating multi-page executive event briefs.
- **RFC 5545 iCalendar:** 1-click `.ics` download and Google Calendar web link integration with customizable alarms.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8, `@tailwindcss/vite` v4 |
| **Icons & Typography** | Lucide React, Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*) |
| **3D & Spatial Graphics** | Three.js (WebGL, PerspectiveCamera, OrbitControls, PBR Materials) |
| **Data Visualization** | Recharts (ResponsiveContainer, AreaChart, BarChart, PieChart, Tooltips) |
| **Motion & Effects** | Motion (`motion/react`), HTML5 Canvas API, Canvas-Confetti |
| **Audio Processing** | Web Audio API (AudioContext, PCM Float32 to Int16, Base64 streaming) |
| **Backend & WebSockets**| Node.js, Express, WebSocket (`ws`), `tsx` runtime |
| **AI Models & SDK** | `@google/genai` (Gemini 3.8 Flash, Gemini 3.8 Live, Gemini 3.1 Flash Image/Video) |
| **Collaboration & Auth** | Firebase SDK (Authentication, Firestore Database, Offline fallback) |

---

## 🚀 Setup & Local Development

### Prerequisites
- Node.js `v18.0.0` or higher (Node `v20+` or `v22+` recommended)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_GITHUB_OR_PORTFOLIO/veyora.git
cd veyora
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root (see `.env.example`):
```env
# Required for Gemini AI generation & Live Voice WebSocket:
GEMINI_API_KEY="your-gemini-api-key"

# Port (optional, defaults to 3000):
PORT=3000

# Set to production when running production server:
NODE_ENV=production
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Testing

### 1. Run Type Check
```bash
npm run lint
```
*Result: Clean compilation with 0 TypeScript errors.*

### 2. Build Production Bundle
```bash
npm run build
```
*Result: Generates optimized client bundle in `dist/` with gzip compression.*

### 3. Run Production Server
```bash
npm start
```
When `NODE_ENV=production`, `server.ts` automatically serves the pre-built `dist/` production assets and provides the full REST and WebSocket API endpoints.

---

## ☁️ Recommended Deployment Options

Because Veyora features both an Express REST API and a persistent bi-directional **WebSocket connection** (`/live` for Gemini 3.8 Live Audio), the recommended hosting platforms are container or Node.js application services that support long-lived WebSocket connections:

1. **Google Cloud Run (Recommended & Native):**
   - Ideal match for Gemini API latency and official Google Cloud ecosystem.
   - Fully supports WebSockets with HTTP/2 and auto-scaling to zero.
   - Simply configure `GEMINI_API_KEY` in Cloud Run Secret Manager.

2. **Render (Web Service):**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Native WebSocket support out-of-the-box on port `3000` or `$PORT`.

3. **Railway / Fly.io:**
   - One-click deploy from GitHub repository.
   - Native WebSocket handling with low cold-start times.

> *Note: Static-only hosting (e.g. GitHub Pages or Vercel static) is not suitable by itself without a backend adapter, as Veyora requires the Node.js server for secure server-side Gemini API calls and WebSocket audio streaming.*

---

## 👤 Creator & Attribution

**Veyora — Every occasion, extraordinary.**  
Designed and engineered by **Md Tarique**.  
- **Education:** First-year B.Tech Electronics and VLSI Design student at **Jamia Millia Islamia**  
- **LinkedIn:** [linkedin.com/in/md-tarique-516476447](https://www.linkedin.com/in/md-tarique-516476447)  
- **Portfolio / GitHub:** [github.com/MdTarique2908](https://github.com/MdTarique2908)  

---

## 📄 License
This project is licensed under the MIT License.
