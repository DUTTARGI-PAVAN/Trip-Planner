import React from 'react';

// Tailored suggestions categorized by traveler type
const SUGGESTIONS = {
  solo: [
    { label: "📸 Kyoto Solo Photography (4 Days)", text: "4 days solo wandering in Kyoto exploring quiet morning shrines, bamboo groves, and hidden ramen bars" },
    { label: "🏖️ Bali Solo Backpacker & Cafes (5 Days)", text: "5 days solo retreat in Ubud and Canggu with yoga classes, co-working cafes, and scenic waterfalls" },
    { label: "🏔️ Swiss Alps Solo Hike (3 Days)", text: "3 days solo trekking in Interlaken and Lauterbrunnen with mountain hostels, fondue, and panoramic trails" },
    { label: "🎨 Paris Museums & Culture (3 Days)", text: "3 days solo cultural journey in Paris visiting the Louvre, Montmartre art studios, and historic bakeries" },
  ],
  group: [
    { label: "🏖️ Goa Beach Villa & Party (4 Days)", text: "4 days group party getaway to Goa with private beach shacks, sunset cruises, water sports, and seaside clubs" },
    { label: "🏔️ Manali Road Trip with Friends (5 Days)", text: "5 days scenic group road trip to Manali and Solang Valley with river rafting, bonfires, and mountain cafes" },
    { label: "🎢 Tokyo Tech & Neon Safari (5 Days)", text: "5 days group exploration in Tokyo hitting Akihabara arcades, teamLab digital art, Shibuya crossings, and izakayas" },
    { label: "🏛️ Rome & Tuscany Wine Tour (4 Days)", text: "4 days group tour of Rome and Florence with Colosseum entry, shared pasta feasts, and vineyard tastings" },
  ],
};

/**
 * Free-form prompt input component.
 * Supports text input, personalized suggestions (Solo vs Group), date selection,
 * Enter to submit, Shift+Enter for newlines, and request cancellation.
 */
export function PromptInput({
  prompt,
  setPrompt,
  startDate,
  setStartDate,
  travelerType = 'solo',
  onToggleTravelerType,
  onSubmit,
  onCancel,
  loading,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: Let browser insert a new line
        return;
      }
      // Enter without Shift: trigger submit ("Let's Plan" action)
      e.preventDefault();
      if (!loading && prompt.trim()) {
        onSubmit();
      }
    }
  };

  const activeSuggestions = SUGGESTIONS[travelerType] || SUGGESTIONS.solo;

  return (
    <div className="hero-card">
      {/* Header bar above textarea with active traveler type tag */}
      <div className="hero-card-header">
        <div className="prompt-type-badge">
          <span>{travelerType === 'group' ? '👥 Group Mode Ideas' : '🎒 Solo Mode Ideas'}</span>
        </div>
        {onToggleTravelerType && (
          <button
            type="button"
            className="btn-switch-mode"
            onClick={onToggleTravelerType}
            title="Switch between Solo and Group ideas"
          >
            Switch to {travelerType === 'group' ? '🎒 Solo' : '👥 Group'}
          </button>
        )}
      </div>

      {/* Main Textarea */}
      <div className="textarea-wrapper">
        <textarea
          className="hero-input"
          placeholder={
            travelerType === 'group'
              ? "e.g. 4 days in Goa with 5 friends for beach parties, water sports, and sunset dinners..."
              : "e.g. 5 days in Kyoto and Osaka exploring ancient temples, street food markets, and bamboo forests..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          onKeyDown={handleKeyDown}
          aria-label="Trip description prompt"
          disabled={loading}
        />
        <div className="textarea-shortcut-hint">
          <span>Press <strong>Enter ↵</strong> to plan • <strong>Shift + Enter</strong> for new line</span>
        </div>
      </div>

      {/* Dynamic Suggested Prompts based on Traveler Type */}
      <div className="sample-prompts-container">
        <div className="sample-header-row">
          <span className="sample-label">
            {travelerType === 'group' ? '👥 Ideas for Group & Friends:' : '🎒 Ideas for Solo Adventurers:'}
          </span>
        </div>
        <div className="sample-chips">
          {activeSuggestions.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-chip"
              onClick={() => setPrompt(sample.text)}
              disabled={loading}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="hero-controls">
        <div className="controls-left">
          <div className="date-input-wrapper">
            <span className="date-label">📅 Start Date</span>
            <input
              type="date"
              className="date-picker-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Trip start date"
              disabled={loading}
            />
            {startDate && !loading && (
              <button
                type="button"
                className="clear-date-btn"
                onClick={() => setStartDate("")}
                title="Clear date"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="controls-right">
          {loading && onCancel && (
            <button
              className="btn-cancel-action"
              onClick={onCancel}
              type="button"
              title="Cancel generation"
            >
              Cancel
            </button>
          )}

          <button
            className="btn-plan-action"
            onClick={onSubmit}
            disabled={loading || !prompt.trim()}
            type="button"
          >
            {loading ? (
              <>
                <span className="spinner-icon">⏳</span>
                <span>Creating Plan...</span>
              </>
            ) : (
              <>
                <span>Let's Plan</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
