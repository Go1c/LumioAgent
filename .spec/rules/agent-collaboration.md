# 协作 / 调度禁令

Agent 协作与调度上的硬红线。这些是「**不得 / 只能**」类禁令，与文件 / 资源护栏并列；机制与策略（怎么调度、名册）见 [`../AGENTS.md`](../AGENTS.md)。

- **子 Agent 不得再派生别的子 Agent。** 调度权只在主 loop；被调用的子 Agent 只执行、不再派活（也符合 subagent 不能再 spawn subagent 的宿主限制）。
- **子 Agent 的 frontmatter 只用 `name` + `description`。** 其余（追求什么、用哪些技能、不做什么）写进正文；`role` / `goal` / `tools` 等不被宿主据以调度，写了不生效。
- **改动若影响调度关系，必须同步更新 [`../AGENTS.md`](../AGENTS.md) 的「调度策略」/「子 Agent 名册」。** 漏更新 = 主 loop 调度依据失真。
