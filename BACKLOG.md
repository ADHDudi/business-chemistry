# Product Backlog

This backlog tracks pending feature improvements, risk mitigations, and systemic updates required to stabilize the Business Chemistry platform before scaling to a larger user base.

## 🚨 High Priority (Legal, Compliance, & Safety)

- [ ] **Data Privacy & GDPR/CCPA Compliance**
  - **Issue:** No privacy section or data handling policy exists yet for sensitive behavioral data and emails.
  - **Task:** Create a Privacy Policy. Implement data scrubbing for PII and add a "Delete My Data" feature. Ensure session data is encrypted and not permanently stored unless explicitly agreed to.
- [ ] **Disclaimers & Liability Mitigation**
  - **Issue:** Copy claims "deep psychological assessment" and positions the AI as an "organizational psychologist". This is a massive liability.
  - **Task:** Add clear disclaimers that this tool is for professional communication framing, not a clinical psychiatric evaluation. Change marketing copy to reflect realistic outcomes. Add a disclaimer to the Compatibility Matrix against using it for final investment/hiring decisions.

## 🟡 Medium Priority (Product & UX Polish)

- [ ] **Refine "Strategy Cards" UX**
  - **Issue:** Strict reading of AI-generated "scripts" during conflict resolution is robotic and can backfire.
  - **Task:** Adjust the AI prompts so that "Strategy Cards" provide conversational bullet points, frameworks, or "do's and don'ts" rather than exact scripts.
- [ ] **Unhappy Path Handling (Session Wizard & Lobby)**
  - **Issue:** The journey assumes users cleanly finish the 35 questions and partners successfully join. No edge cases handled.
  - **Task:** Add timeout states for the Session Lobby. If a partner doesn't join within X minutes, offer to take a solo test or send an email reminder. Add a "save and continue later" functionality for abandoned questionnaires.
- [ ] **Clinical Terminology Verification**
  - **Issue:** Leaning on terminology like "ADHD" to explain specific profiles may cross over into unqualified medical advice.
  - **Task:** Audit all AI prompts for unverified clinical acronyms. Frame ADHD "hacks" strictly within the boundaries of executive functioning for office productivity, not psychological treatment.

## 🟢 Regular Priority (Engineering & Resilience)

- [ ] **Manage "Instant" Reveal Expectations**
  - **Issue:** Cloud Function cold starts and Firestore latency will occasionally cause spikes in delay. Calling the reveal "immediate" sets users up to perceive failure.
  - **Task:** Design and implement a robust "loading state" for the Report View. Include animated skeletons or engaging copy ("Crunching your behavioral data...") to mask network latency.
- [ ] **AI Generation Error Handling**
  - **Issue:** The `generateAIInsights` and `generateCompatibilityAnalysis` cloud functions can fail or timeout from the Gemini API. 
  - **Task:** Ensure the mobile and web clients handle these `internal` errors gracefully. Show a helpful fallback UI with a "Retry Analysis" button instead of crashing or showing blank prose elements.
