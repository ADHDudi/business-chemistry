<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Business Chemistry

Welcome to the **Business Chemistry** app! This document guides you through running the project locally, and breaks down the project from three key angles: the core business value, the end-to-end user journey, and the concrete outputs users receive.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set your API keys and configuration in `.env.local` (e.g., `VITE_GEMINI_API_KEY`).
3. Run the app on port 3002:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3002/`*

### Deployed Application

View the live application on Firebase Hosting: **[Business Chemistry App](https://business-chemistry.web.app/)**

### Environment Configuration

The app supports Firebase Hosting dynamic config injection. When deployed on Firebase Hosting, configuration is automatically injected via `/__/firebase/init.js`. For local development, hardcoded Firebase config is used.

Required environment variables (in `.env.local`):
- `VITE_GEMINI_API_KEY` — Google Gemini AI API key for generating coaching insights

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
   * The user arrives at the platform in their preferred language (Hebrew or English), enters their name and email, and either starts a solo assessment or creates a shared "Session Lobby" to invite a co-founder/partner using a generated Session code.
   * In **Live Mode**, users can create a session and invite partners via a unique 6-character code, with real-time progress synchronization.
2. **The Assessment Wizard:**
   * The user is guided through an interactive, multi-step questionnaire (typically ~35 questions). 
   * The UI limits distractions and uses a "Live Progress Bar" to keep engagement high until the assessment is finished. In Live Mode, both participants see each other's progress in real-time.
3. **Instant Profile Reveal (Report View):**
   * Upon completion, the user immediately enters the dashboard to see their distinct persona (e.g., Pioneer, Driver, Guardian, or Integrator).
   * They get a breakdown of their "Superpowers" and "Kryptonite."
   * The report view is fully responsive, with mobile-optimized layouts and accessible navigation.
4. **AI-Powered Deep Dive:**
   * The user navigates to the **AI Analysis** tab, triggering a backend cloud function. The AI analyzes their literal scores and generates personalized coaching on how to manage their traits and work better with other specific types.
   * Users can select a target profile (Guardian, Driver, Integrator, Pioneer) to customize AI coaching for specific interaction scenarios.
   * **Feedback Loop:** If the AI's advice doesn't resonate, the user can click a "Thumbs Down" and provide text feedback. The AI instantly refines its psychological analysis in real-time.
5. **Multiplayer Comparison View (If Applicable):**
   * If two users linked their session, the application displays a side-by-side "Comparison View," utilizing AI to read both datasets and spit out a structured compatibility analysis.
   * Comparison view shows live compatibility metrics and friction point analysis between both participants.

### Live Mode Features

* **Session Codes:** 6-character unique codes enable co-founders/partners to join a shared assessment session
* **Real-Time Sync:** Live progress bars show both participants' assessment completion in real-time
* **Multiplayer Insights:** AI generates interaction guides tailored to both profiles' dynamics
* **Data Persistence:** Session data is stored in Firebase Realtime Database for reliability

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

---

## 4. Design System & Brand

The Business Chemistry application implements the **Just AI It Design System**, a unified brand and visual language:

### Brand Colors
- **Violet (#8c50f0):** Primary brand color, used for CTAs, active states, and accents
- **Deep Purple (#6a2dd0):** Secondary brand color for text and strong emphasis
- **Cyan (#3cdcf0):** Accent color for gradients and highlights
- **Soft Background (#f3ecff):** Light purple tint for pill backgrounds and cards
- **Brand Gradient:** `linear-gradient(135deg, #a014f0 0%, #8c50f0 28%, #5078ff 58%, #3cdcf0 100%)` — Applied to buttons, icons, and visual separators

### Typography
- **Display Font:** Space Grotesk 700 — Bold, modern headline typography
- **Body Font:** Inter — Clean, accessible UI text
- **Monospace Font:** JetBrains Mono — Code, session codes, and technical text

### Components
- **Card Styling:** Rounded corners (28px), subtle shadows, clean white backgrounds
- **Icon-in-Tile Pattern:** Section headers feature white background icons with purple text on light purple tiles
- **Button Styling:** Gradient backgrounds (.btn-gradient class), rounded corners, active state feedback
- **Form Inputs:** Rounded corners, purple focus states, clear error messaging
- **Progress Indicators:** Brand gradient bars with smooth animations

### Responsive Design
- Fully responsive layouts optimized for mobile, tablet, and desktop
- Mobile-first approach with clear breakpoints
- RTL (right-to-left) support for Hebrew language
- Accessible focus indicators and keyboard navigation

---

## 5. Legal Compliance

The application includes three legally-required compliance pages:

### Terms of Use (`#terms`)
- Covers user registration, account security, and permitted use
- Includes prominent disclaimers about content and limitations of liability
- Specifies intellectual property rights and prohibited activities
- Available in both Hebrew and English

### Privacy Policy (`#privacy`)
- Documents data collection, storage, and usage practices
- Lists all third-party services integrated (Firebase, Google Gemini AI, Google Apps Script)
- Details data retention periods and user rights under Israeli Privacy Protection Law
- Covers cookie usage and direct marketing practices

### Accessibility Statement (`#accessibility`)
- Commits to Israeli Standard IS 5568 Level AA compliance (WCAG 2.1 AA equivalent)
- Details accessibility implementations (RTL support, keyboard navigation, screen reader compatibility)
- Provides accessibility coordinator contact information
- Outlines methods for reporting accessibility gaps

All legal pages are accessible via footer links on every page of the application and support bilingual display (Hebrew/English).

---

## 6. Technology Stack

* **Frontend:** React 19 with Vite bundler
* **Styling:** Tailwind CSS (loaded via CDN)
* **Authentication:** Firebase Authentication (Google OAuth)
* **Database:** Firebase Realtime Database for session management
* **AI Integration:** Google Gemini AI API for personalized coaching
* **Deployment:** Firebase Hosting with dynamic configuration injection
* **Analytics:** Firebase Analytics event tracking
* **Data Export:** Google Apps Script and Sheets integration for reporting

---

## 7. Bilingual Support

The application fully supports Hebrew and English:

* **Language Toggle:** Header button to switch between languages instantly
* **RTL Support:** Automatic right-to-left text direction for Hebrew content
* **Complete Translations:** All UI text, forms, reports, and legal pages available in both languages
* **No Fallback:** Hebrew users never see English; English users never see Hebrew unless toggled

---

## File Structure

```
src/
├── App.tsx                          # Main app component with routing and language management
├── components/
│   ├── LiveProgressBar.tsx          # Real-time progress display for sessions
│   ├── SessionLobby.tsx             # Session creation and join interface
│   ├── SessionWizard.tsx            # Guided session setup flow
│   ├── ReportView.tsx               # Dashboard with tabs (Overview, AI, Matrix)
│   ├── ComparisonView.tsx           # Multiplayer comparison interface
│   ├── Footer.tsx                   # Footer with legal page links
│   └── legal/
│       ├── TermsPage.tsx            # Terms of Use page
│       ├── PrivacyPage.tsx          # Privacy Policy page
│       └── AccessibilityPage.tsx    # Accessibility Statement page
├── constants.ts                     # Text content and persona definitions
├── types.ts                         # TypeScript type definitions
├── firebaseConfig.ts                # Firebase configuration
├── geminiService.ts                 # Google Gemini AI integration
├── index.css                        # Design system tokens and utility classes
└── index.tsx                        # React entry point
```
