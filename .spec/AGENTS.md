# LumioAgent — 中心文档

通用的开发项目管理 Agent。**主 Agent 调度,子 Agent 执行,Skill 是方法,.md 是规则。**
主 Agent(= 宿主主 loop)理解目标、拆任务、调度、收口。**写代码与拆解都不设专门角色**——主 loop 对单个、清晰、已握有上下文的小改动直接编码,需求不清用 `task-breakdown` 技能直接拆解;需并行 / 大改动 / 需隔离时派通用 worker,均遵守「调度核心」下的「编码约定」。职能子 Agent 只有 `reviewer`——它的隔离本身就是产出价值(写的人 ≠ 审的人)。子 Agent 用 Skill 执行可复用流程,所有人共享 `.spec/` 下的 .md 作为规则与知识。

> 项目知识(`knowledge/README.md` 导航)、硬性禁令(`rules/system.md`)都经 `CLAUDE.md` 的 `@import` 每次 init 强制载入,本文件不再复述。子 Agent 规范在 `agents/`,技能在 `skills/`;沉淀 / 同步任何能力 → 用 `spec-steward` 技能。

## 项目是什么

<!-- 落地项目在此填写:一句话定位 / 技术栈 / 域名与关键边界(裁剪步骤见根 README「怎么用到你的项目」)。种子仓自身无业务,本节留占位。 -->

## 调度核心

**子 Agent 名册**(便利镜像;权威是各 `.agent.md`):

| 名称 | 职责 | 何时调度 |
|------|------|----------|
| `reviewer` | 对照任务卡与项目规范对抗式审查完整交付,产出放行 / 退回裁决依据 | 功能 / 任务**整体完成**(编码收尾、收口门槛通过)后一次性审;不审半成品 |

> **agents/ 准入门槛:只收「隔离本身即是产出价值」的角色。** 隔离只为并行 / 上下文保洁的活,一律主 loop 直接做或派通用 worker + 技能,不设角色——写代码的规程在下方「编码约定」,拆解的方法在 `task-breakdown` 技能。按此门槛,当前唯一合格者是 `reviewer`:审查的价值恰恰来自「审的人不是写的人」,这份独立性只有独立上下文能提供;而编码 / 拆解的隔离不提升产出质量,强制走角色只带来冷启动、串行阻塞和有损交接。

- **默认流程:** 需求不清 → 用 `task-breakdown` 拆解(主 loop 直接拆;长探索 / 需上下文保洁时派通用 worker 执行该技能);实现 → **主 loop 对清晰小改动直接编码**,或按下述条件派通用 worker;**实质改动(新功能 / 行为变更 / 安全相关)在整体完成后必过 `reviewer` 一次性对抗审查** → 主 loop 收口,纯文档微调 / 机械套用既有模式可跳过。审查触发时机与清单见 [`agents/reviewer.agent.md`](agents/reviewer.agent.md)。
- **审查闭环:** 编码交付 = 待审,completed 由主 loop 在 reviewer 通过(或按豁免跳过)后标记;实质改动在审查通过前**不得提交**。
- **派通用 worker(而非主 loop 直接写)收敛为三选一:** ① 多个互不依赖任务可并行 ② 改动大到会撑爆编排上下文 ③ 需要与主 loop 隔离的干净实现环境。
- **收口门槛:** <!-- 落地项目替换为自己的验证命令,如 pnpm verify --> 种子默认 `node .spec/tools/spec-lint.mjs` + `node --test .spec/tools/spec-lint.test.mjs`;编码交付前必须通过。
- **并行调度:** 主 loop 可并行派多个编码 worker,仅限任务文件集**互不重叠**;有重叠必须串行。多宿主 / 多人并存时,共享任务真值是 `.spec/tasks/`,宿主内置任务工具只作个人草稿。
- **交回物格式(子 Agent / worker 交回主 loop 必含):** ① 改动清单(文件 + 一句话);② **验证证据**——跑过的命令与关键输出,不得只声称「已通过」;③ known gaps / 未尽事项;④ 知识沉淀落点(改了哪份 `knowledge/` 文档,或声明本次无需沉淀)。特化:拆解类 worker 交回任务卡集合,②以 `task-breakdown` 的自检结论 + 待澄清项代替;reviewer 交回审查报告(格式见 [`agents/reviewer.agent.md`](agents/reviewer.agent.md))。
- **谁来调度:** 只有主 loop 调度子 Agent;被调用的子 Agent 只执行、不再派活。
- **失败处理:** reviewer 报 blocker / major → 退回重做(主 loop 自己改或退回编码 worker),退回时附审查报告原文;同一问题三次仍不过 → 停下质疑方案本身:属拆解问题用 `task-breakdown` 重新修卡,属方向问题升级用户拍板。
- **上下文隔离:** 每个子 Agent 在自己的上下文里只拿任务卡 + 相关文件。

## 编码约定

**约束任何写代码的上下文——主 loop 直接编码、或派出的通用 worker,一视同仁。** 写代码不设专门子 Agent,「怎么写」的规程就在这里。

- **领任务先标记**:动手前把任务标为进行中(Claude Code 用 `TaskUpdate`;Codex / 多宿主更新 `.spec/tasks/<slug>.md` 的 `status`)。完成标记归「审查闭环」:编码方交付即待审,不自标 completed。
- **先加载再动手**:用 `before-you-code` 加载相关 knowledge / skill,校准执行深度、规划输出策略。
- **测试先行**:用 `test-driven-development`——先写失败测试,再写最小实现到通过;修 bug 先写能复现的失败测试。
- **不夹带**:只做当前目标要求的改动,不顺手重构、不加未要求的功能、不自行引入任务外的新依赖。
- **收工即验证**:交付 / 提交前必须通过「收口门槛」的验证命令,确认没破坏现有行为。
- **交付带证据**:改动清单 + 验证证据(跑过的命令 + 关键输出,不得只声称「已通过」)+ known gaps + 知识沉淀落点。派出的 worker 按此格式交回主 loop;主 loop 直接编码则据此向用户交代。
- **改完沉淀**:引入新设计决策 / 新模式 → 用 `spec-steward` 落进 `knowledge/`;纯修复 / 文档微调 / 套用既有模式可跳过,但豁免须在交回物里声明。

## 宿主差异

| 能力 | Claude Code | Codex |
|------|-------------|-------|
| 任务持久化 | `TaskCreate` / `TaskUpdate` / `TaskList` | `.spec/tasks/<slug>.md`（frontmatter `status`）|
| 子 Agent 发现 | `.claude/agents/` 自动发现 `.agent.md` | 主 loop 手动读 `.spec/agents/*.agent.md` |
| 技能加载 | `.claude/skills/` 自动发现 | `.agents/skills/` 索引，手动调用 |

Codex 主 loop 本地执行角色规范:需求不清时用 `task-breakdown` 拆解;实现时按「编码约定」直接编码,并按需用 `test-driven-development` / `spec-steward`;实质改动交付后读 `reviewer.agent.md` 本地执行对抗审查。只有用户明确要求并行时,才用 Codex 多代理工具。

> 宿主能力演进快:表格单元格记录的是**本框架的适配点**,以各宿主官方文档为准;出现偏差时更新本表并记入变更。

## 框架自身的决策与校验

- **框架级 / 跨功能决策**(为什么这样调度、为什么这套结构)记录在 [`decisions/`](decisions/README.md)——ADR 形式,一旦记录不改写,被推翻就新增一条标注取代;功能内决策写各 feature 文档的「已决策」。
- **结构一致性由 `node .spec/tools/spec-lint.mjs` 机械校验**,改完 `.spec/` 必须跑一次;完整校验项清单以该脚本**头部注释**为单一权威,人肉清单只兜机器管不到的部分。

> 调度 / 协作的**硬性禁令**(不得再派生子 Agent、frontmatter 限制、调度变更须同步)在 [`rules/system.md`](rules/system.md)。
