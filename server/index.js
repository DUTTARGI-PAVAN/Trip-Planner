import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Server-side Zod Schema for strict validation
const StopSchema = z.object({
  id: z.string().min(1, 'Stop ID is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  activity_type: z.string().transform((val) => {
    const norm = val.toLowerCase().trim();
    return ['food', 'sightseeing', 'travel'].includes(norm) ? norm : 'sightseeing';
  }),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const DaySchema = z.object({
  day_number: z.number().int().positive(),
  theme: z.string().min(1),
  stops: z.array(StopSchema).min(1),
});

const ItinerarySchema = z.object({
  destination: z.string().min(1),
  duration_days: z.number().int().positive(),
  itinerary: z.array(DaySchema).min(1),
});

// Gemini SchemaType specification for structured output
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    destination: { type: SchemaType.STRING },
    duration_days: { type: SchemaType.INTEGER },
    itinerary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          day_number: { type: SchemaType.INTEGER },
          theme: { type: SchemaType.STRING },
          stops: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                time: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                activity_type: {
                  type: SchemaType.STRING,
                  description: "Must be 'food', 'sightseeing', or 'travel'",
                },
                latitude: {
                  type: SchemaType.NUMBER,
                  description: 'Approximate latitude decimal coordinate for the location (e.g. 35.0116)',
                },
                longitude: {
                  type: SchemaType.NUMBER,
                  description: 'Approximate longitude decimal coordinate for the location (e.g. 135.7681)',
                },
              },
              required: ['id', 'time', 'location', 'description', 'activity_type'],
            },
          },
        },
        required: ['day_number', 'theme', 'stops'],
      },
    },
  },
  required: ['destination', 'duration_days', 'itinerary'],
};

/**
 * Timeout helper for backend operations.
 */
function withTimeout(promise, ms, operationName = 'Operation') {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const err = new Error(`${operationName} timed out after ${Math.round(ms / 1000)} seconds.`);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

/**
 * Performs a self-repair pass asking Gemini to fix malformed or schema-invalid output.
 */
async function attemptSelfRepair(model, rawText, validationError, originalPrompt, timeoutMs = 20000) {
  const repairPrompt = `The previous JSON response was invalid or failed schema validation.
Validation Error: ${validationError}
Raw Output:
${rawText}

Original user request: "${originalPrompt}"

Fix the issue and return ONLY the corrected, valid JSON conforming to the schema.`;

  const repairResult = await withTimeout(
    model.generateContent(repairPrompt),
    timeoutMs,
    'AI self-repair'
  );

  const repairedText = repairResult.response.text();
  if (!repairedText || !repairedText.trim()) {
    throw new Error('Self-repair returned an empty response.');
  }

  const parsed = JSON.parse(repairedText);
  const validated = ItinerarySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Self-repair output failed schema validation: ${JSON.stringify(validated.error.issues)}`);
  }

  return validated.data;
}

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      error: 'Prompt is required and cannot be empty.',
      type: 'INVALID_INPUT',
    });
  }

  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
  ].filter(Boolean);

  const systemInstruction =
    "You are an expert travel planner. Create a logical, practical daily itinerary based on the user's request. Generate unique UUIDs for every stop id. Provide accurate approximate decimal latitude and longitude coordinates (WGS84) for each stop location to enable interactive map route visualization.";

  let lastError = null;
  let finalResponse = null;

  for (const modelName of candidateModels) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });

        // 1. Generate content with a 35s server-side timeout per model
        const result = await withTimeout(
          model.generateContent(`${systemInstruction}\n\nUser request: ${prompt.trim()}`),
          35000,
          `AI generation with ${modelName}`
        );

        const responseText = result.response.text();

        // 2. Check for empty response
        if (!responseText || !responseText.trim()) {
          const emptyErr = new Error('EMPTY_OUTPUT: The AI model returned an empty text response.');
          emptyErr.type = 'EMPTY_OUTPUT';
          throw emptyErr;
        }

      // 3. Attempt JSON parse
      let parsedJson;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn(`JSON parse failed on ${modelName}, attempting self-repair:`, parseErr.message);
        try {
          // Self-repair loop for malformed JSON
          parsedJson = await attemptSelfRepair(
            model,
            responseText,
            `JSON Parse Error: ${parseErr.message}`,
            prompt
          );
        } catch (repairErr) {
          const malformedErr = new Error(`MALFORMED_JSON: Failed to parse AI output as JSON: ${parseErr.message}`);
          malformedErr.type = 'MALFORMED_JSON';
          malformedErr.details = parseErr.message;
          throw malformedErr;
        }
      }

      // 4. Validate schema with Zod
      const validationResult = ItinerarySchema.safeParse(parsedJson);
      if (!validationResult.success) {
        console.warn(`Schema validation failed on ${modelName}, attempting self-repair:`, validationResult.error.issues);
        try {
          parsedJson = await attemptSelfRepair(
            model,
            JSON.stringify(parsedJson),
            `Schema Issues: ${JSON.stringify(validationResult.error.issues)}`,
            prompt
          );
        } catch (repairErr) {
          const shapeErr = new Error(`INVALID_SHAPE: AI output missing required schema fields.`);
          shapeErr.type = 'INVALID_SHAPE';
          shapeErr.details = JSON.stringify(validationResult.error.issues);
          throw shapeErr;
        }
      } else {
        parsedJson = validationResult.data;
      }

      finalResponse = parsedJson;
      break; // Successfully generated, parsed, and validated!
    } catch (err) {
      console.warn(`Attempt ${attempt} with ${modelName} encountered error:`, err.message);
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  if (finalResponse) break;
}

  // Handle final outcome and classify HTTP status codes
  if (finalResponse) {
    return res.json(finalResponse);
  }

  console.error('All model attempts failed. Last error:', lastError);

  const errorMsg = lastError?.message || 'Failed to generate itinerary. Please try again.';

  if (lastError?.code === 'ETIMEDOUT' || lastError?.type === 'TIMEOUT_ERROR' || errorMsg.includes('timed out')) {
    return res.status(504).json({
      error: 'The AI request timed out. Please try a shorter request or try again shortly.',
      type: 'TIMEOUT_ERROR',
    });
  }

  if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('Service Unavailable') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
    return res.status(503).json({
      error: 'The AI service is currently experiencing high demand. Please try again in a few moments.',
      type: 'SERVICE_UNAVAILABLE',
    });
  }

  if (lastError?.type === 'EMPTY_OUTPUT' || errorMsg.includes('EMPTY_OUTPUT') || errorMsg.includes('empty text') || errorMsg.includes('empty response')) {
    return res.status(422).json({
      error: 'The AI model returned an empty response. Please try rephrasing your prompt or click Try Again.',
      type: 'EMPTY_OUTPUT',
      details: lastError?.details || errorMsg,
    });
  }

  if (lastError?.type === 'MALFORMED_JSON' || errorMsg.includes('MALFORMED_JSON') || errorMsg.includes('JSON')) {
    return res.status(422).json({
      error: 'The AI generated malformed JSON output that could not be parsed.',
      type: 'MALFORMED_JSON',
      details: lastError?.details || errorMsg,
    });
  }

  if (lastError?.type === 'INVALID_SHAPE' || errorMsg.includes('INVALID_SHAPE') || errorMsg.includes('schema validation') || errorMsg.includes('Schema Issues')) {
    return res.status(422).json({
      error: 'The AI output was missing required itinerary fields (such as days, themes, or scheduled stops).',
      type: 'INVALID_SHAPE',
      details: lastError?.details || errorMsg,
    });
  }

  return res.status(500).json({
    error: errorMsg,
    type: 'SERVER_ERROR',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));