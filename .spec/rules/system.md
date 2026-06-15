# System Rules(系统规则 · 每次 Agent 初始化强制加载)

本文件经 `CLAUDE.md` 的 `@import` **在每次 Agent 初始化时强制载入上下文**——始终在场的硬红线,不走渐进式披露。
只写「**必须 / 只能 / 不得**」:什么必须做、什么禁止做。不写「怎么做 / 是什么」(那在 `knowledge/standards/` 或 [`AGENTS.md`](../AGENTS.md))。
新增系统级硬规则,直接在本文件加一节;若日后出现「非启动必载」的情境化规则,再另立文件并相应决定是否 `@import`。

## 协作 / 调度

- **子 Agent 不得再派生别的子 Agent。** 调度权只在主 loop;被调用的子 Agent 只执行、不再派活(也符合宿主限制:subagent 不能再 spawn subagent)。
- **子 Agent 的 frontmatter 只用 `name` + `description`。** 其余(追求什么、用哪些技能、不做什么)写进正文;`role` / `goal` / `tools` 等不被宿主据以调度,写了不生效。
- **改动若影响调度关系,必须同步更新 [`AGENTS.md`](../AGENTS.md) 的「调度核心」(名册 / 流程)。** 漏更新 = 主 loop 调度依据失真。
