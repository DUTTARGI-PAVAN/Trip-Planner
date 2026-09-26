# 🌍 WanderPlan AI (YourTripGuide) — Intelligent Travel Itinerary Builder

A modern, resilient full-stack React application that transforms free-form travel prompts into interactive, structured, day-by-day itineraries using LLM structured outputs, automated self-repair, request cancellation, and client-side persistence.

> **Note**: This is **not a chatbot**. The AI returns strictly typed JSON data that is defensively validated by Zod schemas on both the backend and frontend, converted into an interactive React UI allowing users to view, reorder, and remove scheduled stops.

---

## 🚀 Key Features

### 1. Free-Form Prompting & Quick Idea Inspiration
- **Natural Language Input**: Type any destination, duration, vibe, or budget (e.g., *"4 days in Kyoto and Osaka exploring ancient temples and street food markets"*).
- **Curated Idea Chips**: One-click quick suggestion chips to instantly populate rich travel ideas.

### 2. Multi-Tier AI Generation & Automated Self-Repair
- **Strict Structured Outputs**: Utilizes Google Gemini models configured with `responseMimeType: 'application/json'` and `responseSchema` to enforce type safety at generation time.
- **Multi-Model Fallback & Retries**: Cycles through candidate models (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-3.7-flash`) with automatic retries on transient network errors.
- **LLM Self-Repair Mechanism**: If a model produces malformed JSON or fails Zod schema validation, the backend automatically invokes a targeted self-repair pass with the schema error details to correct the output before responding to the client.
- **Backend Timeouts**: Operations are bounded by strict server-side timeouts (`withTimeout`), guarding against stalled upstream API calls.

### 3. In-Flight Request Cancellation & Stale Response Guards
- **User Cancellation**: Instant "Cancel" button during active generation powered by native `AbortController` integration.
- **Combined Timeout & Signal**: Frontend client utilizes unified abort signals (`AbortSignal.any`) with a 50-second timeout.
- **Stale Request Discarding**: Ref-based `requestId` tracking ensures slow or out-of-order responses from superseded requests are discarded without altering the UI state.

### 4. Client-Side State Persistence
- **Local State Sync**: Generated itineraries, current prompt draft, and dark/light theme preferences are automatically synchronized to `localStorage`.
- **Session Recovery**: Users can reload or revisit the application and immediately resume reviewing or editing their saved itinerary without re-generating.
- **Clean Reset**: One-click "Reset Trip" resets current state and clears stored itinerary data.

### 5. Interactive Timeline, Stop Management & Map View
- **Modal Day Inspector**: Expand any day card into a detailed interactive modal featuring both **Timeline** and **Map Route** views.
- **Interactive Leaflet Route Map**: Renders an OpenStreetMap view with custom numbered markers, activity icons (Sightseeing, Dining, Transit), and route polyline sequences using approximate WGS84 coordinates from Gemini.
- **Stop Focus & External Search**: Click any marker or stop card to inspect details and open instant directions in Google Maps.
- **Reorder Stops**: Move itinerary activities up or down (↑ / ↓) with immediate React state updates.
- **Delete Stops**: Remove unwanted stops with empty-state resilience.
- **Share & Export**: Single-click copy of formatted day plans to the clipboard for messaging or travel notes.

### 6. Design System & Theme
- **Glassmorphic Aesthetic**: Modern UI with subtle gradients, card hover states, and smooth micro-animations.
- **Dark / Light Theme Toggle**: Persistent theme switcher respecting system preferences by default.
- **Keyboard Shortcuts**: `Enter` to submit, `Shift + Enter` for multiline input, and `Esc` to dismiss modals.

---

## 🏗️ Architecture & Data Flow

```text
[ Browser / React App ]
       │
       ▼ (POST /api/generate with prompt + AbortSignal)
[ Express Backend Proxy ] ─── Holds GEMINI_API_KEY
       │
       ▼ (Gemini SDK with responseSchema + Timeout)
[ Google Gemini Model ]
       │
       ├─► [Success] ──► Parse JSON ──► Zod Validate ──► Return to Client
       │
       └─► [Parse / Schema Failure]
                 │
                 ▼
         [ Self-Repair Pass ] ──► Corrects payload ──► Return to Client
```

---

## 📁 Project Structure

```text
Trip-Planner/
├── client/                          # Frontend Vite + React application
│   ├── src/
│   │   ├── assets/                  # Brand assets (logos, icons)
│   │   ├── components/
│   │   │   ├── DayDetailModal.jsx   # Interactive timeline: view, reorder & delete stops
│   │   │   ├── ErrorState.jsx       # Shared error banner with retry handler
│   │   │   ├── LoadingState.jsx     # Animated skeleton cards during generation
│   │   │   ├── PromptInput.jsx      # Chat composer with quiet suggestion chips
│   │   │   └── ResultView.jsx       # Itinerary grid, overview banner, quick ideas
│   │   ├── lib/
│   │   │   ├── api.js               # Proxy API client with AbortSignal & timeout support
│   │   │   └── validateResult.js    # Client-side Zod schema validation
│   │   ├── App.jsx                  # Main application orchestrator & persistence logic
│   │   ├── App.css                  # Custom CSS design system & dark/light theme tokens
│   │   ├── index.css                # Base CSS resets and typography
│   │   └── main.jsx                 # React entrypoint
│   ├── package.json
│   └── vite.config.js
├── server/                          # Backend Proxy server
│   ├── index.js                     # Express server, Gemini SDK, Zod schemas, self-repair loop
│   └── package.json
├── .env.example                     # Environment variables template
└── README.md
```

---

## 🛡️ Error Handling & Defensive Strategy

| Failure Mode | Detection & Backend Handling | UI Presentation & Action |
| :--- | :--- | :--- |
| **Malformed JSON** (`MALFORMED_JSON`) | Catches JSON parse error; triggers automated LLM self-repair pass. If repair fails, returns HTTP 422 with `MALFORMED_JSON`. | 🧩 **Malformed AI Output** banner + parse error badge + prompt rephrase suggestion. |
| **Schema Inconsistency / Wrong Shape** (`INVALID_SHAPE`) | Zod `ItinerarySchema` validation failure triggers automated LLM schema self-repair; frontend secondary Zod pass guards state. | 📐 **Incomplete Itinerary Structure** banner + schema mismatch badge + duration/destination clarity tip. |
| **Empty AI Response** (`EMPTY_OUTPUT`) | Detects zero/empty response; attempts fallback model. | 📭 **Empty AI Output** banner + empty response badge + stream interruption retry. |
| **Generation Timeout** (`TIMEOUT_ERROR`) | Server-side 35s timeout (`withTimeout`) + client-side 50s abort controller. | ⏱️ **Request Timed Out** banner + timeout badge + shorter itinerary duration tip. |
| **Network Failure** (`NETWORK_ERROR`) | Frontend fetch catch handler classifies network/CORS/offline disconnection. | 📡 **Network Connection Failed** banner + server check tip (`npm run dev`). |
| **Service Overload** (`SERVICE_UNAVAILABLE`) | Catches upstream rate-limiting (429/503/RESOURCE_EXHAUSTED); cycles fallback models. | 🚦 **AI Service Busy** banner + 503 badge + wait & retry action. |
| **User Cancellation** (`ABORT_ERROR`) | `AbortController` cancel button terminates in-flight request cleanly without raising error toasts. | UI immediately resets loading state smoothly. |
| **Stale Async Returns** | Ref-based `requestId` tracking discards superseded asynchronous responses. | Prevents older out-of-order requests from overwriting current state. |

---

## 🛠️ Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Google Gemini API Key** ([Get one at Google AI Studio](https://aistudio.google.com/))

### 2. Setup Backend Server
```bash
cd server
npm install
```
Create a `.env` file in `server/`:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```
Start the backend:
```bash
npm run dev
# Server running on http://localhost:3000
```

### 3. Setup Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

---

## 🤖 AI Usage Disclosure

- **AI Tools Used**: Google Antigravity IDE & Gemini models for component scaffolding, CSS token formulation, and API integration testing.
- **Original Architecture**: Custom multi-model fallback pipeline, server-side LLM self-repair routines, client-side Zod validation contracts, AbortController cancellation handling, and interactive stop reordering/deletion state machines were designed and implemented specifically for this project.

---

## 📝 License
MIT License
