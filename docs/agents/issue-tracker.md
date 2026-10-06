# Issue Tracker

This repository uses **Linear** as its issue tracker.

When agent skills (like `to-issues`, `triage`, `to-prd`, or `qa`) need to read from or write to the issue tracker, they should:
- Use the Linear API or the available Linear MCP tools.
- The project is `Business Chemistry` within the `JustAIit` team.
- Issues have the prefix `JUS-`.
- Always format Linear issue IDs as clickable markdown links (e.g., `[JUS-283](https://linear.app/justaiit/issue/JUS-283)`).
- Ensure new issues are created under the relevant project.

Do not use the `gh` CLI for creating issues, and do not use local markdown files under `.scratch/`.
