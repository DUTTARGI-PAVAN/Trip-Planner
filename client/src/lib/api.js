/**
 * API client module
 * Handles communication with the backend proxy with support for cancellation and timeouts.
 * The client NEVER calls the LLM provider directly to keep the API key safe.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Sends prompt to backend with request timeout and cancellation support.
 *
 * @param {string} prompt - User trip prompt
 * @param {object} [options={}] - Request options
 * @param {AbortSignal} [options.signal] - External abort signal for user cancellation
 * @param {number} [options.timeoutMs=50000] - Request timeout in milliseconds (default 50s)
 * @returns {Promise<object>} Parsed JSON itinerary from backend
 */
export async function generateItinerary(prompt, options = {}) {
  // Support options passed as second or third argument for backwards compatibility
  const resolvedOptions = (typeof options === 'object' && options !== null) ? options : {};
  const { signal: externalSignal, timeoutMs = 50000 } = resolvedOptions;

  const finalPrompt = `Trip plan: ${prompt}`;

  // Create an internal timeout controller
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
  }, timeoutMs);

  // Combine external cancellation signal and timeout signal
  let activeSignal = timeoutController.signal;
  if (externalSignal) {
    if (typeof AbortSignal.any === 'function') {
      activeSignal = AbortSignal.any([externalSignal, timeoutController.signal]);
    } else {
      // Fallback for older browsers
      externalSignal.addEventListener('abort', () => timeoutController.abort(externalSignal.reason), { once: true });
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: finalPrompt }),
      signal: activeSignal,
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      let errorType = 'SERVER_ERROR';
      let errorDetails = null;

      try {
        const errorData = await response.json();
        if (errorData?.error) errorMessage = errorData.error;
        if (errorData?.type) errorType = errorData.type;
        if (errorData?.details) errorDetails = errorData.details;
      } catch {
        // Fallback to HTTP status text if JSON parsing fails
        if (response.statusText) errorMessage = `${response.statusText} (${response.status})`;
      }

      const err = new Error(errorMessage);
      err.status = response.status;
      err.type = errorType;
      err.details = errorDetails;
      throw err;
    }

    const rawData = await response.json();
    return rawData;
  } catch (err) {
    if (activeSignal.aborted) {
      if (externalSignal?.aborted) {
        const abortErr = new Error('Request cancelled by user.');
        abortErr.name = 'AbortError';
        abortErr.type = 'ABORT_ERROR';
        throw abortErr;
      }
      const timeoutErr = new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`);
      timeoutErr.name = 'TimeoutError';
      timeoutErr.type = 'TIMEOUT_ERROR';
      throw timeoutErr;
    }

    // Classify browser network connection failures (e.g., server offline, CORS network fail)
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      const netErr = new Error('Unable to connect to the backend server. Please check your internet connection or verify the server is running at http://localhost:3000.');
      netErr.name = 'NetworkError';
      netErr.type = 'NETWORK_ERROR';
      throw netErr;
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
