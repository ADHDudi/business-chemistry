<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Business Chemistry

Welcome to the **Business Chemistry** app! This document guides you through running the project locally, and breaks down the project from three key angles: the core business value, the end-to-end user journey, and the concrete outputs users receive.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

View your app in AI Studio: https://ai.studio/apps/drive/12Z0s98PUWImGyeTTWzn_RUttA6PzAFWE

---

## 1. Business Value Perspective

The Business Chemistry application is designed as a deep psychological assessment and team-building tool specifically tailored for startups, co-founders, and modern working environments. Its primary business value includes:

* **Team Alignment & Conflict Prevention:** By assessing individuals along two primary axes (Formal vs. Dominant), the app identifies potential behavioral clashes (e.g., a "Pioneer" clashing with a "Guardian") before they derail critical projects.
* **Specialized ADHD Awareness:** Unlike generic personality tests, this product includes a specific focus on neurodiversity. It reframes ADHD traits—turning "low formality" into an "Innovation Engine"—and gives users concrete executive functioning hacks, acknowledging how modern neurodivergent founders operate.
* **Actionable ROI through AI Coaching:** Rather than leaving users with a static result, the app uses Google's Gemini AI to act as an on-demand organizational psychologist. It generates targeted script strategies ("Strategy Cards") to help users communicate effectively with their polar opposites in high-stress business scenarios.
* **Co-Founder Compatibility Verification:** For investors or accelerators, understanding shared risk parameters and friction points between co-founders is crucial. The app automatically calculates synergy and friction, providing structural de-risking for new ventures.

---

## 2. User Journey

The application flows through a seamless, interactive sequence:

1. **Onboarding & Session Creation:**
   * The user arrives at the platform, enters their name and email, and either starts a solo assessment or creates a shared "Session Lobby" to invite a co-founder/partner using a generated Session code.
2. **The Assessment Wizard:**
   * The user is guided through an interactive, multi-step questionnaire (typically ~35 questions). 
   * The UI limits distractions and uses a "Live Progress Bar" to keep engagement high until the assessment is finished.
3. **Instant Profile Reveal (Report View):**
   * Upon completion, the user immediately enters the dashboard to see their distinct persona (e.g., Pioneer, Driver, Guardian, or Integrator).
   * They get a breakdown of their "Superpowers" and "Kryptonite."
4. **AI-Powered Deep Dive:**
   * The user navigates to the **AI Analysis** tab, triggering a backend cloud function. The AI analyzes their literal scores and generates personalized coaching on how to manage their traits and work better with other specific types.
   * **Feedback Loop:** If the AI's advice doesn't resonate, the user can click a "Thumbs Down" and provide text feedback. The AI instantly refines its psychological analysis in real-time.
5. **Multiplayer Comparison View (If Applicable):**
   * If two users linked their session, the application displays a side-by-side "Comparison View," utilizing AI to read both datasets and spit out a structured compatibility analysis.

---

## 3. Outputs and Artifacts Provided to the User

By completing the journey, the user walks away with several high-value, personalized artifacts:

* **The Business Chemistry Profile:** A visual assessment of their working style, mapped against the Formal/Dominant spectrum.
* **AI Coaching Briefs:**
  * **"The Why":** A psychological breakdown of how their specific scores manifest in their day-to-day behavior.
  * **"Working with Others" Profiles:** Specific interaction guides detailing how to talk to other chemistry types without causing friction.
  * **ADHD Executive Function Hacks:** A specific, tailored tool (like a "Parking Lot" technique) designed to manage impulsivity and leverage neurodivergent strengths.
* **Strategy Cards:** Specific scripts and actionable steps for handling workplace conflict (e.g., exactly what a Pioneer should say to soothe a Driver).
* **Compatibility Matrix Document (For Teams):**
  * A definitive combined score (0-100%).
  * A clear list of **Friction Points** (where the team will struggle).
  * A clear list of **Synergies** (where the team will dominate).
  * A bottom-line Executive Verdict recommending how the team should offset each other's weaknesses.
