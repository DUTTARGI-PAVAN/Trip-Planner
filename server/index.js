import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the schema to force Gemini to return exactly what we want
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
                                    description: "Must be 'food', 'sightseeing', or 'travel'"
                                },
                            },
                            required: ["id", "time", "location", "description", "activity_type"]
                        }
                    }
                },
                required: ["day_number", "theme", "stops"]
            }
        }
    },
    required: ["destination", "duration_days", "itinerary"]
};

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const candidateModels = [
            process.env.GEMINI_MODEL,
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-3.7-flash"
        ].filter(Boolean);

        const systemInstruction = "You are an expert travel planner. Create a logical, practical daily itinerary based on the user's request. Generate unique UUIDs for every stop id.";
        let lastError = null;
        let jsonResponse = null;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                    }
                });

                const result = await model.generateContent(`${systemInstruction}\n\nUser request: ${prompt}`);
                const responseText = result.response.text();
                jsonResponse = JSON.parse(responseText);
                break; // Successfully generated and parsed
            } catch (err) {
                console.warn(`Attempt with ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        if (!jsonResponse) {
            throw lastError || new Error("Failed to generate response with available models");
        }

        res.json(jsonResponse);

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate itinerary. Please try again.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));