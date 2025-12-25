
import { GoogleGenAI, Type } from "@google/genai";
import { EmotionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const EMOTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    faceDetected: {
      type: Type.BOOLEAN,
      description: "Whether a human face was successfully detected in the image",
    },
    faceRecognitionScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 1 representing the certainty of the human face match",
    },
    primaryEmotion: {
      type: Type.STRING,
      description: "The dominant emotion (Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral, Contemptuous, Confused)",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1",
    },
    boundingBox: {
      type: Type.OBJECT,
      properties: {
        ymin: { type: Type.NUMBER },
        xmin: { type: Type.NUMBER },
        ymax: { type: Type.NUMBER },
        xmax: { type: Type.NUMBER }
      },
      description: "Normalized coordinates (0-1000)",
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
      description: "A short, one-sentence observation about the expression",
    }
  },
  required: ["faceDetected", "faceRecognitionScore", "primaryEmotion", "confidence", "secondaryEmotions", "description"]
};

/**
 * Utility to strip markdown code blocks and return raw JSON string
 */
function cleanJsonString(input: string): string {
  let cleaned = input.trim();
  if (cleaned.startsWith("```")) {
    // Remove opening tag (e.g., ```json or ```)
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "");
    // Remove closing tag
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  return cleaned.trim();
}

export async function analyzeEmotion(base64Image: string): Promise<EmotionData> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze the face in this image for emotion and identity verification. If no face is found, set faceDetected to false. Return ONLY raw JSON matching the provided schema. Do not include extra text." },
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

    const cleanedText = cleanJsonString(response.text || "");
    if (!cleanedText) {
      throw new Error("The AI returned an empty response.");
    }

    const result = JSON.parse(cleanedText);
    
    return {
      ...result,
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Provide a more descriptive error based on the failure type
    if (error instanceof SyntaxError) {
      throw new Error("Could not interpret the AI's response. Please try scanning again.");
    }
    throw new Error(error.message || "The analysis engine encountered a fault. Ensure your lighting is good.");
  }
}
