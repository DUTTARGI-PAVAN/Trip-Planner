import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { generateItinerary } from './lib/api';
import { validateItinerary } from './lib/validateResult';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { ErrorState } from './components/ErrorState';
import { DayDetailModal } from './components/DayDetailModal';
import logoImg from './assets/logo.png';

/**
 * Generates an interactive, warm, time-of-day aware guide greeting for the traveler.
 * Evaluates once on mount per app load.
 */
function getGuideGreeting() {
  const hour = new Date().getHours();
  let timeOfDay = 'afternoon';
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  const guideVariants = {
    morning: [
      "Good morning, traveler. Where are we heading today?",
      "Good morning, traveler. Where shall I guide you?",
      "Ready for your next adventure, traveler?",
      "What destination shall we map out today, traveler?",
    ],
    afternoon: [
      "Good afternoon, traveler. Where should we explore?",
      "Where shall I guide you next, traveler?",
      "Ready to discover a new destination, traveler?",
      "Good afternoon, traveler. Tell me your dream trip.",
    ],
    evening: [
      "Good evening, traveler. Where to next?",
      "Where shall I guide you on your next journey, traveler?",
      "Good evening, traveler. Let's plan your getaway.",
      "What destination is calling you tonight, traveler?",
    ],
    night: [
      "Where to next, fellow traveler?",
      "Dreaming of your next getaway, traveler?",
      "Where shall I guide you on your next journey?",
      "Tell me your dream trip, traveler.",
    ],
  };

  const list = guideVariants[timeOfDay] || guideVariants.afternoon;
  return list[Math.floor(Math.random() * list.length)];
}

export default function App() {
  // Evaluated once per app load (on mount)
  const initialGreeting = useMemo(() => getGuideGreeting(), []);

  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('trip-planner-saved-prompt') || '';
  });

  const [tripData, setTripData] = useState(() => {
    try {
      const saved = localStorage.getItem('trip-planner-saved-trip');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(null);

  // Dark / Light Theme state with local persistence
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('trip-planner-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trip-planner-theme', theme);
  }, [theme]);

  // Persist trip state to localStorage
  useEffect(() => {
    if (tripData) {
      localStorage.setItem('trip-planner-saved-trip', JSON.stringify(tripData));
    } else {
      localStorage.removeItem('trip-planner-saved-trip');
    }
  }, [tripData]);

  useEffect(() => {
    localStorage.setItem('trip-planner-saved-prompt', prompt);
  }, [prompt]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active in-flight request abort controller & stale request guard
  const abortControllerRef = useRef(null);
  const requestId = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const handlePlanTrip = async (customPrompt) => {
    const targetPrompt = typeof customPrompt === 'string' ? customPrompt : prompt;
    if (!targetPrompt.trim()) return;

    if (typeof customPrompt === 'string') {
      setPrompt(customPrompt);
    }

    // Abort any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const rawData = await generateItinerary(targetPrompt.trim(), {
        signal: controller.signal,
        timeoutMs: 50000,
      });

      // Stale response check: discard if a newer request was dispatched
      if (currentId !== requestId.current) return;

      // Defensive validation with Zod schema
      const validated = validateItinerary(rawData);
      if (!validated) {
        const shapeErr = new Error("The AI response was missing essential itinerary fields.");
        shapeErr.type = "INVALID_SHAPE";
        throw shapeErr;
      }

      setTripData(validated);
    } catch (err) {
      if (currentId !== requestId.current) return;
      if (err.name === 'AbortError' || err.type === 'ABORT_ERROR') {
        // User intentionally cancelled the request
        return;
      }
      setError({
        message: err.message || "Failed to generate itinerary. Please try again.",
        type: err.type || "SERVER_ERROR",
        details: err.details || null,
      });
    } finally {
      if (currentId === requestId.current) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleUpdateStops = (dayIndex, updatedStops) => {
    setTripData((prev) => {
      if (!prev) return prev;
      const nextItinerary = [...prev.itinerary];
      nextItinerary[dayIndex] = { ...nextItinerary[dayIndex], stops: updatedStops };
      return { ...prev, itinerary: nextItinerary };
    });
  };

  const handleResetTrip = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTripData(null);
    setPrompt("");
    setError(null);
    setActiveDayIndex(null);
    localStorage.removeItem('trip-planner-saved-trip');
    localStorage.removeItem('trip-planner-saved-prompt');
    localStorage.removeItem('trip-planner-saved-start-date');
  };

  return (
    <div className="app-layout">
      {/* 1. Minimal Header */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo-badge">
            <img src={logoImg} alt="YourTripGuide" className="navbar-logo-img" />
            <span className="logo-text">YourTripGuide</span>
          </div>
        </div>

        <div className="nav-right">
          <nav className="nav-links">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#about" className="nav-link">About</a>
          </nav>

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            type="button"
          >
            {theme === 'dark' ? (
              <>
                <span className="theme-icon">☀️</span>
                <span className="theme-label">Light</span>
              </>
            ) : (
              <>
                <span className="theme-icon">🌙</span>
                <span className="theme-label">Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      {!tripData ? (
        /* Landing State: Centered, single-column, calm ChatGPT/Claude style */
        <div className="landing-layout-wrapper" id="home">
          <section className="landing-centered-hero">
            {/* Interactive Logo */}
            <div className="hero-logo-showcase">
              <img src={logoImg} alt="YourTripGuide" className="hero-logo-img" />
            </div>

            {/* Interactive Guide Greeting */}
            <h1 className="chat-greeting-title">{initialGreeting}</h1>

            {/* Chat Composer with 4 Suggestion Chips */}
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={() => handlePlanTrip()}
              onCancel={handleCancelRequest}
              loading={loading}
              isCompact={false}
            />
          </section>

          {/* Shared Error State Banner */}
          <ErrorState error={error} onRetry={() => handlePlanTrip()} />

          {/* Suggested Inspiration Section */}
          <ResultView
            tripData={null}
            loading={loading}
            onSelectDay={(idx) => setActiveDayIndex(idx)}
            onResetTrip={handleResetTrip}
            onSelectSuggestedPlan={(planPrompt) => handlePlanTrip(planPrompt)}
          />
        </div>
      ) : (
        /* Generated State: Compact top composer and full itinerary cards below */
        <div className="generated-layout-wrapper" id="home">
          <div className="compact-top-bar">
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={() => handlePlanTrip()}
              onCancel={handleCancelRequest}
              loading={loading}
              isCompact={true}
            />
          </div>

          <ErrorState error={error} onRetry={() => handlePlanTrip()} />

          <ResultView
            tripData={tripData}
            loading={loading}
            onSelectDay={(idx) => setActiveDayIndex(idx)}
            onResetTrip={handleResetTrip}
            onSelectSuggestedPlan={(planPrompt) => handlePlanTrip(planPrompt)}
          />
        </div>
      )}

      {/* 3. Interactive Day Modal */}
      {activeDayIndex !== null && tripData?.itinerary?.[activeDayIndex] && (
        <DayDetailModal
          day={tripData.itinerary[activeDayIndex]}
          dayIndex={activeDayIndex}
          totalDays={tripData.itinerary.length}
          destination={tripData.destination}
          onClose={() => setActiveDayIndex(null)}
          onUpdateStops={handleUpdateStops}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} YourTripGuide • Crafted for seamless trip planning</p>
      </footer>
    </div>
  );
}