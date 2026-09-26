import React, { useEffect, useState } from 'react';
import { DayMapView } from './DayMapView';

export function DayDetailModal({ day, dayIndex, totalDays, destination, onClose, onUpdateStops }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'map'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!day) return null;

  const handleMove = (index, direction) => {
    const nextStops = [...day.stops];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextStops.length) return;

    const [moved] = nextStops.splice(index, 1);
    nextStops.splice(targetIndex, 0, moved);
    onUpdateStops(dayIndex, nextStops);
  };

  const handleRemove = (stopId) => {
    const nextStops = day.stops.filter((s) => s.id !== stopId);
    onUpdateStops(dayIndex, nextStops);
  };

  const handleCopyDayPlan = () => {
    const text = `Day ${day.day_number}: ${day.theme}\n` +
      day.stops.map((s, i) => `${i + 1}. [${s.time}] ${s.location} - ${s.description}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActivityBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('food') || t.includes('meal') || t.includes('restaurant')) {
      return { label: 'Dining', icon: '🍽️', colorClass: 'badge-food' };
    }
    if (t.includes('travel') || t.includes('transport') || t.includes('transit')) {
      return { label: 'Transit', icon: '🚆', colorClass: 'badge-travel' };
    }
    return { label: 'Sightseeing', icon: '🏛️', colorClass: 'badge-sightseeing' };
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-tag-row">
              <span className="modal-day-pill">Day {day.day_number} {totalDays ? `of ${totalDays}` : ''}</span>
              {destination && <span className="modal-dest-pill">📍 {destination}</span>}
            </div>
            <h2 className="modal-title">{day.theme}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Sub-bar with View Tabs */}
        <div className="modal-subbar">
          <div className="modal-view-tabs">
            <button
              className={`view-tab-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              📋 Timeline ({day.stops.length})
            </button>
            <button
              className={`view-tab-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺️ Map Route
            </button>
          </div>
          <button className="btn-chip" onClick={handleCopyDayPlan}>
            {copied ? '✓ Copied Day Plan!' : '📋 Copy Day Summary'}
          </button>
        </div>

        {/* Modal Body / View Switch */}
        <div className="modal-body">
          {viewMode === 'map' ? (
            <DayMapView
              stops={day.stops}
              destination={destination}
              dayNumber={day.day_number}
              theme={day.theme}
            />
          ) : day.stops.length === 0 ? (
            <div className="modal-empty-state">
              <span className="empty-icon">🗺️</span>
              <p className="empty-text">No stops left for this day.</p>
              <span className="empty-sub">You removed all destinations scheduled for this day.</span>
            </div>
          ) : (
            <div className="timeline-container">
              {day.stops.map((stop, idx) => {
                const badge = getActivityBadge(stop.activity_type);
                return (
                  <div key={stop.id || idx} className="timeline-item">
                    {/* Node & vertical line */}
                    <div className="timeline-left">
                      <div className="timeline-node">{idx + 1}</div>
                      {idx < day.stops.length - 1 && <div className="timeline-line" />}
                    </div>

                    {/* Content Card */}
                    <div className="timeline-content">
                      <div className="stop-header">
                        <div className="stop-title-group">
                          <span className="stop-time">⏰ {stop.time}</span>
                          <h4 className="stop-location">{stop.location}</h4>
                        </div>
                        <span className={`activity-badge ${badge.colorClass}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>

                      <p className="stop-desc">{stop.description}</p>

                      <div className="stop-actions">
                        <div className="reorder-btns">
                          <button
                            className="btn-action-small"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            title="Move Stop Up"
                          >
                            ↑ Up
                          </button>
                          <button
                            className="btn-action-small"
                            disabled={idx === day.stops.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            title="Move Stop Down"
                          >
                            ↓ Down
                          </button>
                        </div>
                        <button
                          className="btn-action-small btn-remove"
                          onClick={() => handleRemove(stop.id)}
                          title="Remove Stop"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="modal-footer-hint">Tip: Reorder or remove stops to customize your schedule</span>
          <button className="btn-primary-sm" onClick={onClose}>
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
}