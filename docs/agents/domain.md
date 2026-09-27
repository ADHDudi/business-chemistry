# Domain Docs

How engineering skills should consume this project's domain documentation.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain language and bounded context glossary.
- **`docs/adr/`** — ADRs that touch the area you're about to work in.

For multi-context repos (identified by a `CONTEXT-MAP.md` at the root), read each `CONTEXT.md` relevant to the topic, and also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence or suggest creating them — `/grill-with-docs` creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (issue title, refactor proposal, hypothesis, test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept isn't in the glossary yet, it's either language the project doesn't use (reconsider) or a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 — but worth reopening because…_
