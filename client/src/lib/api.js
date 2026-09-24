/**
 * API client module
 * Handles communication with the backend proxy.
 * The client NEVER calls the LLM provider directly to keep the API key safe.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function generateItinerary(prompt, startDate = '') {
  const finalPrompt = startDate
    ? `Trip plan: ${prompt}. The trip starts on ${startDate}.`
    : `Trip plan: ${prompt}`;

  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: finalPrompt }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMessage = errorData.error;
    } catch {
      // Fallback to generic message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }

  const rawData = await response.json();
  return rawData;
}
