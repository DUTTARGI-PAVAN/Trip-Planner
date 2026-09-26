import React from 'react';

// Four curated popular trip suggestion chips
const SUGGESTIONS = [
  { label: "📸 Kyoto Temples & Bamboo (4 Days)", text: "4 days wandering in Kyoto exploring quiet morning shrines, bamboo groves, and hidden ramen bars" },
  { label: "🏖️ Bali Retreat & Waterfalls (5 Days)", text: "5 days retreat in Ubud and Canggu with yoga classes, co-working cafes, and scenic waterfalls" },
  { label: "🏔️ Swiss Alps Alpine Trek (3 Days)", text: "3 days trekking in Interlaken and Lauterbrunnen with mountain hostels, fondue, and panoramic trails" },
  { label: "🎨 Paris Art & Bistros (3 Days)", text: "3 days cultural journey in Paris visiting the Louvre, Montmartre art studios, and historic bakeries" },
];

/**
 * Chat-composer style PromptInput component.
 * Features a single elevated composer bar, quiet outline suggestion chips,
 * Enter to submit, Shift+Enter for newlines, and loading cancellation.
 */
export function PromptInput({
  prompt,
  setPrompt,
  onSubmit,
  onCancel,
  loading,
  isCompact = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: Let browser insert a new line
        return;
      }
      // Enter without Shift: trigger submit
      e.preventDefault();
      if (!loading && prompt.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className={`chat-composer-container ${isCompact ? 'composer-compact' : ''}`}>
      {/* Elevated Composer Bar */}
      <div className="chat-composer-box">
        <textarea
          className="chat-composer-input"
          placeholder="Where shall I guide you, traveler? (e.g. 4 days in Rome and Florence exploring art & authentic pasta spots)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={isCompact ? 1 : 2}
          onKeyDown={handleKeyDown}
          aria-label="Trip prompt composer"
          disabled={loading}
        />

        <div className="chat-composer-actions">
          {loading && onCancel && (
            <button
              className="btn-composer-cancel"
              onClick={onCancel}
              type="button"
              title="Cancel generation"
            >
              Cancel
            </button>
          )}

          <button
            className="btn-composer-send"
            onClick={onSubmit}
            disabled={loading || !prompt.trim()}
            type="button"
            aria-label="Send prompt"
            title="Generate Itinerary (Enter)"
          >
            {loading ? (
              <span className="composer-spinner">⏳</span>
            ) : (
              <svg
                className="send-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Sub-row: Keyboard shortcut hint */}
      <div className="chat-composer-meta">
        <span className="composer-shortcut-text">
          Press <kbd className="key-badge">Enter ↵</kbd> to plan • <kbd className="key-badge">Shift + Enter</kbd> for newline
        </span>
      </div>

      {/* 4 Popular Suggestion Chips */}
      {!isCompact && (
        <div className="chat-chips-section">
          <div className="chat-chips-grid">
            {SUGGESTIONS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="chat-outline-chip"
                onClick={() => setPrompt(sample.text)}
                disabled={loading}
              >
                <span className="chip-text">{sample.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
