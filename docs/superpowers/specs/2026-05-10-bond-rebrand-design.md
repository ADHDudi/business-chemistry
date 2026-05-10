# Bond — Brand Rebrand Design

**Date:** 2026-05-10
**Status:** Approved for implementation planning
**Scope:** Visual + textual brand rename. No functional, layout, or component-structure changes.

---

## Context

The app currently ships as **Business Chemistry**, a name borrowed from Deloitte's personality framework. The core value of the product has clarified over time: it improves communication skills between coworkers and within teams. The current name has two problems — it can never be uniquely owned (Deloitte's framework predates the app), and it positions the product as an assessment rather than a communication tool.

After brainstorming through three strategic axes — audience, metaphor, and sub-flavor — the new brand is **Bond**, with the eyebrow tagline **WORKPLACE COMMUNICATION OS**. The chosen icon is two overlapping speech bubbles in the existing violet→cyan brand gradient.

Design decisions (confirmed by user during brainstorming):

- **Audience:** any modern workplace worker — managers and employees, not founder-only
- **Metaphor:** Connection
- **Sub-flavor:** Bond / Bridge
- **Hebrew treatment:** "Bond" stays in Latin characters in Hebrew UI (untransliterated)
- **Domain:** keep `business-chemistry.web.app` for now — out of scope for this rebrand
- **Transition messaging:** ship silently, no rebrand banner

---

## Brand Identity

### Product name

**Bond** — primary product name in all languages and contexts. Pronounced /bɒnd/. Single syllable, dual register: a *chemical bond* (preserves the chemistry heritage that lives on inside the app's content) and a *human bond* (the active outcome of good communication).

### Tagline (eyebrow)

**WORKPLACE COMMUNICATION OS** — used as a small-caps eyebrow above or below the wordmark in the lockup. Stays in English in both Hebrew and English UI; it is a brand element, not body copy.

### Symbol

Two overlapping speech bubbles, white on the violet→cyan brand gradient, contained in a rounded square. The overlap is the point — two voices meeting is the visual definition of communication.

---

## Visual System

### Icon SVG

Canonical 44×44 viewBox. The two speech-bubble paths are layered with semi-transparent fills so the overlap reads visually:

```svg
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Speech bubble 1 (top-left) -->
  <path d="M 6 13 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z"
        fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
  <!-- Speech bubble 2 (bottom-right, overlapping) -->
  <path d="M 16 21 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z"
        fill="rgba(255,255,255,0.28)" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
```

For favicon and other small sizes (≤32px), the bubble strokes can be slightly thicker (2.5–3.0) and fills slightly more opaque to retain legibility. The full-size SVG above is the canonical asset; size-specific variants are derivable.

### Icon container

| Property | Value |
|---|---|
| Shape | Rounded square |
| Border radius | 20px at 80px size; scale proportionally (`radius = size * 0.25`) |
| Background | `linear-gradient(135deg, #a014f0 0%, #8c50f0 28%, #5078ff 58%, #3cdcf0 100%)` |
| Drop shadow | `0 8px 20px rgba(140,80,240,0.30)` (only on hero/lockup uses; no shadow on favicon) |

### Icon size matrix

| Use | Container size | Icon SVG size |
|---|---|---|
| Browser favicon | 32×32 | 24×24 (within container) |
| App header lockup | 40×40 | 28×28 |
| Welcome hero | 80×80 | 44×44 |
| PWA / OS icon | 192×192, 512×512 | proportional |
| Open Graph image | 1200×630 (icon at 200×200, with wordmark beside) | 200×200 |

### Wordmark

| Property | Value |
|---|---|
| Font | Inter Black (weight 900) |
| Color | `#0f172a` (slate-900) |
| Letter-spacing | `-0.025em` (e.g. -1px at 42px) |
| Line-height | 1 |

### Lockup variants

1. **Full lockup** — icon + wordmark + eyebrow tagline. Used on welcome hero, README banner, OG image.
2. **Compact lockup** — icon + wordmark, no eyebrow. Used in app header (when re-introduced) and email signatures.
3. **Wordmark only** — "Bond" alone. Used inline in body copy and footer references.
4. **Icon only** — speech bubbles in container. Used as favicon, PWA icon, mobile chrome.

### Typography hierarchy in the lockup

In the welcome hero or marketing surface, vertical stacking is:
- Eyebrow tagline (small caps, 11–13px depending on canvas size)
- Wordmark "Bond" (large, e.g. 42–96px)

In the header (compact), order is horizontal: icon → wordmark, with the eyebrow omitted.

---

## Application Surface — Files to Update

### HTML and asset files

| File | Change |
|---|---|
| `index.html` | `<title>` becomes "Bond — Workplace Communication OS"; meta description, OG title, OG description rewritten; favicon link points to new asset |
| `/public/favicon.svg` | Replace with the new Bond icon (gradient container + speech bubbles) |
| `/public/bond-icon.svg` | New canonical SVG asset, full lockup-ready |
| `/public/bond-icon-512.png` | New PNG export for PWA / social, 512×512 |
| `/public/og-image.png` | New OG image with full lockup if one exists; create if absent |

### Code files

| File | Change |
|---|---|
| `package.json` | `name` field updated from `adhdudi---business-chemistry` to `bond-app` |
| `src/App.tsx` | Welcome hero on Step 1 shows the wordmark "Bond" (in the existing `gradient-text` style) with the eyebrow `WORKPLACE COMMUNICATION OS` rendered above it. Any inline product-name references in headings, subtitles, or aria-labels updated. If a header logo lockup is re-introduced later, it uses the Bond icon + wordmark — but adding a header logo is not part of this rebrand. |
| `src/constants.ts` | Any text constants containing "Business Chemistry" updated to "Bond" |
| `src/components/*.tsx` | Inline strings referring to the product name updated (audit via grep — see Acceptance Criteria) |

### Legal pages

| File | Change |
|---|---|
| `src/components/legal/TermsPage.tsx` | Replace product-name references in copy with "Bond" |
| `src/components/legal/PrivacyPage.tsx` | Replace product-name references with "Bond" |
| `src/components/legal/AccessibilityPage.tsx` | Replace product-name references with "Bond" |

Note: any *legal entity* names in the legal copy (the operating company, registered address, contact details) remain unchanged — only the product name is being rebranded.

### Documentation

| File | Change |
|---|---|
| `README.md` | Rewrite all sections that name the product. Title becomes "Bond". Tagline added. "What's New" entry for May 2026 documents the rebrand. Any historical mention of "Business Chemistry" framed as the previous product name. |

---

## Hebrew Treatment

The product name "Bond" appears in Latin characters in both English and Hebrew UI. This follows the convention used by Slack, Notion, Linear, Figma, and similar global tech brands when shipping in Hebrew — the brand stays consistent across languages and there is no separate Hebrew wordmark asset to maintain.

The eyebrow tagline "WORKPLACE COMMUNICATION OS" stays in English in both UIs because it functions as a brand element, not as body copy. All functional text, body copy, form labels, button text, and instructional content in the Hebrew UI continues to render in Hebrew.

---

## Out of Scope

Explicitly **not** changing in this rebrand:

- Color tokens — the violet→cyan brand gradient stays
- Tailwind utility classes and the Just AI It design system
- Component structure, layout, or page flow
- The footer "Powered by Just AI It" attribution
- Persona names (Pioneer / Driver / Guardian / Integrator)
- The Formal/Dominant 2-axis assessment model
- AI prompts, Strategy Card content, and all Hebrew/English body copy *that does not contain the product name*. Translations stay as-is unless they reference the product name, in which case "Business Chemistry" becomes "Bond" in the same string.
- Hash routes (`#terms`, `#privacy`, `#accessibility`)
- Authentication flow, session codes, live mode logic
- Firebase project ID, hosting URL (`business-chemistry.web.app` stays in place)
- Database schema or any persisted user data
- Domain migration or custom-domain purchase
- Any rebrand notice or transition banner for existing users — ship silently

---

## Acceptance Criteria

- All visible English UI strings say "Bond" (or no product name); no occurrence of "Business Chemistry" remains in `src/`, `index.html`, or `README.md` after the change
- `grep -ri "business chemistry" src/ index.html README.md` returns zero matches at completion (case-insensitive)
- All visible Hebrew UI strings render "Bond" in Latin characters where the product name appears
- Browser tab title is exactly `Bond — Workplace Communication OS`
- The favicon shows the new speech-bubbles icon at 16×16 and 32×32
- The welcome hero on Step 1 shows the Bond wordmark with the icon and eyebrow
- The README opens with the Bond brand and documents the rebrand
- Legal pages reference "Bond" as the product name; legal-entity names are unchanged
- Color tokens, Tailwind classes, layout, and the Just AI It design system are unchanged
- Footer "Powered by Just AI It" attribution is unchanged
- The site continues to deploy successfully to `business-chemistry.web.app`
- Both EN and HE UIs render correctly with no broken strings or missing translations
