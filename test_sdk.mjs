import { GoogleGenAI } from "@google/genai";

try {
  const ai1 = new GoogleGenAI("dummy-key-1");
  console.log("String init worked:", !!ai1.apiKey);
} catch(e) { console.log("String init failed", e.message); }

try {
  const ai2 = new GoogleGenAI({ apiKey: "dummy-key-2" });
  console.log("Object init worked:", !!ai2.apiKey);
} catch(e) { console.log("Object init failed", e.message); }
