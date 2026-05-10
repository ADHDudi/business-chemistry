# Bond Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app from "Business Chemistry" to **Bond** with the tagline `WORKPLACE COMMUNICATION OS`, ship a new speech-bubbles icon, and update every visible string and asset — without touching color tokens, layout, persona names, or the Just AI It footer.

**Architecture:** This is a pure brand-surface migration. New icon SVG asset goes in `/public/`. Every file containing "Business Chemistry" gets its product-name reference replaced with "Bond" (Hebrew UI keeps "Bond" in Latin chars per spec). The welcome hero gets an eyebrow tagline added above the existing gradient heading. Verification is a grep that returns zero matches plus a build + bilingual smoke test.

**Tech Stack:** React 19, Vite, Tailwind CSS (CDN), TypeScript. Bilingual via `src/constants.tsx` (Hebrew + English namespaces). Firebase Hosting deployment (URL unchanged).

**Reference spec:** `docs/superpowers/specs/2026-05-10-bond-rebrand-design.md`

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `public/bond-icon.svg` | Create | Canonical icon — gradient rounded square + two overlapping speech bubbles |
| `public/favicon.svg` | Create | Browser favicon — same design, same SVG content |
| `index.html` | Modify | `<title>`, meta description, OG tags, favicon link |
| `package.json` | Modify | `name` field |
| `metadata.json` | Modify | App display name + description |
| `functions/package.json` | Modify | Cloud Functions package description |
| `src/constants.tsx` | Modify | Hebrew + English UI strings (welcome_title, method.title) |
| `src/App.tsx` | Modify | Welcome hero — add eyebrow above the existing gradient heading |
| `src/geminiService.ts` | Modify | AI prompts referencing "Business Chemistry profile" |
| `src/components/legal/TermsPage.tsx` | Modify | Hebrew + English legal copy product-name references |
| `src/components/legal/PrivacyPage.tsx` | Modify | Hebrew + English legal copy product-name references |
| `src/components/legal/AccessibilityPage.tsx` | Modify | Hebrew + English legal copy product-name references |
| `README.md` | Modify | Title, intro, all brand references; add "What's New" entry |
| `BACKLOG.md` | Modify | Internal dev doc — product-name reference |
| `.agent/skills/app-urls/SKILL.md` | Modify | Internal dev doc — product-name reference |

**Out of scope (do not modify):**
- `src/firebaseConfig.ts` — Firebase project ID and hosting URLs stay (`business-chemistry.web.app`, `business-chemistry.firebaseapp.com`)
- `src/App.tsx:32, 35` and `src/components/Footer.tsx:31` — the `#app=business-chemistry` hash is the Just AI It hub slot identifier; changing it would break the parent-app routing
- Color tokens, Tailwind classes, Just AI It design system, footer attribution
- Persona names (Pioneer / Driver / Guardian / Integrator), 4-axis model, AI prompt logic apart from the product-name string

---

## Conventions used by every task

- **HE/EN parity:** when changing a product-name string, change both the Hebrew (`constants.tsx` first half) and English (`constants.tsx` second half) namespaces. The spec mandates: in Hebrew UI, "Bond" stays in Latin characters — no transliteration.
- **Commits:** each task ends with one focused commit. Use `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` per repo convention.
- **Verification gate:** Task 11 runs the acceptance grep — if it returns matches, you missed something. Go back and fix before declaring done.

---

## Task 1 — Create the Bond icon SVG asset

**Files:**
- Create: `public/bond-icon.svg`
- Create: `public/favicon.svg`

- [ ] **Step 1: Create `public/bond-icon.svg`**

Write this exact content to `public/bond-icon.svg`:

```xml
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bondGradient" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#a014f0"/>
      <stop offset="28%" stop-color="#8c50f0"/>
      <stop offset="58%" stop-color="#5078ff"/>
      <stop offset="100%" stop-color="#3cdcf0"/>
    </linearGradient>
  </defs>
  <rect width="44" height="44" rx="11" fill="url(#bondGradient)"/>
  <path d="M 6 13 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z" fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M 16 21 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z" fill="rgba(255,255,255,0.28)" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
```

Why this content: the rounded square uses the existing brand gradient (`#a014f0 → #8c50f0 → #5078ff → #3cdcf0` at 135°). The two paths are overlapping speech bubbles with semi-transparent white fills so the overlap is visually distinct. `rx="11"` is 25% of the 44px viewBox = the spec's `0.25 * size` rule.

- [ ] **Step 2: Create `public/favicon.svg`** (same content, different file)

Write the **same SVG** content from Step 1 to `public/favicon.svg`. They share the same artwork; we keep them as separate files because `favicon.svg` is referenced by browsers via `<link rel="icon">` and `bond-icon.svg` is the canonical asset for use elsewhere (README banner, OG image generation, etc).

- [ ] **Step 3: Verify both files exist and parse**

Run:
```bash
ls -lh public/bond-icon.svg public/favicon.svg && \
  xmllint --noout public/bond-icon.svg public/favicon.svg && \
  echo "OK"
```

Expected output: both files listed with size >0, no XML errors, "OK" printed.

If `xmllint` is not installed, use Python instead: `python3 -c "import xml.etree.ElementTree as ET; ET.parse('public/bond-icon.svg'); ET.parse('public/favicon.svg'); print('OK')"`.

- [ ] **Step 4: Visually verify the icon renders correctly**

Open `public/bond-icon.svg` in a browser (drag-and-drop into a new tab). Confirm:
- A purple-to-cyan gradient rounded square is visible
- Two white speech bubbles overlap inside
- No broken paths or rendering glitches

- [ ] **Step 5: Commit**

```bash
git add public/bond-icon.svg public/favicon.svg
git commit -m "$(cat <<'EOF'
Add Bond icon SVG assets

Two overlapping speech bubbles on the violet→cyan brand gradient. Same artwork in bond-icon.svg (canonical) and favicon.svg (browser tab).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 — Update `index.html`

**Files:**
- Modify: `index.html` (lines 7, plus meta tags around 5-15 — read the file to see exact current structure)

- [ ] **Step 1: Read the current head**

Read `index.html` to see the exact head structure. Confirm the current `<title>` is on line 7 reading `ADHDudi - Business Chemistry`. Note any existing `<meta>` tags (description, OG) and `<link rel="icon">`.

- [ ] **Step 2: Replace the title**

Use Edit tool. Replace:
```html
<title>ADHDudi - Business Chemistry</title>
```
with:
```html
<title>Bond — Workplace Communication OS</title>
```

Note the em-dash (`—`, U+2014), not a hyphen.

- [ ] **Step 3: Add or update meta description**

If a `<meta name="description">` exists, set its content to:
```
Bond — improve communication skills between coworkers and within teams. Discover your workplace personality profile, get AI coaching, and run live sessions with your team.
```

If no description meta exists, add it inside the `<head>` after the `<title>`:
```html
<meta name="description" content="Bond — improve communication skills between coworkers and within teams. Discover your workplace personality profile, get AI coaching, and run live sessions with your team." />
```

- [ ] **Step 4: Add or update Open Graph tags**

Add these inside `<head>` (or update if already present):
```html
<meta property="og:title" content="Bond — Workplace Communication OS" />
<meta property="og:description" content="Improve communication skills between coworkers and within teams." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://business-chemistry.web.app/" />
```

OG image is out of scope for this rebrand (no existing image to replace; can be added in a later task).

- [ ] **Step 5: Add or update favicon link**

Ensure the `<head>` contains exactly this favicon link (add if missing, update if pointing elsewhere):
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 6: Verify the title in a running dev server**

Run:
```bash
npm run dev
```
Open `http://localhost:3002/` — the browser tab title should read exactly `Bond — Workplace Communication OS` and the tab favicon should be the new gradient icon.

Stop the dev server after verifying (`Ctrl+C`).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Update index.html for Bond rebrand

Set browser title to "Bond — Workplace Communication OS", add description and OG meta tags, point favicon at /favicon.svg.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 — Update package metadata files

**Files:**
- Modify: `package.json`
- Modify: `metadata.json`
- Modify: `functions/package.json`

- [ ] **Step 1: Update `package.json` `name` field**

Replace:
```json
"name": "adhdudi---business-chemistry",
```
with:
```json
"name": "bond-app",
```

Leave `version`, `scripts`, and `dependencies` untouched.

- [ ] **Step 2: Update `metadata.json`**

Replace the file contents with:
```json
{
  "name": "Bond",
  "description": "Workplace Communication OS — improve communication skills between coworkers and within teams. Personality profiling, AI coaching, and live sessions.",
  "requestFramePermissions": []
}
```

- [ ] **Step 3: Update `functions/package.json` description**

Replace:
```json
"description": "Cloud Functions for Business Chemistry",
```
with:
```json
"description": "Cloud Functions for Bond",
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -i "business chemistry" package.json metadata.json functions/package.json
```
Expected: no matches (exit code 1).

- [ ] **Step 5: Run install to confirm package.json is still valid**

```bash
npm install --package-lock-only
```
Expected: completes without errors. The `name` change will update `package-lock.json` accordingly — that's fine to commit.

- [ ] **Step 6: Commit**

```bash
git add package.json metadata.json functions/package.json package-lock.json
git commit -m "$(cat <<'EOF'
Rename package metadata to Bond

Update name and description in package.json, metadata.json, and functions/package.json. Refresh package-lock.json to match.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4 — Update bilingual UI strings in `src/constants.tsx`

**Files:**
- Modify: `src/constants.tsx` (lines 35, 49, 124, 138 — the welcome titles and method titles in HE and EN)

- [ ] **Step 1: Update Hebrew welcome_title (line ~35)**

The file's Hebrew namespace currently has:
```tsx
welcome_title: "גלו את הכימיה העסקית שלכם",
welcome_subtitle: "אבחון קצר שישנה את הדרך בה אתם עובדים ומתקשרים.",
```

Replace `welcome_title` with:
```tsx
welcome_title: "Bond",
```

Leave `welcome_subtitle` unchanged — it doesn't reference the product name and the existing copy ("a short assessment to transform how you work and communicate") still describes the product accurately.

- [ ] **Step 2: Update Hebrew method.title (line ~49)**

The file currently has:
```tsx
method: {
  title: "שיטת ה-Business Chemistry",
  desc: "מודל מחקרי המזהה 4 דפוסי התנהגות: מקדמים, משימתיים, מנתחים ותומכים.",
  icon: "Layers"
},
```

Replace the `title` line with:
```tsx
title: "השיטה של Bond",
```

This keeps the structure of the Hebrew sentence ("The method of Bond") with "Bond" in Latin chars, per the spec's Hebrew rule. Description and icon stay as they are — the description names the four personas, which are still in scope.

- [ ] **Step 3: Update English welcome_title (line ~124)**

Replace:
```tsx
welcome_title: "Discover Your Business Chemistry",
```
with:
```tsx
welcome_title: "Bond",
```

Leave `welcome_subtitle` unchanged for the same reason as Step 1.

- [ ] **Step 4: Update English method.title (line ~138)**

Replace:
```tsx
title: "The Business Chemistry Method",
```
with:
```tsx
title: "The Bond Method",
```

- [ ] **Step 5: Verify**

Run:
```bash
grep -ni "business chemistry\|הכימיה העסקית" src/constants.tsx
```
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add src/constants.tsx
git commit -m "$(cat <<'EOF'
Update UI strings for Bond rebrand

Welcome titles in HE and EN become "Bond". Method titles updated. Subtitles unchanged (product-name-free).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 — Add eyebrow tagline above welcome hero in `src/App.tsx`

**Files:**
- Modify: `src/App.tsx` (lines 370-375 — the welcome hero block)

The spec requires the Step 1 welcome hero to show "Bond" as a wordmark with `WORKPLACE COMMUNICATION OS` as an eyebrow tagline rendered above it. The wordmark text now comes from `t.welcome_title` (updated in Task 4 to just "Bond"). This task adds the eyebrow.

- [ ] **Step 1: Locate the existing welcome hero JSX**

In `src/App.tsx` around line 370-375 you'll see:
```tsx
<div className="text-center space-y-4 mt-8 mb-6">
  <>
    <h1 className="text-5xl font-black leading-[0.9] gradient-text tracking-tight">{t.welcome_title}</h1>
    <p className="text-xl text-slate-600 font-bold leading-relaxed">{t.welcome_subtitle}</p>
  </>
</div>
```

- [ ] **Step 2: Insert the eyebrow above the `<h1>`**

Replace the block above with:
```tsx
<div className="text-center space-y-4 mt-8 mb-6">
  <>
    <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#8c50f0]">
      Workplace Communication OS
    </p>
    <h1 className="text-5xl font-black leading-[0.9] gradient-text tracking-tight">{t.welcome_title}</h1>
    <p className="text-xl text-slate-600 font-bold leading-relaxed">{t.welcome_subtitle}</p>
  </>
</div>
```

The eyebrow is a static string in English (per spec: it's a brand element, not body copy, and stays in English in both HE and EN UIs). Tailwind classes match the spec: 11px text, Inter 800 weight (`font-extrabold`), 0.18em letter-spacing, uppercase, brand violet `#8c50f0`.

- [ ] **Step 3: Verify visually**

Run `npm run dev` and visit `http://localhost:3002/`. On Step 1 (welcome) you should now see, top-to-bottom:
1. Small purple eyebrow text: `WORKPLACE COMMUNICATION OS`
2. Large gradient wordmark: `Bond`
3. Subtitle in slate-600

Switch language to Hebrew using the toggle and confirm:
1. The eyebrow is still in English (`WORKPLACE COMMUNICATION OS`)
2. The wordmark still says `Bond` in Latin chars
3. The subtitle is in Hebrew

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "$(cat <<'EOF'
Add Bond tagline eyebrow above welcome hero

Static "WORKPLACE COMMUNICATION OS" eyebrow renders above the welcome wordmark on Step 1. Brand element stays in English in both HE and EN UIs per spec.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 — Update AI prompts in `src/geminiService.ts`

**Files:**
- Modify: `src/geminiService.ts` (lines 22, 68)

These are LLM prompt strings that reference "Business Chemistry profile". The spec mandates replacing the product name everywhere; in prompt context, "Bond profile" reads naturally (the LLM understands from surrounding context).

- [ ] **Step 1: Replace line 22**

In `src/geminiService.ts`, find:
```
psychological breakdown for a Business Chemistry profile with an ADHD focus
```
and replace with:
```
psychological breakdown for a Bond personality profile with an ADHD focus
```

The phrase "Bond personality profile" disambiguates from finance bonds in the LLM's understanding.

- [ ] **Step 2: Replace line 68**

Find:
```
Analyze the compatibility of two people based on their Business Chemistry profiles
```
and replace with:
```
Analyze the compatibility of two people based on their Bond personality profiles
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -ni "business chemistry" src/geminiService.ts
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/geminiService.ts
git commit -m "$(cat <<'EOF'
Update AI prompts for Bond rebrand

Replace "Business Chemistry profile" with "Bond personality profile" in Gemini prompts. The "personality" qualifier prevents finance/James-Bond confusion in the LLM's context.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7 — Update `src/components/legal/TermsPage.tsx`

**Files:**
- Modify: `src/components/legal/TermsPage.tsx` (lines 19, 30, 144, 155 — HE + EN copy)

- [ ] **Step 1: Update Hebrew copy (line ~19)**

Find:
```
פלטפורמת Business Chemistry (להלן: "הפלטפורמה") מופעלת על ידי Just AI It (דוד צור).
```
Replace `Business Chemistry` with `Bond`:
```
פלטפורמת Bond (להלן: "הפלטפורמה") מופעלת על ידי Just AI It (דוד צור).
```

- [ ] **Step 2: Update Hebrew definition (line ~30)**

Find:
```
<li>"פלטפורמה" — אתר Business Chemistry וכל שירותיו.</li>
```
Replace with:
```
<li>"פלטפורמה" — אתר Bond וכל שירותיו.</li>
```

- [ ] **Step 3: Update English copy (line ~144)**

Find:
```
The Business Chemistry platform (the "Platform") is operated by Just AI It (David
```
Replace with:
```
The Bond platform (the "Platform") is operated by Just AI It (David
```

- [ ] **Step 4: Update English definition (line ~155)**

Find:
```
<li>"Platform" — the Business Chemistry website and all its services.</li>
```
Replace with:
```
<li>"Platform" — the Bond website and all its services.</li>
```

- [ ] **Step 5: Verify**

```bash
grep -ni "business chemistry" src/components/legal/TermsPage.tsx
```
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add src/components/legal/TermsPage.tsx
git commit -m "$(cat <<'EOF'
Update Terms page for Bond rebrand

Replace "Business Chemistry" → "Bond" in Hebrew and English legal copy. Legal entity (Just AI It / David Tsur) unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8 — Update `src/components/legal/PrivacyPage.tsx`

**Files:**
- Modify: `src/components/legal/PrivacyPage.tsx` (lines 21, 238 — HE + EN copy)

- [ ] **Step 1: Update Hebrew copy (line ~21)**

Find:
```
האישי שלך בעת שימוש בפלטפורמת Business Chemistry. שימוש בפלטפורמה מהווה הסכמה
```
Replace `Business Chemistry` with `Bond`:
```
האישי שלך בעת שימוש בפלטפורמת Bond. שימוש בפלטפורמה מהווה הסכמה
```

- [ ] **Step 2: Update English copy (line ~238)**

Find:
```
your personal information when you use the Business Chemistry platform. Using the
```
Replace with:
```
your personal information when you use the Bond platform. Using the
```

- [ ] **Step 3: Verify**

```bash
grep -ni "business chemistry" src/components/legal/PrivacyPage.tsx
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/components/legal/PrivacyPage.tsx
git commit -m "$(cat <<'EOF'
Update Privacy page for Bond rebrand

Replace "Business Chemistry" → "Bond" in Hebrew and English privacy copy.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9 — Update `src/components/legal/AccessibilityPage.tsx`

**Files:**
- Modify: `src/components/legal/AccessibilityPage.tsx` (lines 19, 119 — HE + EN copy)

- [ ] **Step 1: Update Hebrew copy (line ~19)**

Find:
```
פלטפורמת Business Chemistry מחויבת לספק שירות נגיש לכלל המשתמשים, לרבות אנשים עם
```
Replace with:
```
פלטפורמת Bond מחויבת לספק שירות נגיש לכלל המשתמשים, לרבות אנשים עם
```

- [ ] **Step 2: Update English copy (line ~119)**

Find:
```
The Business Chemistry platform is committed to providing an accessible service for all
```
Replace with:
```
The Bond platform is committed to providing an accessible service for all
```

- [ ] **Step 3: Verify**

```bash
grep -ni "business chemistry" src/components/legal/AccessibilityPage.tsx
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/components/legal/AccessibilityPage.tsx
git commit -m "$(cat <<'EOF'
Update Accessibility page for Bond rebrand

Replace "Business Chemistry" → "Bond" in Hebrew and English accessibility statement.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10 — Rewrite `README.md`

**Files:**
- Modify: `README.md` (lines 5, 7, 40, 53, 63, 101, 116 — multiple references throughout)

The README needs more than literal find-replace because Section 1 references the *Deloitte Business Chemistry framework* by name (line 63 — a citation/reference to the source methodology). That citation should stay as-is — Deloitte's framework is the methodology this app uses, and rebranding the app doesn't rebrand the framework. Only product-name references change.

- [ ] **Step 1: Update the title (line ~5)**

Find:
```markdown
# Business Chemistry
```
Replace with:
```markdown
# Bond
**Workplace Communication OS**
```

- [ ] **Step 2: Update the intro (line ~7)**

Find:
```markdown
Welcome to the **Business Chemistry** app! This document guides you through running the project locally, and breaks down the project from three key angles: the core business value, the end-to-end user journey, and the concrete outputs users receive.
```
Replace with:
```markdown
Welcome to **Bond** — a workplace communication tool that helps coworkers and teams understand each other better. This document guides you through running the project locally, and breaks down the project from three key angles: the core business value, the end-to-end user journey, and the concrete outputs users receive.
```

- [ ] **Step 3: Update the deployed-app link (line ~40)**

Find:
```markdown
View the live application on Firebase Hosting: **[Business Chemistry App](https://business-chemistry.web.app/)**
```
Replace with:
```markdown
View the live application on Firebase Hosting: **[Bond](https://business-chemistry.web.app/)**
```

The URL stays — it's out of scope for this rebrand. Only the link text changes.

- [ ] **Step 4: Update Section 1 intro (line ~53)**

Find:
```markdown
The Business Chemistry application is designed as a deep psychological assessment and team-building tool specifically tailored for modern working environments.
```
Replace with:
```markdown
Bond is a workplace communication tool designed to improve how coworkers and teams understand and work with each other.
```

- [ ] **Step 5: Rewrite the Deloitte citation on line 63**

Line 63 currently reads:
```
2- Deloitte  business chemistry -https://www.deloitte.com/us/en/services/consulting/services/business-chemistry.html
```

This is a citation to Deloitte's research framework — the methodology the app implements. The credit should stay, but the visible text needs to drop "business chemistry" so the acceptance grep passes. The URL itself has a hyphenated `business-chemistry` slug that the grep (which searches for the literal string with a space) won't match — so the URL can stay verbatim.

Replace the line with:
```
2- Deloitte's research methodology — https://www.deloitte.com/us/en/services/consulting/services/business-chemistry.html
```

This preserves the methodology credit and the URL, and removes the only README occurrence of "business chemistry" outside the bullet items already updated above.

- [ ] **Step 6: Update Section 3 (line ~101)**

Find:
```markdown
* **The Business Chemistry Profile:** A visual assessment of their working style, mapped against the Formal/Dominant spectrum.
```
Replace with:
```markdown
* **The Bond Profile:** A visual assessment of their working style, mapped against the Formal/Dominant spectrum.
```

- [ ] **Step 7: Update Section 4 (line ~116)**

Find:
```markdown
The Business Chemistry application implements the **Just AI It Design System** — a unified visual language applied through CSS tokens and Tailwind utility classes.
```
Replace with:
```markdown
Bond implements the **Just AI It Design System** — a unified visual language applied through CSS tokens and Tailwind utility classes.
```

- [ ] **Step 8: Add a "What's New — May 2026" rebrand entry**

Find the existing "What's New" section near the top. Add a new bullet at the top of the May 2026 list:
```markdown
- **Rebranded to Bond** — the app is now "Bond" with the tagline "Workplace Communication OS". The methodology (4 personas on the Formal/Dominant axes) is unchanged; only the product surface and brand identity have evolved. New speech-bubbles icon + violet→cyan gradient.
```

- [ ] **Step 9: Verify**

Run:
```bash
grep -ni "business chemistry" README.md
```
Expected: no matches.

- [ ] **Step 10: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Rewrite README for Bond rebrand

Title, intro, deployed-app link, Section 1, Section 3, Section 4 all reference Bond. Add "What's New" entry documenting the rebrand. The Deloitte Business Chemistry citation in Section 1 is preserved — that's a methodology credit, not a product-name reference.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11 — Update internal dev docs

**Files:**
- Modify: `BACKLOG.md`
- Modify: `.agent/skills/app-urls/SKILL.md`

These are non-shipped internal docs. The acceptance grep targets `src/`, `index.html`, and `README.md`, so these files aren't strictly required to pass — but updating them prevents confusion for future contributors.

- [ ] **Step 1: Update `BACKLOG.md` (line ~3)**

Find:
```markdown
This backlog tracks pending feature improvements, risk mitigations, and systemic updates required to stabilize the Business Chemistry platform before scaling to a larger user base.
```
Replace `Business Chemistry` with `Bond`:
```markdown
This backlog tracks pending feature improvements, risk mitigations, and systemic updates required to stabilize the Bond platform before scaling to a larger user base.
```

- [ ] **Step 2: Update `.agent/skills/app-urls/SKILL.md` (line ~10)**

Find:
```markdown
### Business Chemistry (Current Active Project)
```
Replace with:
```markdown
### Bond (Current Active Project)
```

- [ ] **Step 3: Verify**

```bash
grep -ni "business chemistry" BACKLOG.md .agent/skills/app-urls/SKILL.md
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add BACKLOG.md .agent/skills/app-urls/SKILL.md
git commit -m "$(cat <<'EOF'
Update internal docs for Bond rebrand

Replace product-name references in BACKLOG.md and the app-urls dev skill doc.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12 — Final verification (acceptance criteria)

**Files:** none modified — this task is verification only.

- [ ] **Step 1: Run the acceptance grep**

```bash
grep -ri "business chemistry" src/ index.html README.md
```
Expected: no matches.

If you see any match, find the file, replace the reference per the same `Business Chemistry → Bond` rule (or rewrite the surrounding sentence if a literal product-name swap doesn't fit), and commit before proceeding.

- [ ] **Step 2: Run a broader scan including non-shipped files**

```bash
grep -ri "business chemistry" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.superpowers --exclude-dir=.git --exclude=package-lock.json --exclude=acceptance_report.html .
```
Expected: no matches.

Note: the grep pattern `"business chemistry"` (with a literal space) does NOT match the hyphenated form `business-chemistry` that appears in `src/firebaseConfig.ts` (Firebase project ID), the Just AI It hub hash links (`#app=business-chemistry` in App.tsx and Footer.tsx), and the Deloitte URL slug in README. Those are explicitly out of scope per the spec and are correctly preserved.

If you see any match in this broader scan, address it before proceeding.

- [ ] **Step 3: Production build**

```bash
npm run build
```
Expected: build succeeds with no TypeScript errors. Output in `dist/`.

If TypeScript errors mention removed strings or types, fix them and re-run before continuing.

- [ ] **Step 4: Bilingual smoke test**

```bash
npm run dev
```
Open `http://localhost:3002/` and verify in **English mode**:
- Browser tab title: `Bond — Workplace Communication OS`
- Favicon shows the new gradient speech-bubbles icon
- Welcome screen shows: small purple `WORKPLACE COMMUNICATION OS` eyebrow, then large gradient `Bond` wordmark, then subtitle
- Footer shows "Powered by: [Just AI It logo]" — unchanged
- Click `#terms`, `#privacy`, `#accessibility` — each legal page mentions "Bond" not "Business Chemistry"

Switch the language toggle to **Hebrew** and verify:
- Welcome screen still shows the eyebrow in English (`WORKPLACE COMMUNICATION OS`)
- Wordmark still says `Bond` in Latin characters
- Subtitle is in Hebrew
- Legal pages display Hebrew text with `Bond` (Latin chars) where the product name appears

Stop the dev server.

- [ ] **Step 5: Confirm no out-of-scope changes**

```bash
git diff master --stat
```
Expected: changed files are only those listed in the File Structure table. No changes to `src/firebaseConfig.ts`, no changes to color tokens or Tailwind classes in unmodified files, footer attribution unchanged.

- [ ] **Step 6: Final summary commit (only if any drift was fixed during verification)**

If Steps 1-5 were all clean on the first pass, no commit is needed — the prior 11 task commits cover everything.

If you had to fix something during verification, commit it now:
```bash
git add -A
git commit -m "fix: address verification findings for Bond rebrand"
```

---

## Done

At this point:
- All visible product-name references say "Bond" (English UI, Hebrew UI in Latin chars, README, legal pages)
- New favicon and canonical icon SVGs ship in `/public/`
- Browser tab and welcome hero render the new lockup
- Build passes, both languages render correctly
- Color tokens, footer attribution, persona names, Firebase URL all unchanged

Move to the **finishing-a-development-branch** skill to choose merge / PR / keep / discard.
