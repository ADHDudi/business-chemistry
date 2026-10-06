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
- Acceptance tests: `node test.js` (Puppeteer, targets https://business-chemistry.web.app/)
- Hook tests run in `happy-dom` environment via `environmentMatchGlobs`
- Icon E2E: `npm run test:e2e:icons` (Puppeteer, builds `dist/` and serves it locally; checks favicon, apple-touch-icon, manifest and the welcome-screen icon at desktop 1280×800 and mobile 390×844; screenshots in `test-output/`). Set `BASE_URL` to check a deployed site, `PUPPETEER_EXECUTABLE_PATH` to use a local Chrome
- Icons are generated: edit `scripts/icons/shield.svg`, then `npm run icons` (never hand-edit `public/favicon.*`, `public/bond-icon.svg`, `public/apple-touch-icon.png`, `public/icons/*`)
- Never commit with failing tests

## Linear

- Team: `JustAIit`
- Project: `Business Chemistry`
- Issue prefix: `JUS-`
