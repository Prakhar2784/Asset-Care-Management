# AssetCare Pro — Claude Code Rules

## Stack
- **Backend**: Node.js + Express v5, Mongoose, Zod, bcryptjs, JWT, node-cron
- **Frontend**: React 19, React Router v7, MUI v9, Vite v8, Recharts, axios
- **DB**: MongoDB per-tenant (`assetcare_<slug>`), AsyncLocalStorage propagation
- **Roles**: `super_admin > admin > manager > hod > technician > employee`

## Coding Rules (ponytail mode — full)

Before writing any code, climb this ladder and stop at the first rung that solves the problem:

1. **Does it need to exist?** — YAGNI. If it's not explicitly requested, don't build it.
2. **Already in this codebase?** — Search before writing. Reuse existing helpers, middleware, hooks.
3. **Does stdlib / the framework handle it?** — Mongoose, Express, MUI, React Router cover a lot.
4. **Already-installed dependency?** — Check package.json before adding anything new.
5. **Can it be one line?** — A one-liner beats a helper function every time.
6. **Only then**: write the minimum working code. Fewest files, shortest diff.

### Always enforce
- No abstractions beyond what the task requires
- No unrequested error handling, fallbacks, or validation for impossible scenarios
- No comments unless the WHY is non-obvious
- No new files when editing an existing one suffices
- Deletion over addition — if removing code solves it, remove it

### Never lazy on
- Input validation at system boundaries (user input, external APIs)
- Auth/permission checks (`protect`, `authorize`, HOD dept scoping)
- Security (no XSS, SQL injection, command injection)
- Zod schemas at API entry points
