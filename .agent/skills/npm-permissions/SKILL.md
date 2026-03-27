---
name: Handle npm permission errors
description: Instructions on what to do when an EPERM or permission error is encountered during npm install or node commands.
---

# Handle NPM Permission Errors

Whenever there is an `npm` permission error (e.g. `npm error code EPERM`, `operation not permitted`, `syscall mkdir` or access issues in `node_modules` / `.npm-cache`), you must strictly follow this policy:

1. **STOP immediately**. Do NOT attempt to fix it automatically by clearing caches, using temp directories, or rewriting the script logic to bypass it.
2. **Ask the user to step in**. Explain that a system-level permission error occurred.
3. **Provide the command**. Give the user the exact command they need to copy and run manually in their terminal to proceed.

This ensures the user's local operating system permissions are respected without causing infinite loops or failed automated workarounds.
