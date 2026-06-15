# LumioAgent Entry

Compatibility entrypoint for agent tools. The authoritative spec lives under `.spec/`; this file only points, it defines no rules of its own.

Read these three in order — they are the always-in-context core (Claude Code force-loads them via `@import` in `CLAUDE.md`; Codex has no `@import`, so read them voluntarily here):

1. **`.spec/AGENTS.md`** — 项目介绍 + Agent 调度(中心文档,先读)。
2. **`.spec/knowledge/README.md`** — 项目知识导航(有哪些知识、在哪)。
3. **`.spec/rules/system.md`** — 硬性禁令 / 护栏(不许做什么)。

Beyond the core: 子 Agent 规范在 `.spec/agents/`,技能在 `.spec/skills/`;Codex 的索引 / 执行映射见 `.spec/AGENTS.md`。沉淀 / 同步任何能力 → 用 `spec-steward` 技能。

Rules for all agents:

- **Read and follow `.spec/AGENTS.md` first.**
- Treat this file as a pointer only. Do not add project rules here.
- Tool-specific entries must point into `.spec/`; they must not define a second source of truth.

Note: Codex relies on voluntarily reading the three core docs after this pointer; Claude Code force-loads them via `@import`. Known asymmetry, acceptable.
