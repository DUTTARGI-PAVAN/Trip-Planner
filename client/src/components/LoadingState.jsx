import React from 'react';

/**
 * Loading State skeleton cards to show instant feedback during AI generation.
 */
export function LoadingState({ count = 4 }) {
  const cards = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <>
      {cards.map((num) => (
        <div key={num} className="itinerary-card skeleton-card" aria-hidden="true">
          <div className="skeleton skeleton-pill"></div>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="card-footer">
            <div className="skeleton skeleton-btn"></div>
          </div>
        </div>
      ))}
    </>
  );
}
