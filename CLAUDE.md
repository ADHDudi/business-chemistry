# Chimestry / Bond — Claude Code Project Rules

## Branch policy

- **Default branch: `main`**
- All feature branches must target `main` for PRs — never `master`
- `master` is a legacy branch; `main` is the source of truth as of 2026-06-15

## Git workflow

- Feature branches: `feat/<description>` or `tsurdavid/jus-<id>-<description>`
- Worktrees go in `.worktrees/<branch-name>` (already in `.gitignore`)
- PR base: always `--base main`

## Testing

- Unit tests: `npm run test:unit` (Vitest, must pass before any PR)
- E2E tests: `npm run test:e2e` (Puppeteer suite in `e2e/`, entry `e2e/run.js`)
  - Asks whether to run against local (`http://localhost:3002/`, needs `npm run dev`) or production; skip the question with `npm run test:e2e -- --env=local` or `--env=prod` (`npm test` = production)
  - Runs headless by default so it never takes over the browser you're using; add `--headed` to watch, `--open` to open the report (`npm run test:e2e:headed` does both)
  - Run one area with `--only=auth,report,account,pair`; report is written to `e2e/report.html` (git-ignored); exits non-zero on any failure
  - `account` and `pair` suites need test accounts in `.env.test` (`TEST_EMAIL_A/B`, `TEST_PASS_A/B`) and are skipped without them
- Hook tests run in `happy-dom` environment via `environmentMatchGlobs`
- Never commit with failing tests

## Linear

- Team: `JustAIit`
- Project: `Business Chemistry`
- Issue prefix: `JUS-`

## Agent skills

### Issue tracker

Linear (`JustAIit` team, `Business Chemistry` project). See `docs/agents/issue-tracker.md`.

### Triage labels

Default mappings to Linear states/labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (one global `CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

