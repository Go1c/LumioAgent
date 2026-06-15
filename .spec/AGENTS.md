# LumioAgent — 中心文档

通用的开发项目管理 Agent。**主 Agent 调度,子 Agent 执行,Skill 是方法,.md 是规则。**
主 Agent(= 宿主主 loop)理解目标、拆任务、调度、收口,自己不写代码;把活分给职能化的子 Agent,子 Agent 用 Skill 执行可复用流程,所有人共享 `.spec/` 下的 .md 作为规则与知识。

> 项目知识(`knowledge/README.md` 导航)、硬性禁令(`rules/system.md`)都经 `CLAUDE.md` 的 `@import` 每次 init 强制载入,本文件不再复述。子 Agent 规范在 `agents/`,技能在 `skills/`;沉淀 / 同步任何能力 → 用 `spec-steward` 技能。

## 调度核心

**子 Agent 名册**(便利镜像;权威是各 `.agent.md`):

| 名称 | 职责 | 何时调度 |
|------|------|----------|
| `planner` | 把模糊目标转成清晰、可执行、带验收标准的任务卡 | 需求不清时 |
| `coder` | 根据任务卡编写 / 修改代码 | 有明确任务卡时 |

- **默认流程:** `planner`(拆解)→ `coder`(实现)→ 主 loop 收口。需求清晰且简单 → 跳过 planner,直接派 coder。
- **谁来调度:** 只有主 loop 调度子 Agent;被调用的子 Agent 只执行、不再派活。
- **失败处理:** coder 不达标退回重做;同一问题三次仍不过,停下质疑方案本身。
- **上下文隔离:** 每个子 Agent 在自己的上下文里只拿任务卡 + 相关文件。

## 宿主差异

| 能力 | Claude Code | Codex |
|------|-------------|-------|
| 任务持久化 | `TaskCreate` / `TaskUpdate` / `TaskList` | `.spec/tasks/<slug>.md`（frontmatter `status`）|
| 子 Agent 发现 | `.claude/agents/` 自动发现 `.agent.md` | 主 loop 手动读 `.spec/agents/*.agent.md` |
| 技能加载 | `.claude/skills/` 自动发现 | `.agents/skills/` 索引，手动调用 |

Codex 主 loop 本地执行角色规范:需求不清时读 `planner.agent.md` 并用 `task-breakdown`;任务明确时读 `coder.agent.md` 并按需用 `test-driven-development` / `spec-steward`。只有用户明确要求并行时,才用 Codex 多代理工具。

> 调度 / 协作的**硬性禁令**(不得再派生子 Agent、frontmatter 限制、调度变更须同步)在 [`rules/system.md`](rules/system.md)。
