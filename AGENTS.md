# LumioAgent Entry

This is a compatibility entrypoint for agent tools.

The authoritative instructions live in `.spec/AGENTS.md` — the single central document (constitution + overview + global rules + scheduling).

Rules for all agents:

- Read and follow `.spec/AGENTS.md` first.
- Per-type format specs live next to each type: `.spec/skills/README.md`, `.spec/knowledge/README.md`, `.spec/rules/README.md` (sub-Agent format is in `AGENTS.md` §7).
- Use `.spec/rules/` for Agent guardrails (what must not be touched / changed / committed).
- Treat this file as a pointer only. Do not add project rules here.
- Tool-specific entries must point into `.spec/`; they must not define a second source of truth.
