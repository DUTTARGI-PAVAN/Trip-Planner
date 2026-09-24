/**
 * Defensive schema validator for AI-generated trip itineraries.
 * Ensures the response from the LLM matches the expected structure
 * before it ever reaches the React state or renders in the UI.
 */
export function validateItinerary(data) {
  if (!data || typeof data !== 'object') return null;

  // Destination & duration checks
  if (typeof data.destination !== 'string' || !data.destination.trim()) {
    return null;
  }

  // Itinerary array validation
  if (!Array.isArray(data.itinerary) || data.itinerary.length === 0) {
    return null;
  }

  // Validate each day in the itinerary
  for (const day of data.itinerary) {
    if (!day || typeof day !== 'object') return null;

    if (typeof day.day_number !== 'number' || typeof day.theme !== 'string') {
      return null;
    }

    if (!Array.isArray(day.stops) || day.stops.length === 0) {
      return null;
    }

    // Validate each stop inside the day
    for (const stop of day.stops) {
      if (!stop || typeof stop !== 'object') return null;

      if (
        !stop.id ||
        typeof stop.id !== 'string' ||
        !stop.location ||
        typeof stop.location !== 'string' ||
        !stop.time ||
        typeof stop.time !== 'string'
      ) {
        return null;
      }
    }
  }

  return data;
}