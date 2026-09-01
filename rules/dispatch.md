# Dispatch Rules(调度与编码 · 每次会话强制加载)

通用的开发项目管理框架。**主 Agent 调度,子 Agent 执行,Skill 是方法,.md 是规则。**
主 loop 理解目标、拆任务、调度、收口:清晰小改动直接编码,创造性工作走 `brainstorming` → `writing-plans` → `subagent-driven-development` 主工作流,多卡并行用 `task-breakdown` 扇出通用 worker;职能子 Agent 只有 `reviewer`(写的人 ≠ 审的人)。

> 项目自身的定位、收口门槛与知识导航在项目的 `.spec/AGENTS.md` 与 `.spec/knowledge/README.md`(由 `/lumio:init` 生成);本文件只定义跨项目通用的调度与编码规程。

> **技能名的写法**:下文一律用裸名(如 `brainstorming`)。Claude Code 把插件技能暴露为 `lumio:brainstorming`,按裸名匹配即可;按 Agent Plugins 标准直接加载 `skills/` 的客户端看到的就是裸名。**不要在规则正文里硬编码 `lumio:` 前缀**——那会破坏跨客户端可移植性。

## 调度核心

**子 Agent 名册**(便利镜像;权威是 `agents/` 下各文件):

| 名称 | 职责 | 何时调度 |
|------|------|----------|
| `reviewer` | 对照任务卡与规范对抗式审查完整交付,产出放行 / 退回裁决 | 计划执行中**每任务完成**后审一次(两级:spec 合规 + 代码质量);**整体收口**(收口门槛通过)再审一次;不审半成品 |

> **agents/ 准入门槛:只收「隔离本身即是产出价值」的角色**(当前仅 `reviewer`)。编码 / 拆解不设角色,规程见「编码约定」与 `task-breakdown`。

- **调度取向:快 > 稳 > 好。** 默认并行:文件集互不重叠即并行扇出;能继承上下文的 fork 优先于冷启动 worker;串行只留给有依赖或文件重叠的工作。
- **默认流程:** 创造性工作(新功能 / 建组件 / 改行为)→ `brainstorming` 出设计共识 → `writing-plans` 出实现计划(设计落 `docs/specs/`、计划落 `docs/plans/`,均为功能级工作产物;跨宿主任务状态真值仍是 `.spec/tasks/`,计划内 checkbox 只是执行内部进度)→ `subagent-driven-development` 逐任务执行(每任务两级审查:spec 合规 + 代码质量;无子代理宿主按其 Inline Fallback 降级);修 bug / 排障先 `systematic-debugging` 找根因再动手;多张独立卡并行扇出仍走 `task-breakdown` + wave(见「并行边界与合入」)。交付 → 收口门槛机器验证 + `verification-before-completion`(证据先于声称);整体收口审查按「派活模板」触发 `reviewer`(默认快审、显式要求才深审),退回按 `receiving-code-review` 处理。分级见 `agents/reviewer.md`。
- **快速模式(收口白名单,默认优先尝试):** 纯文档 / 纯注释 / 纯配置数据 / 机械套用既有模式 / revert / 生成物随源更新 / 有效 diff < 20 行(去空行注释)——lint + 测试直接收口,交付附一行豁免声明,不派任何 agent。判定须机器可判(文件类型 + diff 行数),拿不准 = 快审。**红线面永不快速**:触碰 `rules/`、鉴权、安全面、可执行配置(如 hooks)的改动至少快审。
- **审查闭环:** 交付即待审;completed 由主 loop 在 reviewer 通过(或按豁免跳过)后标记;高风险改动审查通过前**不得提交**。
- **派 worker 三选一:** ① 多个互不依赖任务可并行 ② 改动大到撑爆编排上下文 ③ 需要隔离的干净实现环境。
- **收口门槛:** 以项目 `.spec/AGENTS.md` 声明的验证命令为准;交付前必须通过。项目未声明时,至少跑该项目自身的 lint 与测试。
- **并行边界与合入:** 任务文件集**互不重叠**才可并行(最小化冲突),重叠必串行;拆解产物按 wave 分批扇出,批间串行。并行 worker 各在独立 git worktree 实现(Claude Code 用 Agent 工具的 worktree 隔离),reviewer 审 worktree 相对基线的完整 diff,通过后主 loop 合入主工作区,未过审不合入,冲突退回实现方。多宿主并存时共享任务真值是 `.spec/tasks/`,宿主内置任务工具只作个人草稿。
- **派活模板:** worker 派遣与 reviewer 触发的 prompt 骨架见 `references/dispatch-templates.md`。
- **交回物格式(单一权威):** ① 改动清单;② **验证证据**——命令与关键输出,不得只声称「已通过」;③ known gaps;④ 知识沉淀落点(或声明无需沉淀)。拆解类交任务卡集合,②以自检结论 + 待澄清项代替;reviewer 交审查报告(见 `agents/reviewer.md`)。
- **谁来调度:** 只有主 loop 派活;子 Agent 只执行,各自上下文只拿任务卡 + 相关文件。
- **失败处理:** P0 / P1 → 附审查报告退回重做;同一问题三次不过 → 质疑方案:拆解问题重修卡,方向问题升级用户。

## 编码约定

**约束一切写代码的上下文——主 loop 直编或通用 worker,一视同仁。**

- **领任务先标记**:动手前标为进行中(Claude Code 用 `TaskUpdate`;多宿主更新 `.spec/tasks/<slug>.md` 的 `status`);不自标 completed(归「审查闭环」)。
- **先加载再动手**:用 `before-you-code` 校准要读什么、读多深。
- **测试先行**:用 `test-driven-development`(铁律:没有先失败的测试就没有生产代码;反模式见其 `testing-anti-patterns.md`)。
- **排障先找根因**:遇到 bug / 测试失败 / 异常行为,先走 `systematic-debugging` 四阶段,**未完成根因调查不得动手修**;修 3 次不成 = 质疑架构,停下上报。
- **不夹带(单一权威)**:只做当前目标要求的改动,不顺手重构、不加未要求的功能、不引入任务外新依赖。
- **收工即验证**:交付前必过「收口门槛」;任何「完成 / 修好 / 通过」的声称前先过 `verification-before-completion`——没跑过验证命令就不许声称。
- **交付带证据**:按「交回物格式」交付;主 loop 直编则据此向用户交代。
- **改完沉淀**:新模式 / 新规范用 `spec-steward` 落项目 `.spec/knowledge/`,决策记 `.spec/decisions/`;纯修复 / 微调可豁免,豁免须在交回物声明。
- **决策唯一落点**:决策**一律**记 `.spec/decisions/`(ADR,不改写、只新增取代)——功能内与框架级共用;feature 文档只描述设计现状,不留决策记录。

## 宿主差异

本框架以 Agent 插件分发,双标准并存:技能层遵循 [Agent Plugins 1.0.0](https://agent-plugins.org/) 可跨客户端加载;子 Agent、slash command 与 hook 是 Claude Code 专有层(规范 v1 明确不覆盖)。

| 能力 | Claude Code | Codex / 其他客户端 |
|------|-------------|--------------------|
| 任务持久化 | `TaskCreate` / `TaskUpdate` / `TaskList` | `.spec/tasks/<slug>.md`(frontmatter `status`)|
| 技能加载 | 插件自动发现,按 `lumio:<name>` 调用 | 按 Agent Plugins 标准发现 `skills/` |
| 子 Agent | 插件 `agents/` 自动发现 | **无**——主 loop 手动读 `agents/reviewer.md` 本地对抗审查 |
| 规则常驻 | SessionStart hook 每次会话注入 | **无**——靠项目 `AGENTS.md` 指针主动读 |

Codex 主 loop 本地执行:设计与计划用 `brainstorming` / `writing-plans`,执行按 `subagent-driven-development` 的 Inline Fallback,拆卡扇出用 `task-breakdown`,实现按「编码约定」,实质改动交付后读 `agents/reviewer.md` 本地对抗审查——同上下文自审丧失「写 ≠ 审」独立性,**属已知降级**;fork(继承上下文的子代理)与 worktree 隔离是 Claude Code 侧能力,Codex 无对应物时并行退化为串行,仅用户明确要求并行时用 Codex 多代理工具。宿主能力演进快,以官方文档为准,偏差时更新本表。
