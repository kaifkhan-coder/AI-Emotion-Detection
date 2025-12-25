
import { GoogleGenAI, Type } from "@google/genai";
import { EmotionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const EMOTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primaryEmotion: {
      type: Type.STRING,
      description: "The dominant emotion detected (Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral, Contemptuous, Confused)",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1",
    },
    secondaryEmotions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          intensity: { type: Type.NUMBER }
        },
        required: ["emotion", "intensity"]
      }
    },
    description: {
      type: Type.STRING,
      description: "A short observation about the facial expression",
    }
  },
  required: ["primaryEmotion", "confidence", "secondaryEmotions", "description"]
};

export async function analyzeEmotion(base64Image: string): Promise<EmotionData> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze this person's facial expression. Identify the primary emotion, any secondary emotions, provide a confidence score, and a brief description. Respond only in JSON format matching the provided schema." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: EMOTION_SCHEMA
      }
    });

    const result = JSON.parse(response.text);
    return {
      ...result,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze facial expression. Please try again.");
  }
}
