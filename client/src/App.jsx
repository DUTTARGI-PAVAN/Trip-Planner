import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { generateItinerary } from './lib/api';
import { validateItinerary } from './lib/validateResult';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { ErrorState } from './components/ErrorState';
import { DayDetailModal } from './components/DayDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import logoImg from './assets/logo.png';

export default function App() {
  // User profile state with local persistence
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('trip-planner-username') || '';
  });

  const [travelerType, setTravelerType] = useState(() => {
    return localStorage.getItem('trip-planner-traveler-type') || 'solo';
  });

  // Automatically open the onboarding profile dialog on first visit if not saved
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(() => {
    return !localStorage.getItem('trip-planner-username');
  });

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

  useEffect(() => {
    if (userName) {
      localStorage.setItem('trip-planner-username', userName);
    }
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('trip-planner-traveler-type', travelerType);
  }, [travelerType]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveProfile = ({ name, travelerType: selectedType }) => {
    setUserName(name);
    setTravelerType(selectedType);
    localStorage.setItem('trip-planner-username', name);
    localStorage.setItem('trip-planner-traveler-type', selectedType);
    setIsProfileModalOpen(false);
  };

  const handleToggleTravelerType = () => {
    setTravelerType((prev) => (prev === 'solo' ? 'group' : 'solo'));
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
      // Include traveler type context in the prompt for even smarter AI plans
      const contextualPrompt = `[Traveler Type: ${travelerType === 'group' ? 'Group / Friends' : 'Solo Traveler'}] ${targetPrompt}`;

      const rawData = await generateItinerary(contextualPrompt, {
        signal: controller.signal,
        timeoutMs: 50000,
      });

      // Stale response check: discard if a newer request was dispatched
      if (currentId !== requestId.current) return;

      // Defensive validation with Zod schema
      const validated = validateItinerary(rawData);
      if (!validated) {
        throw new Error("Received malformed or unexpected data structure from the AI model.");
      }

      setTripData(validated);
    } catch (err) {
      if (currentId !== requestId.current) return;
      if (err.name === 'AbortError') {
        // User intentionally cancelled the request
        return;
      }
      setError(err.message || "Failed to generate itinerary. Please try again.");
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
      {/* 1. Navbar */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo-badge">
            <img src={logoImg} alt="YourTripGuide" className="navbar-logo-img" />
            <span className="logo-text">YourTripGuide</span>
          </div>
          <button
            className="nav-greeting-pill"
            onClick={() => setIsProfileModalOpen(true)}
            type="button"
            title="Click to edit your name and traveler type"
          >
            <span className="greeting-dot"></span>
            <span>
              Welcome, <strong>{userName || 'Traveler'}</strong>
              <span className="nav-type-tag">{travelerType === 'group' ? '👥 Group' : '🎒 Solo'}</span>
              <span className="edit-pen-icon">✏️</span>
            </span>
          </button>
        </div>

        <div className="nav-right">
          <nav className="nav-links">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#deals" className="nav-link">Deals</a>
            <a href="#guide" className="nav-link">Guides</a>
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

      {/* 2. Hero Section */}
      <section className="hero-container" id="home">
        <div className="hero-logo-showcase">
          <img src={logoImg} alt="YourTripGuide" className="hero-logo-img" />
        </div>

        <div className="hero-badge">
          <span className="sparkle-icon">✨</span> AI-Powered Travel Itinerary Builder
        </div>

        <h1 className="hero-heading">
          Where would you like to <span className="gradient-text">explore next?</span>
        </h1>
        <p className="hero-subtext">
          Describe your dream getaway and let AI build your day-by-day custom schedule.
        </p>

        {/* Free-form Input Component */}
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          travelerType={travelerType}
          onToggleTravelerType={handleToggleTravelerType}
          onSubmit={() => handlePlanTrip()}
          onCancel={handleCancelRequest}
          loading={loading}
        />
      </section>

      {/* Shared Error State Banner */}
      <ErrorState error={error} onRetry={() => handlePlanTrip()} />

      {/* 3. Results / Suggested Section */}
      <ResultView
        tripData={tripData}
        loading={loading}
        travelerType={travelerType}
        onSelectDay={(idx) => setActiveDayIndex(idx)}
        onResetTrip={handleResetTrip}
        onSelectSuggestedPlan={(planPrompt) => handlePlanTrip(planPrompt)}
      />

      {/* 4. Interactive Day Modal (Expand / Reorder / Delete Stops) */}
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

      {/* 5. User Profile / Traveler Type Onboarding Dialog */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        initialName={userName}
        initialTravelerType={travelerType}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileModalOpen(false)}
        canClose={Boolean(userName)}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} YourTripGuide • Crafted for seamless trip planning</p>
      </footer>
    </div>
  );
}