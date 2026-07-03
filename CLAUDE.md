# CLAUDE.md

Claude Code entrypoint. The `@import` lines below **force-load** their content into every session context. The authoritative source is `.spec/`; this file only loads, it defines no rules of its own.

Central doc (项目介绍 + Agent 调度):

@.spec/AGENTS.md

Knowledge navigation (force-loaded so the agent always knows what knowledge exists and where):

@.spec/knowledge/README.md

System rules (**force-loaded at every agent init, no progressive disclosure** — hard red lines that must be in context from the start):

@.spec/rules/system.md

> **Maintenance:** every force-loaded file needs a matching `@.spec/<path>.md` line above, or it won't load at init. This applies to every rule file under `rules/` and to `knowledge/README.md`. This completeness is machine-checked by `node .spec/tools/spec-lint.mjs` — run it after any `.spec/` change.

Claude-specific:

- Sub-agents and skills are exposed via symlinks: `.claude/agents -> ../.spec/agents`, `.claude/skills -> ../.spec/skills`. Rules reach context via the `@import` lines above, not via a symlink.
- Do not maintain any Claude-only rules here. When behavior changes, edit `.spec/`; this file is just a pointer.
