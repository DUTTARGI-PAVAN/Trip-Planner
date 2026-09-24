import React from 'react';
import { LoadingState } from './LoadingState';

const PLACEHOLDER_CARDS = [
  { num: 1, title: "Day 1: Arrival & City Highlights", desc: "Settle into your hotel and explore historic landmarks and local dining." },
  { num: 2, title: "Day 2: Nature & Culture", desc: "Visit top-rated museums, parks, and traditional markets." },
  { num: 3, title: "Day 3: Adventure & Excursions", desc: "Enjoy scenic viewpoints, thrilling activities, and regional cuisine." },
  { num: 4, title: "Day 4: Hidden Gems & Departure", desc: "Shop for souvenirs, visit local cafes, and prepare for departure." },
];

/**
 * ResultView component
 * Renders the interactive itinerary cards, trip summary banner,
 * loading skeletons, or empty-state placeholder cards.
 */
export function ResultView({
  tripData,
  loading,
  startDate,
  onSelectDay,
  onResetTrip,
}) {
  const totalStops = tripData?.itinerary?.reduce(
    (acc, day) => acc + (day.stops?.length || 0),
    0
  ) || 0;

  return (
    <>
      {/* Trip Overview Banner */}
      {tripData && (
        <div className="trip-overview-banner">
          <div className="trip-overview-left">
            <span className="overview-icon">🎯</span>
            <div>
              <h3 className="overview-destination">{tripData.destination}</h3>
              <p className="overview-details">
                {tripData.itinerary?.length} Days • {totalStops} Total Activities{' '}
                {startDate ? `• Starting on ${startDate}` : ''}
              </p>
            </div>
          </div>
          <button className="btn-chip btn-reset" onClick={onResetTrip} type="button">
            🔄 Plan Another Trip
          </button>
        </div>
      )}

      {/* Main Section */}
      <main className="section-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {tripData ? "YOUR CUSTOM ITINERARY" : "SUGGESTED ITINERARY"}
            </h2>
            <p className="section-subtitle">
              {tripData
                ? `Detailed schedule for ${tripData.destination}. Click any card to review, reorder, or customize stops.`
                : "Enter your prompt above and hit Let's Plan to generate customized daily itineraries."}
            </p>
          </div>
          {tripData && (
            <span className="days-badge">
              {tripData.itinerary?.length} Days Generated
            </span>
          )}
        </div>

        <div className="cards-grid">
          {loading ? (
            <LoadingState count={4} />
          ) : tripData?.itinerary ? (
            tripData.itinerary.map((day, idx) => (
              <div
                key={day.day_number || idx}
                className="itinerary-card"
                onClick={() => onSelectDay(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDay(idx);
                  }
                }}
              >
                <div className="card-header">
                  <span className="day-badge">Day {day.day_number}</span>
                  <span className="stops-count-badge">
                    {day.stops.length} {day.stops.length === 1 ? 'Stop' : 'Stops'}
                  </span>
                </div>

                <div className="card-main">
                  <h3 className="card-title">{day.theme}</h3>
                  <div className="card-stops-preview">
                    {day.stops.slice(0, 2).map((s, sIdx) => (
                      <div key={s.id || sIdx} className="preview-stop-row">
                        <span className="preview-bullet">•</span>
                        <span className="preview-time">{s.time}:</span>
                        <span className="preview-loc">{s.location}</span>
                      </div>
                    ))}
                    {day.stops.length > 2 && (
                      <div className="preview-more">
                        +{day.stops.length - 2} more activities...
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(idx);
                    }}
                    type="button"
                  >
                    <span>View & Edit Schedule</span>
                    <span className="btn-view-arrow">→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            PLACEHOLDER_CARDS.map((card) => (
              <div key={card.num} className="itinerary-card placeholder-card">
                <div className="card-header">
                  <span className="day-badge muted">Day {card.num} Preview</span>
                </div>
                <div className="card-main">
                  <h3 className="card-title muted">{card.title}</h3>
                  <p className="card-placeholder-desc">{card.desc}</p>
                </div>
                <div className="card-footer">
                  <button className="btn-view" disabled title="Generate itinerary first to view">
                    Awaiting Plan
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
