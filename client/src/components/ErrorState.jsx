import React from 'react';

/**
 * Metadata map defining user-friendly display information for each error type.
 */
const ERROR_TYPE_CONFIGS = {
  MALFORMED_JSON: {
    icon: '🧩',
    title: 'Malformed AI Output',
    badge: 'JSON Parse Error',
    description: 'The AI model returned text that could not be parsed as valid JSON (even after an automated self-repair pass).',
    suggestion: 'Try simplifying or slightly rephrasing your prompt, then click "Try Again".',
    badgeClass: 'badge-malformed',
  },
  INVALID_SHAPE: {
    icon: '📐',
    title: 'Incomplete Itinerary Structure',
    badge: 'Schema Mismatch',
    description: 'The AI response was missing essential itinerary fields (such as days, themes, or scheduled stop details).',
    suggestion: 'Ensure your prompt clearly specifies a destination and length of stay (e.g. "4 days in Tokyo").',
    badgeClass: 'badge-shape',
  },
  EMPTY_OUTPUT: {
    icon: '📭',
    title: 'Empty AI Output',
    badge: 'Empty Response',
    description: 'The AI service returned an empty response with no itinerary content.',
    suggestion: 'The model stream may have been interrupted. Click "Try Again" to regenerate.',
    badgeClass: 'badge-empty',
  },
  TIMEOUT_ERROR: {
    icon: '⏱️',
    title: 'Request Timed Out',
    badge: 'Timeout',
    description: 'The AI generation exceeded the maximum response time limit.',
    suggestion: 'Try requesting a shorter duration (e.g., 3-4 days instead of multiple weeks) or click "Try Again".',
    badgeClass: 'badge-timeout',
  },
  NETWORK_ERROR: {
    icon: '📡',
    title: 'Network Connection Failed',
    badge: 'Connection Error',
    description: 'Unable to connect to the backend server at http://localhost:3000.',
    suggestion: 'Check your internet connection and verify that the backend server is running (`npm run dev` in the server directory).',
    badgeClass: 'badge-network',
  },
  SERVICE_UNAVAILABLE: {
    icon: '🚦',
    title: 'AI Service Busy',
    badge: '503 Unavailable',
    description: 'The upstream AI service is temporarily experiencing high traffic or rate limits.',
    suggestion: 'Please wait a few moments and click "Try Again".',
    badgeClass: 'badge-service',
  },
  INVALID_INPUT: {
    icon: '✍️',
    title: 'Prompt Required',
    badge: 'Input Required',
    description: 'Please provide a valid destination or trip description.',
    suggestion: 'Type your trip idea into the box above.',
    badgeClass: 'badge-input',
  },
  SERVER_ERROR: {
    icon: '⚠️',
    title: 'Generation Failed',
    badge: 'Server Error',
    description: 'An unexpected error occurred while generating your itinerary.',
    suggestion: 'Click "Try Again" or check server logs for more details.',
    badgeClass: 'badge-server',
  },
};

/**
 * Resolves the appropriate error category from an error object or string.
 */
function resolveErrorInfo(error) {
  if (!error) return null;

  let type = 'SERVER_ERROR';
  let message = '';
  let details = '';

  if (typeof error === 'string') {
    message = error;
    // Heuristic classification from string if only message was passed
    if (message.includes('MALFORMED_JSON') || message.includes('JSON')) {
      type = 'MALFORMED_JSON';
    } else if (message.includes('INVALID_SHAPE') || message.includes('missing essential itinerary') || message.includes('schema')) {
      type = 'INVALID_SHAPE';
    } else if (message.includes('EMPTY_OUTPUT') || message.includes('empty text') || message.includes('empty response')) {
      type = 'EMPTY_OUTPUT';
    } else if (message.includes('timed out') || message.includes('Timeout') || message.includes('TIMEOUT_ERROR')) {
      type = 'TIMEOUT_ERROR';
    } else if (message.includes('connect') || message.includes('network') || message.includes('fetch') || message.includes('NetworkError')) {
      type = 'NETWORK_ERROR';
    } else if (message.includes('503') || message.includes('high demand') || message.includes('Service Unavailable')) {
      type = 'SERVICE_UNAVAILABLE';
    }
  } else if (typeof error === 'object') {
    type = error.type || 'SERVER_ERROR';
    message = error.message || 'An unexpected error occurred.';
    details = error.details || '';
  }

  const config = ERROR_TYPE_CONFIGS[type] || ERROR_TYPE_CONFIGS.SERVER_ERROR;

  return {
    type,
    title: config.title,
    badge: config.badge,
    badgeClass: config.badgeClass,
    icon: config.icon,
    description: message || config.description,
    suggestion: config.suggestion,
    details,
  };
}

/**
 * Shared Error State component for graceful failure handling.
 * Distinguishes failure reasons in the UI with distinct icons, badges,
 * contextual explanations, and actionable troubleshooting tips.
 */
export function ErrorState({ error, onRetry }) {
  const errorInfo = resolveErrorInfo(error);
  if (!errorInfo) return null;

  return (
    <div className={`status-box error-box error-type-${errorInfo.type.toLowerCase()}`} role="alert">
      <div className="error-box-header">
        <div className="error-icon-wrapper">
          <span className="error-icon">{errorInfo.icon}</span>
        </div>
        <div className="error-title-group">
          <div className="error-headline-row">
            <h4 className="error-title">{errorInfo.title}</h4>
            <span className={`error-badge ${errorInfo.badgeClass}`}>
              {errorInfo.badge}
            </span>
          </div>
          <p className="error-desc">{errorInfo.description}</p>
        </div>
      </div>

      <div className="error-box-footer">
        <div className="error-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">{errorInfo.suggestion}</span>
        </div>

        {onRetry && (
          <button className="btn-error-retry" onClick={onRetry} type="button">
            <span className="retry-icon">🔄</span>
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
