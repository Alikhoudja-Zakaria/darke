import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", key ? `${key.substring(0, 10)}...` : "None");
  if (!key) {
    console.error("No API key found in .env");
    process.exit(1);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    console.log("Calling Gemini 2.5 Flash...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with "Gemini is working!"'
    });
    console.log("Response:", response.text.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
  process.exit(0);
}

test();
