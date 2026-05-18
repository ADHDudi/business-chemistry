<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bond
**Workplace Communication OS**

Welcome to **Bond** — a workplace communication tool that helps coworkers and teams understand each other better. This document guides you through running the project locally, and breaks down the project from three key angles: the core business value, the end-to-end user journey, and the concrete outputs users receive.

---

## What's New

### May 2026
- **AI Coaching Fix** — `generateAIInsights` now returns a structured `AICommunicationCoach` JSON object (superpower, kryptonite, optional challenges, interaction guide, executive function tool). Switched to `gemini-1.5-flash` via REST with `responseMimeType: application/json`; added 120s timeout. Previously the function returned raw markdown text that the client failed to parse.
- **Firebase Functions Secret Fix** — Resolved a deployment failure caused by `GEMINI_API_KEY` being registered as both a Cloud Secret Manager secret and a plain environment variable. Functions now use `secrets: ["GEMINI_API_KEY"]` and read via `process.env`.
- **Email/Password Authentication** — Implemented full sign-in/sign-up/forgot-password flow using Firebase Auth (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`). Fixed a prior auth bypass where any valid-format email + any password would log in without Firebase verification.
- **Sign-Up Modal** — New `SignUpForm` component allows new users to register with name, email, and password directly in the app.
- **Forgot Password Modal** — New `ForgotPasswordForm` component sends a Firebase password reset email.
- **Expanded Test Suite** — 8 Puppeteer acceptance suites covering auth structure, sign-in happy/fail paths, Google sign-in, auth modals (sign-up + forgot password), report tab structure, AI analysis (all 4 personas), and the full end-to-end flow. Stable `data-testid` selectors added throughout the report view.
- **CollapsibleSection Component** — New reusable accordion component (`src/components/CollapsibleSection.tsx`) available for collapsible content blocks.
- **Rebranded to Bond** — the app is now "Bond" with the tagline "Workplace Communication OS". The methodology (4 personas on the Formal/Dominant axes) is unchanged; only the product surface and brand identity have evolved. New speech-bubbles icon + violet→cyan gradient.
- **Just AI It Design System** — Full visual overhaul: violet→cyan brand gradient, Space Grotesk display font, Inter body font, JetBrains Mono for codes, icon-in-tile card headers, and brand shadow tokens applied throughout all components.
- **Legal Compliance Pages** — Three bilingual (Hebrew/English) legal pages added: Terms of Use, Privacy Policy, and Accessibility Statement — all accessible via footer links and hash-based routing (`#terms`, `#privacy`, `#accessibility`).
- **Header Redesign** — Streamlined header with language toggle and session/auth controls only; clean, distraction-free navigation.
- **Bilingual RTL Support** — Full Hebrew (RTL) and English (LTR) support across all screens including legal pages, forms, and the report view.
- **Firebase Authentication** — Google OAuth sign-in integrated; users can sign in with Google to access the assessment.
- **Session/Live Mode** — Real-time multiplayer assessment sessions using Firebase Realtime Database, with live progress sync and shared results.

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

View the live application on Firebase Hosting: **[Bond](https://business-chemistry.web.app/)**

### Environment Configuration

The app supports Firebase Hosting dynamic config injection. When deployed on Firebase Hosting, configuration is automatically injected via `/__/firebase/init.js`. For local development, hardcoded Firebase config is used.

Required environment variables (in `.env.local`):
- `VITE_GEMINI_API_KEY` — Google Gemini AI API key (used in local dev only; Cloud Functions read from Secret Manager)

Cloud Functions require `GEMINI_API_KEY` stored in Firebase Secret Manager (set once via `firebase functions:secrets:set GEMINI_API_KEY`).

### Testing

Acceptance tests are written with Puppeteer in `test.js`. They cover 8 suites:

| Suite | What it covers |
|-------|---------------|
| 1 — Auth: Page Structure | Email/password inputs, submit button, Google button, Sign-up link, Forgot Password link |
| 2 — Auth: Sign-In Happy Path | Valid credentials reach the questionnaire |
| 3 — Auth: Sign-In Fail Paths | Empty fields, bad email format, wrong credentials, Sign-up modal |
| 4 — Auth: Google Sign-In | Button visible, logo loads, real `signInWithPopup` wired |
| 5 — Auth Modals | Sign-up modal fields; Forgot Password modal + send button |
| 6 — Report: Tab Structure | All 4 tab buttons present, each renders its content panel |
| 7 — Report: AI Analysis | AI loads within 30s; persona picker buttons present; AI reloads for each of 4 personas |
| 8 — Full Flow | Sign-in → questionnaire → report → AI coaching end-to-end |

```bash
# Run tests against production (default: https://business-chemistry.web.app/)
npm test

# Run tests against your local dev server
npm run dev               # in one terminal
node test.js http://localhost:3002/   # in another
```

**Notes:**
- The test runner uses `protocolTimeout: 300000` (5 minutes) to accommodate slow Firebase initialization in browser-driven tests.
- Tab assertions use `data-testid` attributes (`tab-overview`, `tab-ai`, `tab-prepare`, `tab-matrix`) so they stay stable when labels change or are translated.
- The AI suite (Suite 7) selects all 4 personas and waits up to 35s each — expect this suite to take 2–3 minutes.
- A bilingual HTML report is written to `acceptance_report.html` after each run.

---

## 1. Business Value Perspective

Bond is a workplace communication tool designed to improve how coworkers and teams understand and work with each other. Its primary business value includes:

Communication persona analysis — analyzes the user and determines their dominant persona as Pioneer, Driver, Guardian, or Integrator.

* **Team Alignment & Conflict Prevention:** By assessing individuals along two primary axes (Formal vs. Dominant), the app identifies potential behavioral clashes (e.g., a "Pioneer" clashing with a "Guardian") before they derail critical projects.

* **Actionable ROI through AI Coaching:** Rather than leaving users with a static result, the app uses Google's Gemini AI to act as an on-demand organizational psychologist. It generates targeted script strategies ("Strategy Cards") to help users communicate effectively with their polar opposites in high-stress business scenarios.

The analysis and recommendation are based on:
1. Thomas Erickson — "Surrounded by Idiots" — https://www.surroundedbyidiots.com/en/books/surrounded-by-idiots/
2. Deloitte's research methodology — https://www.deloitte.com/us/en/services/consulting/services/business-chemistry.html

---

## 2. User Journey

The application flows through a seamless, interactive sequence:

1. **Onboarding**
   * The user arrives at the platform in their preferred language (Hebrew or English), signs in with Google or email+password (or registers via the Sign-Up modal), and starts a solo or live assessment.
2. **The Assessment Wizard**
   * The user is guided through an interactive, multi-step questionnaire (typically ~35 questions).
   * The UI limits distractions and uses a live progress bar to keep engagement high until the assessment is finished. In Live Mode, both participants see each other's progress in real-time.
3. **Instant Profile Reveal (Report View)**
   * Upon completion, the user enters the report dashboard with four tabs:
   * **Overview** (default): Profile summary, Your Superpower, Strengths, and Tips for this persona type.
   * **AI Analysis**: Automatically generates a personalized coaching brief — superpower, kryptonite, and optional behavioral challenges — powered by Gemini.
   * **Prepare for Meeting**: Select a target persona (Guardian, Driver, Integrator, or Pioneer). The AI returns a Friction Point callout, a Strategy Card with a concrete action and script, and an Executive Function Tool (ADHD-friendly technique).
   * **Matrix**: The 2D Formal × Dominant grid showing the user's position relative to all four persona quadrants.
   * The report view is fully responsive, with mobile-optimized layouts and accessible navigation.
4. **AI-Powered Coaching (Prepare for Meeting tab)**
   * The user picks the persona they're meeting with and a backend Cloud Function generates tailored coaching in real-time.
   * **Feedback Loop:** If the AI's advice doesn't resonate, the user can click "Thumbs Down" and provide text feedback. The AI instantly refines its analysis.
5. **Multiplayer Comparison View (If Applicable)**
   * If two users linked their session, the application displays a side-by-side Comparison View, utilizing AI to read both datasets and produce a structured compatibility analysis.
   * Shows live compatibility score, friction points, and synergies between both participants.

### Live Mode Features

* **Real-Time Sync:** Live progress bars show both participants' assessment completion in real-time.
* **Multiplayer Insights:** AI generates interaction guides tailored to both profiles' dynamics.
* **Data Persistence:** Session data is stored in Firebase Realtime Database for reliability.

---

## 3. Outputs and Artifacts Provided to the User

By completing the journey, the user walks away with several high-value, personalized artifacts:

* **The Bond Profile:** A visual assessment of their working style, mapped against the Formal/Dominant spectrum.
* **AI Coaching Briefs:**
  * **Superpower & Kryptonite:** A concise psychological snapshot of their greatest strength and biggest blind spot.
  * **Behavioral Challenges:** Up to 3 named challenges with descriptions and "watch for" workplace scenarios.
  * **Meeting Prep Guides:** Persona-specific interaction guides with friction points, strategy scripts, and executive function tools.
* **Strategy Cards:** Specific scripts and actionable steps for handling workplace conflict (e.g., exactly what a Pioneer should say to a Driver).
* **Compatibility Analysis (For Teams):**
  * A combined compatibility score (0–100%).
  * A clear list of **Friction Points** (where the team will struggle).
  * A clear list of **Synergies** (where the team will dominate).
  * A bottom-line Executive Verdict.

---

## 4. Design System & Brand

Bond implements the **Just AI It Design System** — a unified visual language applied through CSS tokens and Tailwind utility classes. The system is purely visual (no logo appears in navigation); all brand tokens live in `src/index.css` and are applied via Tailwind classes throughout the app.

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| Violet | `#8c50f0` | CTAs, active states, icons, focus rings |
| Deep Purple | `#6a2dd0` | Strong text on soft backgrounds, session codes |
| Cyan | `#3cdcf0` | Gradient endpoint, highlights |
| Soft Background | `#f3ecff` | Pill/chip backgrounds, card tints |
| Soft Border | `#e4d7ff` | Pill/chip borders, code box borders |
| Brand Gradient | `linear-gradient(135deg, #a014f0 → #8c50f0 → #5078ff → #3cdcf0)` | Buttons, progress bars, icon badges, visual separators |

### Typography
| Font | Weight | Usage |
|------|--------|-------|
| Space Grotesk | 700 | Display headings, welcome title |
| Inter | 300–900 | All UI body text |
| JetBrains Mono | 400, 700 | Session codes, monospace elements |

### CSS Utility Classes (`src/index.css`)
- `.brand-gradient` — Applies the full violet→cyan gradient as background
- `.gradient-text` — Applies gradient as clipped text fill (welcome heading)
- `.btn-gradient` — Gradient button with brand shadow and active scale
- `.btn-score-active` — Score picker active state with gradient background
- `.eyebrow` — 10px uppercase label with wide letter-spacing

### Components
- **Card Styling:** `rounded-[1.75rem]` (28px) radius, `shadow-[0_8px_24px_rgba(15,23,42,0.08)]`
- **Icon-in-Tile Pattern:** Section headers use a white `rounded-xl` tile with colored icon — replaces old solid-color headers
- **Header:** Sticky, blurred white — language toggle on one side, session/auth controls on the other. Clean and controls-only (no logo in navigation)
- **Progress Bars:** Brand gradient (`from-[#a014f0] via-[#5078ff] to-[#3cdcf0]`) with smooth CSS transitions
- **Score Picker:** 6-step slider buttons using `.btn-score-active` for the selected value

### Responsive Design
- Mobile-first approach; all views work on screens from 320px wide
- RTL (`dir="rtl"`) applied on `<html>` when language is Hebrew
- Accessible focus indicators on all interactive elements
- Keyboard navigation supported throughout

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
* **Authentication:** Firebase Authentication (Google OAuth + Email/Password)
* **Database:** Firebase Realtime Database for session management
* **AI Integration:** Google Gemini 1.5 Flash via REST API (Cloud Functions)
* **Cloud Functions:** Firebase Functions v2, Node.js 22, us-central1
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
├── App.tsx                          # Main app component — routing, auth, language management
├── components/
│   ├── ReportView.tsx               # Report dashboard — Overview / AI Analysis / Prepare / Matrix tabs
│   ├── CollapsibleSection.tsx       # Reusable accordion component
│   ├── SignUpForm.tsx               # Sign-up modal (createUserWithEmailAndPassword)
│   ├── ForgotPasswordForm.tsx       # Password reset modal (sendPasswordResetEmail)
│   ├── ComparisonView.tsx           # Multiplayer compatibility analysis view
│   ├── LiveProgressBar.tsx          # Real-time progress display for live sessions
│   ├── SessionLobby.tsx             # Session creation and join interface
│   ├── SessionWizard.tsx            # Guided session setup flow
│   ├── Footer.tsx                   # Footer with legal page links
│   └── legal/
│       ├── TermsPage.tsx            # Terms of Use page
│       ├── PrivacyPage.tsx          # Privacy Policy page
│       └── AccessibilityPage.tsx    # Accessibility Statement page
├── constants.tsx                    # Bilingual text content and persona definitions
├── types.ts                         # TypeScript type definitions
├── firebaseConfig.ts                # Firebase configuration
├── geminiService.ts                 # Firebase callable function client (AI insights + compatibility)
├── index.css                        # Design system tokens and utility classes
└── index.tsx                        # React entry point

functions/
└── index.js                         # Cloud Functions — generateAIInsights, generateCompatibilityAnalysis

test.js                              # Puppeteer acceptance test suite (8 suites, run with `npm test`)
docs/
└── functional-spec.md               # Ground-truth functional specification
```
