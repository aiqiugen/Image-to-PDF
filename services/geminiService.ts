import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSmartFilename = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Extract mime type from base64 string
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Remove data URL prefix if present for clean base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image and suggest a concise, professional filename for a PDF document containing it. Use snake_case or kebab-case. Return ONLY the filename ending in .pdf. Do not include any explanation."
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple tasks
      }
    });

    const filename = response.text?.trim();
    if (!filename) return "document.pdf";
    
    // Cleanup potential markdown formatting if model hallucinates
    return filename.replace(/`/g, '').replace(/^\./, '').trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};