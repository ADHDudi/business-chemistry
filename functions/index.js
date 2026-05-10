const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = defineString("GEMINI_API_KEY");

exports.generateAIInsights = onCall(async (request) => {
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
    const { persona, results, lang, refinementComment } = request.data;

    if (!persona || !results || !lang) {
        throw new HttpsError('invalid-argument', 'Missing required fields: persona, results, or lang');
    }

    const allTypes = {
        he: ['מקדמים (Pioneers)', 'משימתיים (Drivers)', 'מנתחים (Guardians)', 'תומכים (Integrators)'],
        en: ['Pioneers', 'Drivers', 'Guardians', 'Integrators']
    };

    const currentTypeTitle = persona.title[lang];
    // Safe handling if title format is unexpected
    const currentTypeBase = currentTypeTitle.split(' ')[0] || currentTypeTitle;
    const otherTypes = allTypes[lang].filter(t => !t.includes(currentTypeBase));

    const basePrompt = `
    Task: Provide a high-precision, mobile-optimized psychological breakdown for a Bond personality profile with an ADHD focus.
    Name: 'Client'
    Type: ${currentTypeTitle}
    Scores: Formal ${results.formal}/6, Dominance ${results.dominant}/6
    
    CRITICAL INSTRUCTIONS:
    - Keep it under 220 words total.
    - Use SHORT, punchy bullet points.
    - No introductory fluff.
    - Language: ${lang === 'he' ? 'Hebrew' : 'English'}.

    Structure:
    1. **The Why**: Explain how their specific scores (Formal vs Dominance) manifest in their behavior.
    2. **Working with Others**: 1 specific, non-generic communication tip for: ${otherTypes.join(', ')}.
    3. **ADHD Executive Function Hack**: 1 high-impact hack for this ${persona.key} type to manage their professional dialogue, specifically addressing the intersection of their persona and ADHD traits.
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
            model: 'gemini-1.5-flash',
            contents: finalPrompt,
        });
        return { text: response.text || "No insights available." };
    } catch (error) {
        console.error("AI Insights Error Details:", error);
        throw new HttpsError('internal', 'Failed to generate AI insights', error);
    }
});

exports.generateCompatibilityAnalysis = onCall(async (request) => {
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
    const { userA, userB, lang } = request.data;

    if (!userA || !userB || !lang) {
        throw new HttpsError('invalid-argument', 'Missing required fields: userA, userB, or lang');
    }

    const prompt = `
    Role: You are an expert Organizational Psychologist specializing in startup co-founder and team dynamics.
    Objective: Analyze the compatibility of two people based on their Bond personality profiles.
    
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
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        score: { type: "INTEGER" },
                        friction_points: { type: "ARRAY", items: { type: "STRING" } },
                        synergies: { type: "ARRAY", items: { type: "STRING" } },
                        verdict: { type: "STRING" }
                    },
                    required: ["score", "friction_points", "synergies", "verdict"]
                }
            }
        });

        const json = JSON.parse(response.text || "{}");
        return json;
    } catch (error) {
        console.error("Compatibility AI Error:", error);
        throw new HttpsError('internal', 'Failed to generate compatibility analysis', error);
    }
});
