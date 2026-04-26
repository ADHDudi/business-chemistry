# Product Backlog

This backlog tracks pending feature improvements, risk mitigations, and systemic updates required to stabilize the Business Chemistry platform before scaling to a larger user base.

## 🚨 High Priority (Legal, Compliance, & Safety)

- [ ] **Email/Password Auth Bypass**
  - **Issue:** The local login form currently accepts any email and proceeds to log the user in, even if they have never signed up via Firebase Email/Password Auth in the past.
  - **Task:** Implement actual Firebase `signInWithEmailAndPassword` & `createUserWithEmailAndPassword` validation instead of bypassing local verification.
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

- [ ] **AI Insights Not Translated to Hebrew**
  - **Issue:** When switching the app language to Hebrew, AI-generated insight text remains in English instead of rendering in Hebrew.
  - **Task:** Ensure AI insight generation requests include the selected locale, and that the prompt instructs the model to respond in Hebrew when the user's language is set to `he`.
- [ ] **"Start All Over Again" Button on All Result Tabs**
  - **Issue:** The reset/restart action is only available in the "Results & Analysis" tab, but users expect to be able to restart from any tab in the result screen.
  - **Task:** Add a "Start All Over Again" CTA at the bottom of every tab in the result screen, consistent with the existing button style and behavior in the "Results & Analysis" tab.


- [ ] **Manage "Instant" Reveal Expectations**
  - **Issue:** Cloud Function cold starts and Firestore latency will occasionally cause spikes in delay. Calling the reveal "immediate" sets users up to perceive failure.
  - **Task:** Design and implement a robust "loading state" for the Report View. Include animated skeletons or engaging copy ("Crunching your behavioral data...") to mask network latency.
- [ ] **AI Generation Error Handling**
  - **Issue:** The `generateAIInsights` and `generateCompatibilityAnalysis` cloud functions can fail or timeout from the Gemini API. 
  - **Task:** Ensure the mobile and web clients handle these `internal` errors gracefully. Show a helpful fallback UI with a "Retry Analysis" button instead of crashing or showing blank prose elements.
  - **Test Evidence (2026-04-26):** Acceptance test confirmed — AI Analysis tab timed out after 15s with no content rendered in `.prose` element. Root cause unknown (possible cold start or silent API failure).

## 🕵️ Security & Stability (Adversarial Review Findings)

- [ ] **Fragile AI State Management**
  - **Issue:** Component relies on `lastFetchRef` "band-aids" to prevent infinite loops.
  - **Task:** Refactor `ReportView.tsx` AI logic into a controlled state machine or use a custom hook to manage data fetching triggers more predictably.
- [ ] **Security Leak Prevention**
  - **Issue:** Past API key leaks indicate a lack of automated safeguards.
  - **Task:** Implement `gitleaks` or a similar pre-commit hook to scan for secrets before they are committed to GitHub.
- [ ] **Transparent AI Error Reporting**
  - **Issue:** UI shows a generic "Thinking" state for all failures (timeouts, rate limits, quota).
  - **Task:** Upgrade `geminiService.ts` and `ReportView.tsx` to surface specific error types and actionable advice to the user.
- [ ] **Resilient Deployment Workflow**
  - **Issue:** `deploy.sh` lacks atomic builds or rollback capabilities.
  - **Task:** Refactor the deployment script to verify build integrity and support rollbacks to the previous version if deployment fails.
- [ ] **Prompt Injection Hardening**
  - **Issue:** User-provided comments and profiles are injected directly into LLM prompts without sanitization.
  - **Task:** Implement server-side validation and length limits for all user input used in AI prompt construction.
- [ ] **Externalized AI Configuration**
  - **Issue:** Hardcoded prompts in code make updates slow and risky.
  - **Task:** Move AI prompt templates to a configuration file or Firebase Remote Config for easier tuning without full deployments.
- [ ] **Mock AI for Development**
  - **Issue:** Local dev requires real API calls, which is slow and consumes quota.
  - **Task:** Implement a mock service layer that returns static JSON responses when `VITE_USE_MOCK_AI=true`.
- [ ] **Reliable Data Syncing**
  - **Issue:** Over-reliance on `useEffect` and browser visibility events for data persistence is prone to lost updates.
  - **Task:** Redesign the telemetry and result-syncing logic to use a more durable approach, such as local storage buffering or a confirmed sync queue.
- [ ] **Centralized Translation Framework**
  - **Issue:** Translation strings are scattered across constants and component props.
  - **Task:** Consolidate all i18n logic into a single JSON-based framework to simplify multi-language maintenance.
- [ ] **Global Tool Dependency Check**
  - **Issue:** Deployment script assumes the environment is perfectly configured.
  - **Task:** Add explicit checks for `firebase-tools`, `git`, and active login sessions at the start of `deploy.sh`.

