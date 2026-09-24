import React from 'react';

const SAMPLE_TRIPS = [
  { label: "🏖️ Goa Beach Getaway (3 Days)", text: "3 days relaxing trip to Goa with beach shacks, water sports, and sunset cafes" },
  { label: "🗼 Tokyo Neon & Food (5 Days)", text: "5 days exploration in Tokyo focusing on ramen spots, Akihabara tech, and Shibuya" },
  { label: "🏔️ Swiss Alps Adventure (4 Days)", text: "4 days scenic adventure in Interlaken and Zermatt with mountain hiking and fondue" },
  { label: "🏛️ Rome & Florence Art (4 Days)", text: "4 days historical tour of Rome and Florence visiting the Colosseum and Uffizi" },
];

/**
 * Free-form prompt input component.
 * Supports text input, quick sample prompts, date selection, and Cmd/Ctrl+Enter submission.
 */
export function PromptInput({
  prompt,
  setPrompt,
  startDate,
  setStartDate,
  onSubmit,
  loading,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="hero-card">
      <div className="textarea-wrapper">
        <textarea
          className="hero-input"
          placeholder="e.g. 5 days in Kyoto and Osaka exploring ancient temples, street food markets, and bamboo forests..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          onKeyDown={handleKeyDown}
          aria-label="Trip description prompt"
        />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="sample-prompts-container">
        <span className="sample-label">Quick Ideas:</span>
        <div className="sample-chips">
          {SAMPLE_TRIPS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-chip"
              onClick={() => setPrompt(sample.text)}
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
            />
            {startDate && (
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
