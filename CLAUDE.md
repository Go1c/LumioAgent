# CLAUDE.md

This is a Claude Code compatibility entrypoint.

LumioAgent uses `.spec/` as the single authoritative specification directory:

- Read `.spec/AGENTS.md` first — it is the single central document (constitution + overview + global rules + scheduling).
- Per-type format specs live next to each type: `.spec/skills/README.md`, `.spec/knowledge/README.md`, `.spec/rules/README.md` (sub-Agent format is in `AGENTS.md` §7).
- Claude rules are exposed through `.claude/rules -> ../.spec/rules`.
- Claude skills are exposed through `.claude/skills -> ../.spec/skills`.
- Claude agents are exposed through `.claude/agents -> ../.spec/agents`.

Do not maintain separate Claude-specific rules here. If behavior changes, update `.spec/` and keep this file as a pointer.
