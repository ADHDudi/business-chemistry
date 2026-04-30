import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseConfig";
import { Persona, Results, Language, CompatibilityAnalysis, AICommunicationCoach } from "./types";

export const getAIInsights = async (
  persona: Persona,
  results: Results,
  lang: Language,
  refinementComment?: string,
  targetProfile?: string
): Promise<AICommunicationCoach | null> => {
  try {
    const generateInsights = httpsCallable(functions, 'generateAIInsights');
    const response = await generateInsights({
      persona,
      results,
      lang,
      refinementComment,
      targetProfile
    });

    const data = response.data as { text: string };
    if (!data || !data.text) {
        throw new Error("No text returned from Cloud Function.");
    }

    try {
        const cleanText = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        return json as AICommunicationCoach;
    } catch (parseError) {
        console.error("Failed to parse AI response JSON:", parseError);
        console.log("Raw AI Response:", data.text);
        throw new Error("Invalid response format from AI.");
    }
  } catch (error: any) {
    console.error("Firebase Cloud Function Error:", error);
    
    // Pass the actual error string to the UI so it shows in red
    const errorMessage = error.message || "Failed to generate AI insights";
    throw new Error(`AI Request Failed: ${errorMessage}`);
  }
};

export const getCompatibilityAnalysis = async (
  userA: { name: string; persona: Persona; results: Results },
  userB: { name: string; persona: Persona; results: Results },
  lang: Language
): Promise<CompatibilityAnalysis> => {
  try {
    const generateCompatibility = httpsCallable(functions, 'generateCompatibilityAnalysis');
    const response = await generateCompatibility({
      userA,
      userB,
      lang
    });

    return response.data as CompatibilityAnalysis;
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
