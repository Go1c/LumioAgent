# LumioAgent Entry

This is a compatibility entrypoint for agent tools.

The authoritative instructions live in `.spec/AGENTS.md`, and the full repository specification lives in `.spec/SPEC.md`.

Rules for all agents:

- Read and follow `.spec/AGENTS.md` first.
- Use `.spec/SPEC.md` as the single source of truth for Agent, SubAgent, Skill, and context-file structure.
- Use `.spec/rules/` for shared rule fragments that are not specific to one Agent or Skill.
- Treat this file as a pointer only. Do not add project rules here.
- Tool-specific entries must point into `.spec/`; they must not define a second source of truth.
