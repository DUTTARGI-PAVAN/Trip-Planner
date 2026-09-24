import React from 'react';

/**
 * Shared Error State component for graceful failure handling.
 * Displays user-friendly error messages and provides a quick retry action.
 */
export function ErrorState({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="status-box error-box" role="alert">
      <div className="status-icon">⚠️</div>
      <div className="status-content">
        <h4>Generation Error</h4>
        <p>{error}</p>
      </div>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry} type="button">
          Try Again
        </button>
      )}
    </div>
  );
}
