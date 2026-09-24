import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { generateItinerary } from './lib/api';
import { validateItinerary } from './lib/validateResult';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { ErrorState } from './components/ErrorState';
import { DayDetailModal } from './components/DayDetailModal';
import logoImg from './assets/logo.png';

export default function App() {
  const [userName] = useState("Pavan");
  const [prompt, setPrompt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [tripData, setTripData] = useState(null);
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Guard against stale asynchronous responses
  const requestId = useRef(0);

  const handlePlanTrip = async () => {
    if (!prompt.trim()) return;

    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const rawData = await generateItinerary(prompt, startDate);

      // Stale response check: discard if a newer request was dispatched
      if (currentId !== requestId.current) return;

      // Defensive validation: ensure data structure strictly matches requirements
      const validated = validateItinerary(rawData);
      if (!validated) {
        throw new Error("Received malformed or unexpected data structure from the AI model.");
      }

      setTripData(validated);
    } catch (err) {
      if (currentId !== requestId.current) return;
      setError(err.message || "Failed to generate itinerary. Please try again.");
    } finally {
      if (currentId === requestId.current) {
        setLoading(false);
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
    setTripData(null);
    setPrompt("");
    setStartDate("");
    setError(null);
    setActiveDayIndex(null);
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
          <div className="nav-greeting-pill">
            <span className="greeting-dot"></span>
            <span>Welcome, <strong>{userName}</strong></span>
          </div>
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
          Describe your dream getaway, choose a start date, and let AI build your day-by-day custom schedule.
        </p>

        {/* Free-form Input Component */}
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          startDate={startDate}
          setStartDate={setStartDate}
          onSubmit={handlePlanTrip}
          loading={loading}
        />
      </section>

      {/* Shared Error State Banner */}
      <ErrorState error={error} onRetry={handlePlanTrip} />

      {/* 3. Results Section */}
      <ResultView
        tripData={tripData}
        loading={loading}
        startDate={startDate}
        onSelectDay={(idx) => setActiveDayIndex(idx)}
        onResetTrip={handleResetTrip}
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

      {/* Footer */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} YourTripGuide • Crafted for seamless trip planning</p>
      </footer>
    </div>
  );
}