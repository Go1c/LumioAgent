# LumioAgent — 中心文档

通用的开发项目管理 Agent。**主 Agent 调度,子 Agent 执行,Skill 是方法,.md 是规则。**
主 loop 理解目标、拆任务、调度、收口:清晰小改动直接编码,需求不清用 `task-breakdown` 拆解,满足派发条件则扇出通用 worker;职能子 Agent 只有 `reviewer`(写的人 ≠ 审的人)。

> 知识导航(`knowledge/README.md`)与硬红线(`rules/system.md`)经 `CLAUDE.md` 的 `@import` 每次 init 强制载入,本文件不复述;沉淀 / 同步能力用 `spec-steward` 技能。

## 项目是什么

<!-- 落地项目在此填写:一句话定位 / 技术栈 / 域名与关键边界(裁剪步骤见根 README「怎么用到你的项目」)。种子仓自身无业务,本节留占位。 -->

## 调度核心

**子 Agent 名册**(便利镜像;权威是各 `.agent.md`):

| 名称 | 职责 | 何时调度 |
|------|------|----------|
| `reviewer` | 对照任务卡与规范对抗式审查完整交付,产出放行 / 退回裁决 | 任务**整体完成**(收口门槛通过)后一次性审;不审半成品 |

> **agents/ 准入门槛:只收「隔离本身即是产出价值」的角色**(当前仅 `reviewer`)。编码 / 拆解不设角色,规程见「编码约定」与 `task-breakdown`。

- **调度取向:快 > 稳 > 好。** 默认并行:文件集互不重叠即并行扇出;能继承上下文的 fork 优先于冷启动 worker;串行只留给有依赖或文件重叠的工作。
- **默认流程:** 需求不清 → `task-breakdown`;实现 → 主 loop 直编或派 worker;**实质改动(新功能 / 行为变更 / 安全相关)整体完成后必过 `reviewer`**(纯文档微调 / 机械套用既有模式可跳过)→ 主 loop 收口。清单见 [`agents/reviewer.agent.md`](agents/reviewer.agent.md)。
- **审查闭环:** 交付即待审;completed 由主 loop 在 reviewer 通过(或按豁免跳过)后标记;实质改动审查通过前**不得提交**。
- **派 worker 三选一:** ① 多个互不依赖任务可并行 ② 改动大到撑爆编排上下文 ③ 需要隔离的干净实现环境。
- **收口门槛:** <!-- 落地项目替换为自己的验证命令,如 pnpm verify --> 种子默认 `node .spec/tools/spec-lint.mjs` + `node --test .spec/tools/spec-lint.test.mjs`;交付前必须通过。
- **并行边界:** 任务文件集**互不重叠**才可并行,重叠必串行。多宿主并存时共享任务真值是 `.spec/tasks/`,宿主内置任务工具只作个人草稿。
- **交回物格式(全仓单一权威):** ① 改动清单;② **验证证据**——命令与关键输出,不得只声称「已通过」;③ known gaps;④ 知识沉淀落点(或声明无需沉淀)。拆解类交任务卡集合,②以自检结论 + 待澄清项代替;reviewer 交审查报告(见 [`agents/reviewer.agent.md`](agents/reviewer.agent.md))。
- **谁来调度:** 只有主 loop 派活;子 Agent 只执行,各自上下文只拿任务卡 + 相关文件。
- **失败处理:** blocker / major → 附审查报告退回重做;同一问题三次不过 → 质疑方案:拆解问题重修卡,方向问题升级用户。

## 编码约定

**约束一切写代码的上下文——主 loop 直编或通用 worker,一视同仁。**

- **领任务先标记**:动手前标为进行中(Claude Code 用 `TaskUpdate`;多宿主更新 `.spec/tasks/<slug>.md` 的 `status`);不自标 completed(归「审查闭环」)。
- **先加载再动手**:用 `before-you-code` 校准要读什么、读多深。
- **测试先行**:用 `test-driven-development`;修 bug 先写能复现的失败测试。
- **不夹带(全仓单一权威)**:只做当前目标要求的改动,不顺手重构、不加未要求的功能、不引入任务外新依赖。
- **收工即验证**:交付前必过「收口门槛」。
- **交付带证据**:按「交回物格式」交付;主 loop 直编则据此向用户交代。
- **改完沉淀**:新决策 / 新模式用 `spec-steward` 落 `knowledge/`;纯修复 / 微调可豁免,豁免须在交回物声明。

## 宿主差异

| 能力 | Claude Code | Codex |
|------|-------------|-------|
| 任务持久化 | `TaskCreate` / `TaskUpdate` / `TaskList` | `.spec/tasks/<slug>.md`（frontmatter `status`）|
| 子 Agent 发现 | `.claude/agents/` 自动发现 | 主 loop 手动读 `.spec/agents/` |
| 技能加载 | `.claude/skills/` 自动发现 | `.agents/skills/` 索引,手动调用 |

Codex 主 loop 本地执行:拆解用 `task-breakdown`,实现按「编码约定」,实质改动交付后读 `reviewer.agent.md` 本地对抗审查;仅用户明确要求并行时用 Codex 多代理工具。宿主能力演进快,以官方文档为准,偏差时更新本表。

## 框架自身的决策与校验

- 框架级决策记 [`decisions/`](decisions/README.md)(ADR,不改写、只新增取代);功能内决策写 feature 文档「已决策」。
- 结构一致性由 `node .spec/tools/spec-lint.mjs` 校验,改完 `.spec/` 必跑;校验项清单以脚本头部注释为单一权威。

> 硬性禁令(不得再派生子 Agent、frontmatter 限制、调度变更须同步)在 [`rules/system.md`](rules/system.md)。
