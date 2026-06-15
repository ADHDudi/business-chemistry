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
- Never commit with failing tests

## Linear

- Team: `JustAIit`
- Project: `Business Chemistry`
- Issue prefix: `JUS-`
