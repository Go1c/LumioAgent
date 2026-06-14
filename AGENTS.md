# LumioAgent Entry

This is a compatibility entrypoint for agent tools.

The authoritative spec lives under `.spec/`. Start at `.spec/AGENTS.md` — the single central document (concepts, principles, scheduling) with an index at the end pointing to per-type detail: `rules/` (hard prohibitions) and the skills / knowledge READMEs. Load only what the task needs.

Rules for all agents:

- **Read and follow `.spec/AGENTS.md` first.**
- Use `.spec/rules/` for Agent guardrails (what must not be touched / changed / committed).
- Treat this file as a pointer only. Do not add project rules here.
- Tool-specific entries must point into `.spec/`; they must not define a second source of truth.

Note: Codex has no `@import`, so it still relies on voluntarily reading `.spec/AGENTS.md` after this pointer (Claude Code force-loads it via `@import` in `CLAUDE.md`). Known asymmetry, acceptable.
