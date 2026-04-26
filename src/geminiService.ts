
import { GoogleGenAI, Type } from "@google/genai";
import { Persona, Results, Language, CompatibilityAnalysis, AICommunicationCoach } from "./types";

// Initialize Generative AI client
const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const getAIInsights = async (
  persona: Persona,
  results: Results,
  lang: Language,
  refinementComment?: string,
  targetProfile?: string // Optional: User can select who they are meeting with
): Promise<AICommunicationCoach | null> => {

  const target = targetProfile || (lang === 'he' ? 'קולגה כללי' : 'General Colleague');

  const basePrompt = `
    Role: You are an Empathetic Executive Coach specializing in ADHD and Neurodiversity.
    Tone: Encouraging, strength-based, "punchy" (short sentences), and heavily structured.
    
    Client Profile:
    - Name: 'Client'
    - Type: ${persona.title.en} (Business Chemistry)
    - Traits: Formal ${results.formal}/6, Dominant ${results.dominant}/6
    - Core Strength: High energy, visionary, risk-taker (Pioneer traits).
    - Core Challenge: Detail evasion, impulsivity, RSD (Rejection Sensitive Dysphoria).

    Context: The client is preparing for a meeting with a "${target}".

    Task:
    Generate a JSON object containing a coaching brief. 
    1. **Profile Summary**: Rebrand their traits. Instead of "Dominant", use "Visionary Spark". Instead of "Low Formal", use "Innovation Engine".
    2. **Interaction Guide**: Explain ONE specific friction point between a Pioneer and a ${target}. Provide a "Strategy Card" with a specific action and a script.
    3. **Executive Function Tool**: Provide a specific "Parking Lot" or "Anchor" technique to manage impulsivity during this specific interaction.

    Language: ${lang === 'he' ? 'Hebrew' : 'English'}.
    
    Output JSON Schema:
    {
      "user_profile": { "type": "string", "superpower": "string", "kryptonite": "string" },
      "interaction_guide": { 
        "target_profile": "${target}",
        "friction_point": "string",
        "strategy_card": { "title": "string", "action": "string", "script": "string" }
      },
      "executive_function_tool": { "tool_name": "string", "instruction": "string", "template_ready": true }
    }
  `;

  const refinementInstruction = refinementComment ? `
    USER FEEDBACK ALERT: The user felt the previous analysis was inaccurate. 
    THEIR SPECIFIC FEEDBACK: "${refinementComment}"
    INSTRUCTION: Please incorporate this feedback to provide a significantly more accurate and personalized analysis. 
    Do not mention the feedback explicitly, just improve the content.
  ` : "";

  const finalPrompt = basePrompt + refinementInstruction;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            user_profile: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                superpower: { type: Type.STRING },
                kryptonite: { type: Type.STRING }
              },
              required: ["type", "superpower", "kryptonite"]
            },
            interaction_guide: {
              type: Type.OBJECT,
              properties: {
                target_profile: { type: Type.STRING },
                friction_point: { type: Type.STRING },
                strategy_card: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    action: { type: Type.STRING },
                    script: { type: Type.STRING }
                  },
                  required: ["title", "action", "script"]
                }
              },
              required: ["target_profile", "friction_point", "strategy_card"]
            },
            executive_function_tool: {
              type: Type.OBJECT,
              properties: {
                tool_name: { type: Type.STRING },
                instruction: { type: Type.STRING },
                template_ready: { type: Type.BOOLEAN }
              },
              required: ["tool_name", "instruction", "template_ready"]
            }
          },
          required: ["user_profile", "interaction_guide", "executive_function_tool"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AICommunicationCoach;

  } catch (error: any) {
    console.error("AI Insights Error Details:", error);
    // Throw the error so the UI can catch it and display a proper message
    throw new Error(error.message || "Failed to communicate with AI provider.");
  }
};

export const getCompatibilityAnalysis = async (
  userA: { name: string; persona: Persona; results: Results },
  userB: { name: string; persona: Persona; results: Results },
  lang: Language
): Promise<CompatibilityAnalysis> => {
  const prompt = `
    Role: You are an expert Organizational Psychologist specializing in startup co-founder and team dynamics.
    Objective: Analyze the compatibility of two people based on their Business Chemistry profiles.
    
    Person A: ${userA.name} (${userA.persona.title.en})
    - Traits: Formal ${userA.results.formal}/6, Dominant ${userA.results.dominant}/6
    - Description: ${userA.persona.description.en}
    
    Person B: ${userB.name} (${userB.persona.title.en})
    - Traits: Formal ${userB.results.formal}/6, Dominant ${userB.results.dominant}/6
    - Description: ${userB.persona.description.en}

    Instructions:
    1. Compare their profiles.
    2. Identify Gaps: Look for divergences in Risk Tolerance, Vision, and Work Ethic based on their profiles (e.g., Pioneer vs Guardian is a risk gap).
    3. Calculate a "Compatibility Score" (0-100%) based on the severity of gaps vs synergies.
    4. Language: ${lang === 'he' ? 'Hebrew' : 'English'}.
    
    Output Format (JSON Only):
    {
      "score": number,
      "friction_points": ["point 1", "point 2", "point 3"],
      "synergies": ["point 1", "point 2", "point 3"],
      "verdict": "One sentence recommendation"
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            friction_points: { type: Type.ARRAY, items: { type: Type.STRING } },
            synergies: { type: Type.ARRAY, items: { type: Type.STRING } },
            verdict: { type: Type.STRING }
          },
          required: ["score", "friction_points", "synergies", "verdict"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json as CompatibilityAnalysis;
  } catch (error) {
    console.error("Compatibility AI Error:", error);
    return {
      score: 50,
      friction_points: ["Analysis failed"],
      synergies: ["Analysis failed"],
      verdict: "Could not generate analysis."
    };
  }
};
