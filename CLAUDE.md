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
- Icon E2E: `npm run test:e2e:icons` builds `dist/`, serves it and runs the `icons` group (`e2e/suites/icons.js`): favicon, apple-touch-icon, manifest and the welcome-screen icon at desktop 1280×800 and mobile 390×844; screenshots in `test-output/`. Pass a URL to check a deployed site (`npm run test:e2e:icons -- https://business-chemistry.web.app/`). The group also runs in the full `npm run test:e2e` / pre-deploy suite
- Icons are generated: edit `scripts/icons/shield.svg`, then `npm run icons` (never hand-edit `public/favicon.*`, `public/bond-icon.svg`, `public/apple-touch-icon.png`, `public/icons/*`)
- Never commit with failing tests

## Deploy

- `npm run deploy` (`deploy.sh`) deploys only an up-to-date, clean `main`; changes reach `main` through PRs
- Before deploying it runs `npm run test:unit`, starts a dev server on port 3099 and runs the full E2E suite against it (needs `.env.test`); any failure stops the deploy
- `DRY_RUN=1 npm run deploy` runs every check without deploying; `SKIP_E2E=1` skips E2E (emergencies only)
- Firestore rules/indexes deploy separately: `firebase deploy --only firestore`

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

