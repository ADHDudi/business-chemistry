# 📋 Project Backlog

> Priorities: **P0** = Critical · **P1** = High · **P2** = Medium · **P3** = Low  
> Items sorted by priority within each section.

---

## 🚧 In Progress
> *Active tasks. Limit to 1–2 items.*

| Priority | Task | Added |
|----------|------|-------|
| — | — | — |

---

## 📥 Inbox / To Do
> *Sorted by priority.*

### P0 (Critical)

| Priority | Task | Added |
|----------|------|-------|
| P0 | Sanitize user input in AI prompts (refinement comments, profile data) to prevent prompt injection | 2026-05-10 |
| P0 | Implement Firebase Email/Password Auth validation instead of local bypass | 2026-05-10 |
| P0 | Create Privacy Policy & implement data scrubbing for PII, "Delete My Data" feature | 2026-05-10 |
| P0 | Add liability disclaimers: clarify tool is for communication framing, not clinical assessment | 2026-05-10 |
| P0 | Implement gitleaks pre-commit hook to prevent API key leaks | 2026-05-10 |

### P1 (High)

| Priority | Task | Added |
|----------|------|-------|
| P1 | Implement graceful error handling for AI generation failures (timeouts, quota, rate limits) with retry button | 2026-05-10 |
| P1 | Refactor ReportView.tsx AI state management from lastFetchRef band-aids to controlled state machine or custom hook | 2026-05-10 |
| P1 | Surface specific AI error types in UI (distinguish timeouts, rate limits, quota exhaustion, API failures) | 2026-05-10 |
| P1 | Add timeout handling & "save & continue" for Session Wizard if partner doesn't join within X minutes | 2026-05-10 |

### P2 (Medium)

| Priority | Task | Added |
|----------|------|-------|
| P2 | Fix AI insights Hebrew translation: verify lang param passed to Gemini, test end-to-end | 2026-05-10 |
| P2 | Design & implement robust loading state for Report View (animated skeletons, engaging copy) | 2026-05-10 |
| P2 | Add "Start All Over Again" button to all result tabs, not just Results & Analysis | 2026-05-10 |
| P2 | Refactor AI prompts: Strategy Cards should suggest conversational tips, not exact scripts | 2026-05-10 |
| P2 | Audit AI prompts for unverified clinical terminology; frame ADHD hacks as exec function tips only | 2026-05-10 |
| P2 | Move AI prompt templates to Firebase Remote Config for live tuning without redeployment | 2026-05-10 |
| P2 | Implement mock AI service layer for local dev (VITE_USE_MOCK_AI=true) | 2026-05-10 |
| P2 | Redesign telemetry/result syncing to use local storage buffering instead of useEffect-based approach | 2026-05-10 |
| P2 | Consolidate translation strings into single JSON-based i18n framework | 2026-05-10 |

### P3 (Low)

| Priority | Task | Added |
|----------|------|-------|
| P3 | Refactor deploy.sh for atomic builds and rollback support | 2026-05-10 |
| P3 | Add global tool dependency check to deploy.sh (firebase-tools, git, login session) | 2026-05-10 |

---

## ✅ Done
> *Archive of completed work.*

| Priority | Task | Completed |
|----------|------|-----------|
| — | — | — |

