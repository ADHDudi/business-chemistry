const { onCall, HttpsError } = require("firebase-functions/v2/https");

exports.generateAIInsights = onCall({ secrets: ["GEMINI_API_KEY"], timeoutSeconds: 120 }, async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new HttpsError('internal', 'Gemini API key not configured');
    }
    const { persona, results, lang, refinementComment, targetProfile } = request.data;

    if (!persona || !results || !lang) {
        throw new HttpsError('invalid-argument', 'Missing required fields: persona, results, or lang');
    }

    const allTypes = {
        he: ['מקדמים (Pioneers)', 'משימתיים (Drivers)', 'מנתחים (Guardians)', 'תומכים (Integrators)'],
        en: ['Pioneers', 'Drivers', 'Guardians', 'Integrators']
    };

    const currentTypeTitle = persona.title[lang];
    const currentTypeBase = currentTypeTitle.split(' ')[0] || currentTypeTitle;
    const otherTypes = allTypes[lang].filter(t => !t.includes(currentTypeBase));
    const focusProfile = targetProfile || otherTypes[0];

    const isHebrew = lang === 'he';
    const langName = isHebrew ? 'Hebrew' : 'English';
    const langInstruction = isHebrew
      ? 'CRITICAL: You MUST write every single text value in Hebrew (עברית). Do NOT use English for any text field. All sentences, phrases, labels, and scripts must be in Hebrew only.'
      : 'Write all text values in English.';

    const prompt = `
    You are an expert organizational psychologist specializing in ADHD and workplace communication.
    Analyze this Bond personality profile and return a structured coaching report.

    LANGUAGE REQUIREMENT: ${langInstruction}

    Profile: ${currentTypeTitle}
    Scores: Formal ${results.formal}/6, Dominance ${results.dominant}/6
    Target interaction profile: ${focusProfile}
    Output language: ${langName}

    ${refinementComment ? `User feedback on previous analysis: "${refinementComment}". Incorporate this to improve accuracy.` : ''}

    Return a JSON object with (ALL TEXT VALUES IN ${langName.toUpperCase()}):
    - user_profile.type: the profile name (short label) — in ${langName}
    - user_profile.superpower: their single greatest professional strength (punchy, 8-12 words) — in ${langName}
    - user_profile.kryptonite: their biggest professional blind spot (punchy, 8-12 words) — in ${langName}
    - user_profile.challenges: array of exactly 3 specific blind spots/challenges this persona faces. Each item must have:
        - title: a short, named label for the challenge (3-5 words) — in ${langName}
        - description: 1-2 sentences explaining the underlying pattern and why it happens — in ${langName}
        - watch_for: one concrete workplace scenario where this challenge typically shows up (a short phrase) — in ${langName}
    - interaction_guide.target_profile: the name of the profile they are interacting with — in ${langName}
    - interaction_guide.friction_point: the #1 source of tension between these two types (1 sentence) — in ${langName}
    - interaction_guide.strategy_card.title: short name for the strategy (3-5 words) — in ${langName}
    - interaction_guide.strategy_card.action: concrete action to take (1 sentence, imperative) — in ${langName}
    - interaction_guide.strategy_card.script: an example phrase or script to use (quoted, natural language) — in ${langName}
    - executive_function_tool.tool_name: name of an ADHD exec-function technique — in ${langName}
    - executive_function_tool.instruction: how to apply it in a professional dialogue (1-2 sentences) — in ${langName}
    - executive_function_tool.template_ready: true if a ready-made template or script exists for this tool
  `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const text = parts.filter(p => !p.thought).map(p => p.text).join('');
        if (!text) throw new HttpsError('internal', 'Empty response from AI');

        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim();
        const json = JSON.parse(cleaned);
        return json;
    } catch (error) {
        console.error("AI Insights Error Details:", error);
        throw new HttpsError('internal', 'Failed to generate AI insights', error);
    }
});

exports.generateCompatibilityAnalysis = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new HttpsError('internal', 'Gemini API key not configured');
    }
    const { userA, userB, lang } = request.data;

    if (!userA || !userB || !lang) {
        throw new HttpsError('invalid-argument', 'Missing required fields: userA, userB, or lang');
    }

    const isHebrew = lang === 'he';
    const langName = isHebrew ? 'Hebrew' : 'English';
    const langInstruction = isHebrew
      ? 'CRITICAL: You MUST write every single text value in Hebrew (עברית). Do NOT use English for any text field.'
      : 'Write all text values in English.';

    const prompt = `
    Role: You are an expert Organizational Psychologist specializing in startup co-founder and team dynamics.
    Objective: Analyze the compatibility of two people based on their Bond personality profiles.

    LANGUAGE REQUIREMENT: ${langInstruction}

    Person A: ${userA.name} (${userA.persona.title[lang] || userA.persona.title.en})
    - Traits: Formal ${userA.results.formal}/6, Dominant ${userA.results.dominant}/6
    - Description: ${userA.persona.description[lang] || userA.persona.description.en}

    Person B: ${userB.name} (${userB.persona.title[lang] || userB.persona.title.en})
    - Traits: Formal ${userB.results.formal}/6, Dominant ${userB.results.dominant}/6
    - Description: ${userB.persona.description[lang] || userB.persona.description.en}

    Instructions:
    1. Compare their profiles.
    2. Identify Gaps: Look for divergences in Risk Tolerance, Vision, and Work Ethic based on their profiles (e.g., Pioneer vs Guardian is a risk gap).
    3. Calculate a "Compatibility Score" (0-100%) based on the severity of gaps vs synergies.
    4. ALL text output must be in ${langName}.

    Output Format (JSON Only, ALL TEXT IN ${langName.toUpperCase()}):
    {
      "score": number,
      "friction_points": ["point 1 in ${langName}", "point 2 in ${langName}", "point 3 in ${langName}"],
      "synergies": ["point 1 in ${langName}", "point 2 in ${langName}", "point 3 in ${langName}"],
      "verdict": "One sentence recommendation in ${langName}"
    }
  `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const text = parts.filter(p => !p.thought).map(p => p.text).join('');
        if (!text) throw new Error('Empty response from AI');

        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim();
        const json = JSON.parse(cleaned);
        return json;
    } catch (error) {
        console.error("Compatibility AI Error:", error);
        throw new HttpsError('internal', 'Failed to generate compatibility analysis', error);
    }
});
