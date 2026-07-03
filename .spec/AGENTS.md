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
| `reviewer` | 对照任务卡对抗式审查 coder 交付,产出放行 / 退回裁决依据 | coder 交回实质改动后 |

- **默认流程:** `planner`(拆解)→ `coder`(实现)→ `reviewer`(对抗审查)→ 主 loop 收口。需求清晰且简单 → 跳过 planner,直接派 coder;**实质改动(新功能 / 行为变更 / 安全相关)必过 reviewer**,纯文档微调 / 机械套用既有模式可跳过。
- **交回物格式(所有子 Agent 交回主 loop 必含):** ① 改动清单(文件 + 一句话);② **验证证据**——跑过的命令与关键输出,不得只声称「已通过」;③ known gaps / 未尽事项;④ 知识沉淀落点(改了哪份 `knowledge/` 文档,或声明本次无需沉淀)。两个角色的特化:planner 交回任务卡集合,②以 `task-breakdown` 的自检结论 + 待澄清项代替;reviewer 交回审查报告(格式见 [`agents/reviewer.agent.md`](agents/reviewer.agent.md))。
- **谁来调度:** 只有主 loop 调度子 Agent;被调用的子 Agent 只执行、不再派活。
- **失败处理:** reviewer 报 blocker / major → 退回 coder,退回时附审查报告原文;同一问题三次仍不过 → 停下质疑方案本身:属拆解问题回 `planner` 修卡,属方向问题升级用户拍板。
- **上下文隔离:** 每个子 Agent 在自己的上下文里只拿任务卡 + 相关文件。

## 宿主差异

| 能力 | Claude Code | Codex |
|------|-------------|-------|
| 任务持久化 | `TaskCreate` / `TaskUpdate` / `TaskList` | `.spec/tasks/<slug>.md`（frontmatter `status`）|
| 子 Agent 发现 | `.claude/agents/` 自动发现 `.agent.md` | 主 loop 手动读 `.spec/agents/*.agent.md` |
| 技能加载 | `.claude/skills/` 自动发现 | `.agents/skills/` 索引，手动调用 |

Codex 主 loop 本地执行角色规范:需求不清时读 `planner.agent.md` 并用 `task-breakdown`;任务明确时读 `coder.agent.md` 并按需用 `test-driven-development` / `spec-steward`;实质改动交付后读 `reviewer.agent.md` 本地执行对抗审查。只有用户明确要求并行时,才用 Codex 多代理工具。

## 框架自身的决策与校验

- **框架级 / 跨功能决策**(为什么这样调度、为什么这套结构)记录在 [`decisions/`](decisions/README.md)——ADR 形式,一旦记录不改写,被推翻就新增一条标注取代;功能内决策写各 feature 文档的「已决策」。
- **结构一致性由 `node tools/spec-lint.mjs` 机械校验**(frontmatter / status 枚举 / 导航与 ADR 索引覆盖 / 链接可达 / @import 完整性 / 名册一致),改完 `.spec/` 必须跑一次;人肉清单只兜机器管不到的部分。

> 调度 / 协作的**硬性禁令**(不得再派生子 Agent、frontmatter 限制、调度变更须同步)在 [`rules/system.md`](rules/system.md)。
