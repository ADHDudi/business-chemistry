import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const apiKeyLine = envContent.split('\n').find(l => l.startsWith('VITE_GEMINI_API_KEY='));
  const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : '';

  const genAI = new GoogleGenAI({ apiKey: apiKey });

  async function test() {
    console.log("Testing API...");
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: "Say hello",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              greeting: { type: Type.STRING }
            },
            required: ["greeting"]
          }
        }
      });
      console.log("Success:", response.text);
    } catch (e) {
      console.error("SDK Error:", e);
    }
  }

  test();
} catch (e) {
  console.error("Script error:", e);
}
