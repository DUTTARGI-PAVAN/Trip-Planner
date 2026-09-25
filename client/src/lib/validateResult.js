import { z } from 'zod';

/**
 * Activity type schema: must be one of 'food', 'sightseeing', or 'travel'
 * (with fallback / lowercase normalization if needed)
 */
export const ActivityTypeSchema = z.enum(['food', 'sightseeing', 'travel']);

/**
 * Individual Stop schema
 */
export const StopSchema = z.object({
  id: z.string().min(1, 'Stop ID is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  activity_type: z.string().transform((val) => {
    const normalized = val.toLowerCase().trim();
    if (['food', 'sightseeing', 'travel'].includes(normalized)) {
      return normalized;
    }
    return 'sightseeing';
  }),
});

/**
 * Daily Itinerary schema
 */
export const DaySchema = z.object({
  day_number: z.number().int().positive('Day number must be a positive integer'),
  theme: z.string().min(1, 'Day theme is required'),
  stops: z.array(StopSchema).min(1, 'Each day must have at least one stop'),
});

/**
 * Complete Trip Itinerary schema
 */
export const ItinerarySchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  duration_days: z.number().int().positive('Duration must be at least 1 day'),
  itinerary: z.array(DaySchema).min(1, 'Itinerary must contain at least one day'),
});

/**
 * Validates raw data against the Zod ItinerarySchema.
 * Returns parsed and typed data if valid, or throws/returns structured error.
 *
 * @param {unknown} data
 * @returns {z.infer<typeof ItinerarySchema> | null}
 */
export function validateItinerary(data) {
  const result = ItinerarySchema.safeParse(data);
  if (!result.success) {
    console.warn('Itinerary Schema Validation Failed:', result.error.format());
    return null;
  }
  return result.data;
}

/**
 * Detailed validation that returns issues for debugging / error reporting.
 */
export function validateItineraryDetailed(data) {
  return ItinerarySchema.safeParse(data);
}