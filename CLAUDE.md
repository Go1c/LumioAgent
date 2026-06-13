# CLAUDE.md

This is a Claude Code compatibility entrypoint.

LumioAgent uses `.spec/` as the single authoritative specification directory:

- Read `.spec/AGENTS.md` for global agent rules and scheduling policy.
- Read `.spec/SPEC.md` for the full repository specification.
- Claude rules are exposed through `.claude/rules -> ../.spec/rules`.
- Claude skills are exposed through `.claude/skills -> ../.spec/skills`.
- Claude agents are exposed through `.claude/agents -> ../.spec/agents`.

Do not maintain separate Claude-specific rules here. If behavior changes, update `.spec/` and keep this file as a pointer.
