# Bond — Functional Specification

> **Ground truth for implemented behavior.** Describes what the app actually does as of May 2026. Features planned but not yet implemented are excluded.

---

## 1. Authentication

### 1.1 Email/Password Sign-In

**Entry point:** Login screen (`step === 1` in `App.tsx`), email + password form.

**Flow:**
1. User fills `input[type="email"]` and `input[type="password"]` (both `required`).
2. HTML5 browser validation blocks submission if either field is empty or the email format is invalid.
3. On submit, `handleRegister()` calls `signInWithEmailAndPassword(auth, email, password)`.
4. On success: `user.name` set from `displayName || 'Guest'`, `user.email` set, password cleared from state, advances to `step 2` (questionnaire).
5. On failure: Firebase error code mapped to a user-facing English message displayed below the form.

**Error codes handled:**
| Code | Message shown |
|------|--------------|
| `auth/user-not-found` | No account found with this email. Please sign up first. |
| `auth/wrong-password` | Incorrect password. Please try again. |
| `auth/invalid-email` | Invalid email format |
| `auth/too-many-requests` | Too many failed login attempts. Please try again later. |
| `auth/invalid-credential` | Invalid email or password |
| (other) | Firebase error message |

### 1.2 Sign-Up

**Entry point:** "Sign up" button on the login screen opens `SignUpForm` modal.

**Flow:**
1. Modal contains: Name, Email, Password fields + Submit button + Close.
2. On submit, `handleSignUp(email, password)` calls `createUserWithEmailAndPassword(auth, email, password)`.
3. On success: `user.name` set from name field input, `user.email` set, modal closed, advances to questionnaire.
4. On failure: Firebase error code mapped to message shown inside the modal.

**Error codes handled:** `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`.

### 1.3 Forgot Password

**Entry point:** "Forgot Password?" button on the login screen opens `ForgotPasswordForm` modal.

**Flow:**
1. Modal contains: Email field + "Send Reset Email" button + Close.
2. On submit, `handleForgotPassword(email)` calls `sendPasswordResetEmail(auth, email)`.
3. On success: success message shown inside the modal; modal auto-closes after a brief delay.
4. On failure: Firebase error message shown inside the modal.

### 1.4 Google OAuth

**Entry point:** "Sign in with Google" button on the login screen.

**Flow:**
1. Calls `signInWithPopup(auth, googleProvider)`.
2. On success: `user.name` set from `displayName`, `user.email` set, advances to questionnaire.
3. OAuth popup flow — cannot be automated in browser tests.

### 1.5 Session Persistence

`onAuthStateChanged` listener in `App.tsx` keeps `authUser` in sync. The app uses Firebase's built-in session persistence.

---

## 2. Assessment (Questionnaire)

**Entry point:** `step === 2` after successful authentication.

- ~35 questions presented one at a time.
- Each question has a 1–6 score picker (`button.aspect-square` per score option).
- A live progress bar shows completion percentage.
- A "Finish" button (`button` containing "Finish" / "סיימתי") becomes enabled when all questions are answered.
- On finish: `calculateResults(answers)` computes `formal` and `dominant` scores (averages), `getPersona(formal, dominant)` maps scores to one of four personas. App advances to `step 3` (report).

**In Live Mode:** Both participants' progress synced via Firebase Realtime Database; both see each other's progress bar in real-time.

---

## 3. Report View (`src/components/ReportView.tsx`)

Entry point: `step === 3`. Default tab on load: **You**.

The report has an **ADHD Lens** toggle chip above the tab strip. When enabled (`adhdLens === true`), all `CollapsibleSection` components with `isAdhd` prop will be forced open.

### 3.1 You Tab (`data-testid="tab-you"` / `tab-content-you`)

Always visible on report load. Contains:
- **Greeting card** — persona icon, user name, persona title.
- **Profile Summary** — `currentPersona.description[language]`.
- **Strengths** (`PersonaList`) — `currentPersona.strengths[language]`.
- **Tips** (`PersonaList`) — `currentPersona.tips[language]`.
- **Superpower** (collapsible, shown when AI has loaded) — `aiInsight.user_profile.superpower` + kryptonite + challenges.
- **Your Communication Challenge** (collapsible, `isAdhd`) — `currentPersona.communication_challenge[language]`. Force-opens when ADHD lens is on.
- **ADHD Angle** (collapsible, `isAdhd`) — `currentPersona.adhd_challenge[language]`. Force-opens when ADHD lens is on.

AI insights load automatically on report entry.

### 3.2 Them Tab (`data-testid="tab-them"` / `tab-content-them`)

Merges AI Analysis + Prepare for Meeting. Contains:

**Persona picker** — 4 buttons, `data-testid="persona-btn-{guardian|driver|integrator|pioneer}"`:
- Guardian 🛡️, Driver 🎯, Integrator 🤝, Pioneer 🚀.
- Clicking a button sets `targetProfile` state and triggers a new `getAIInsights` call with `targetProfile` passed.

**Loading state** — spinner shown while `isLoadingAI === true`.

**AI output** (`data-testid="ai-loaded"`, rendered when `aiInsight && targetProfile`):
- **Friction Point** — `aiInsight.interaction_guide.friction_point`. Red-toned card with `t.report.friction_title`.
- **Strategy Card** — `aiInsight.interaction_guide.strategy_card.action` + `.script`. Dark-header card with `t.report.strategy_title`.
- **ADHD Hack** (collapsible, `isAdhd`) — executive function tool. Force-opens when ADHD lens is on.

**Feedback loop:**
- Thumbs Up / Thumbs Down buttons below the coaching output.
- On thumbs-down: text input appears for refinement comment.
- On submit: `regenerateWithFeedback()` re-calls `getAIInsights` with `refinementComment`, updates `aiInsight`.

**Share button** — copies a summary of the coaching output to clipboard.

**Error state** (`data-testid="ai-error"`) — shown when AI call fails; includes a "Retry Analysis" button.

### 3.3 Together Tab (`data-testid="tab-together"` / `tab-content-together`)

2D grid visualization:
- X-axis: Dominant (low → high).
- Y-axis: Formal (high → low).
- User's position computed from `avgFormal` and `avgDominant` scores.
- All four persona quadrants labeled (Pioneer, Driver, Guardian, Integrator).
- User's dot positioned at `(positionX, positionY)` as a percentage of the grid.

---

## 4. AI Coaching (Cloud Functions)

### 4.1 `generateAIInsights`

**Trigger:** Firebase Callable (`onCall`), v2, us-central1.
**Config:** `secrets: ["GEMINI_API_KEY"]`, `timeoutSeconds: 120`.
**Model:** `gemini-1.5-flash` via REST (`v1beta` endpoint).
**Input:**
```json
{ "persona": Persona, "results": Results, "lang": "en"|"he",
  "refinementComment": string|undefined, "targetProfile": string|undefined }
```
**Output:** `AICommunicationCoach` JSON object (see §4.3).
**Notes:** Uses `responseMimeType: "application/json"`. Filters out `thought` parts from response before parsing to handle any thinking-model variants.

### 4.2 `generateCompatibilityAnalysis`

**Trigger:** Firebase Callable (`onCall`), v2, us-central1.
**Config:** `secrets: ["GEMINI_API_KEY"]`.
**Model:** `gemini-1.5-flash` via REST.
**Input:**
```json
{ "userA": { name, persona, results }, "userB": { name, persona, results }, "lang": "en"|"he" }
```
**Output:**
```json
{ "score": number, "friction_points": string[], "synergies": string[], "verdict": string }
```

### 4.3 `AICommunicationCoach` Schema

```ts
interface AICommunicationCoach {
  user_profile: {
    type: string;                  // persona label, e.g. "Pioneer"
    superpower: string;            // 8–12 word strength statement
    kryptonite: string;            // 8–12 word blind-spot statement
    challenges?: Array<{           // optional, up to 3
      title: string;               // 3–5 word label
      description: string;         // 1–2 sentence explanation
      watch_for: string;           // concrete workplace scenario
    }>;
  };
  interaction_guide: {
    target_profile: string;        // name of the persona being met
    friction_point: string;        // 1-sentence tension description
    strategy_card: {
      title: string;               // 3–5 word strategy name
      action: string;              // 1-sentence imperative action
      script: string;              // exact phrase to use
    };
  };
  executive_function_tool: {
    tool_name: string;             // ADHD-friendly technique name
    instruction: string;           // 1–2 sentence application guide
    template_ready: boolean;       // true if a ready script exists
  };
}
```

---

## 5. Live Session Mode

**Entry point:** "Start Live Session" / "Join Session" on the landing screen.

- **Session creation:** Generates a unique session code; stores session state in Firebase Realtime Database.
- **Session joining:** User enters a session code to join an existing session.
- **Real-time sync:** Both participants' questionnaire progress is synced live via Realtime Database listeners. Each sees the other's progress bar update in real-time.
- **Shared report:** Once both participants finish, `ComparisonView` renders a side-by-side analysis using `generateCompatibilityAnalysis`.

**Components involved:** `SessionLobby.tsx`, `SessionWizard.tsx`, `LiveProgressBar.tsx`, `ComparisonView.tsx`.

---

## 6. Legal Pages

Accessed via footer links and hash routing. All three pages are bilingual (Hebrew/English).

| Route | Component | Content |
|-------|-----------|---------|
| `#terms` | `TermsPage.tsx` | Terms of Use |
| `#privacy` | `PrivacyPage.tsx` | Privacy Policy |
| `#accessibility` | `AccessibilityPage.tsx` | Accessibility Statement (IS 5568 Level AA) |

---

## 7. Bilingual Support

- Language state: `'he'` (Hebrew, RTL) or `'en'` (English, LTR), stored in `App.tsx`.
- `dir="rtl"` applied to `<html>` element when `language === 'he'`.
- All UI strings in `src/constants.tsx` under `TEXT.he` and `TEXT.en`.
- Language toggle button in the header switches instantly with no page reload.
- AI prompts pass `lang` to the Cloud Function; the function instructs Gemini to respond in Hebrew or English accordingly.

---

## 8. Data & Integrations

| System | Usage |
|--------|-------|
| Firebase Auth | User identity (Google OAuth + Email/Password) |
| Firebase Realtime Database | Live session state, progress sync |
| Firebase Hosting | Static frontend hosting with dynamic config injection |
| Firebase Cloud Functions v2 | `generateAIInsights`, `generateCompatibilityAnalysis` |
| Google Gemini 1.5 Flash | AI coaching generation via REST |
| Firebase Analytics | Event tracking (`logEvent`) throughout the app |
| Google Apps Script + Sheets | Report data export via `GOOGLE_SCRIPT_URL` in `constants.tsx` |

---

## 9. Test Coverage

**Runner:** Puppeteer (`test.js`), `protocolTimeout: 300000`.
**Target:** `https://business-chemistry.web.app/` by default; override with `node test.js <url>`.
**Output:** `acceptance_report.html` (bilingual, auto-opened after run).

### Stable `data-testid` selectors

| Selector | Element |
|----------|---------|
| `[data-testid="tab-you"]` | You tab button |
| `[data-testid="tab-them"]` | Them tab button |
| `[data-testid="tab-together"]` | Together tab button |
| `[data-testid="tab-content-you"]` | You tab content div |
| `[data-testid="tab-content-them"]` | Them tab content div |
| `[data-testid="tab-content-together"]` | Together tab content div |
| `[data-testid="ai-loaded"]` | AI coaching content (success state) |
| `[data-testid="ai-error"]` | AI error state |
| `[data-testid="persona-btn-guardian"]` | Guardian persona picker button |
| `[data-testid="persona-btn-driver"]` | Driver persona picker button |
| `[data-testid="persona-btn-integrator"]` | Integrator persona picker button |
| `[data-testid="persona-btn-pioneer"]` | Pioneer persona picker button |

### Suite summary

| # | Suite | Key assertions |
|---|-------|----------------|
| 1 | Auth — Page Structure | email input, password input, submit button, Google button, Sign up link, Forgot Password link |
| 2 | Auth — Sign-In Happy Path | valid credentials → questionnaire reached |
| 3 | Auth — Sign-In Fail Paths | empty email/password blocked; invalid format blocked; wrong credentials rejected; Sign-up modal appears |
| 4 | Auth — Google Sign-In | button visible and labeled; Google logo loads; `signInWithPopup` wired |
| 5 | Auth Modals | Sign-up modal has name + email + password fields; Forgot Password modal has email field + send button |
| 6 | Report — Tab Structure | all 3 tab buttons present (You/Them/Together); each tab renders its content panel |
| 7 | Report — AI Analysis | AI loads within 30s on Them tab; all 4 persona buttons present; AI reloads for each persona within 45s |
| 8 | Full Flow | sign-in → complete questionnaire → report view → AI tab → AI coaching rendered |
