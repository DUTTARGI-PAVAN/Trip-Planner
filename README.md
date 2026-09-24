# 🌍 WanderPlan AI (YourTripGuide) — Intelligent Travel Itinerary Builder

A modern, full-stack React application that converts free-form travel requests into interactive, structured, day-by-day itineraries using LLM structured output.

> **Note**: This is **not a chatbot**. The AI returns strictly typed JSON data that is defensively validated and converted into an interactive React UI allowing users to view, reorder, and remove scheduled stops.

---

## 🚀 Key Features

- **Free-Form Prompt Input**: Type any destination, duration, vibe, or budget into natural language (e.g., *"4 days in Rome and Florence exploring art and local pasta places"*).
- **Date Picker & Quick Idea Chips**: Optionally select a trip start date or choose from curated quick prompts.
- **Strict Structured AI Output**: Leverages Google Gemini 1.5 Flash with `responseSchema` to guarantee strict JSON output.
- **Defensive Frontend Validation**: Structural and type-level validation via `validateItinerary()` before any data touches the React state.
- **Interactive Stop Customization**:
  - **Reorder Stops**: Move itinerary activities up or down (↑ / ↓) with immediate React state updates.
  - **Delete Stops**: Remove unwanted stops with empty-state resilience.
  - **Summary Export**: Copy daily summaries formatted for notes or group sharing in one click.
- **Graceful Failure Handling & Stale Request Guards**:
  - Request ID ref-tracking guards against out-of-order/stale asynchronous API returns.
  - User-friendly error notifications with retry actions.
  - Responsive skeleton loading states.
- **Polished UI & Theme Switcher**:
  - Glassmorphic navigation and card design system.
  - Dark / Light mode toggle with persistent `localStorage` preference.
  - Keyboard accessibility (`Cmd/Ctrl + Enter` to submit, `Esc` to close modals).

---

## 🏗️ Project Structure

```text
Trip-Planner/
├── client/                      # Frontend Vite + React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── PromptInput.jsx       # Free-form input, date picker, quick suggestions
│   │   │   ├── ResultView.jsx        # Itinerary grid, summary banner, placeholder cards
│   │   │   ├── DayDetailModal.jsx    # Interactive timeline: view, reorder & remove stops
│   │   │   ├── LoadingState.jsx      # Skeleton cards during generation
│   │   │   └── ErrorState.jsx        # Shared error banner with retry handler
│   │   ├── lib/
│   │   │   ├── api.js                # Frontend-to-backend proxy API interface
│   │   │   └── validateResult.js     # Strict schema and data integrity validator
│   │   ├── App.jsx                   # Core application state orchestrator
│   │   ├── App.css                   # Custom Vanilla CSS design system & dark theme tokens
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                      # Backend Proxy server
│   ├── index.js                 # Express server holding API key and Gemini client
│   └── package.json
├── .env.example                 # Environment variables template
└── README.md
```

---

## 🔒 Security & Architecture (API Key Protection)

The Google Gemini API key is **never exposed to the browser client**:
1. The React frontend sends the user prompt to `POST http://localhost:3000/api/generate`.
2. The Node/Express backend securely injects `process.env.GEMINI_API_KEY` and calls the Gemini SDK with `responseSchema` enforcement.
3. The backend validates and returns pure JSON to the frontend.

---

## 🛡️ Error Handling & Defensive Strategy

| Failure Mode | How It's Handled |
| :--- | :--- |
| **Malformed JSON** | Backend verifies parseability before dispatching; frontend catches any parsing anomaly and routes to `ErrorState`. |
| **Wrong / Incomplete Shape** | `validateItinerary()` checks for required keys (`destination`, `itinerary`, `stops`, `time`, `location`) and types before updating state. |
| **Slow Network / Response** | Interactive animated skeleton cards are displayed instantly to signal background work without locking the UI. |
| **Out-of-Order / Stale Responses** | `requestId` (stored in React `useRef`) discards older slow responses if a newer request has already been triggered. |
| **Server / API Failures** | Visible, non-blocking error banner with an actionable **"Try Again"** button. |

---

## 🛠️ Getting Started Locally

### 1. Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key ([Get one free at Google AI Studio](https://aistudio.google.com/))

### 2. Setup Backend Server
```bash
cd server
npm install
```
Create a `.env` file in `server/`:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key
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

## 🤖 AI Usage Note (Section 8 Disclosure)

- **AI Tools Used**: Google Antigravity IDE & Gemini models for brainstorming component structure, scaffolding boilerplate, and creating initial CSS color tokens.
- **Original Work**: The custom defensive schema validation, state management, modal drag/reordering logic, stale request protection, and design refinements were built, customized, and tested directly for this project.

---

## 📝 License
MIT License
