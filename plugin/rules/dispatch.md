# Dispatch Rules(调度与编码 · 每次会话强制加载)

通用的开发项目管理框架。**主 Agent 调度,子 Agent 执行,Skill 是方法,.md 是规则。**
主 loop 理解目标、拆任务、调度、收口:清晰小改动直接编码,创造性工作走 `brainstorming` → `writing-plans` → `subagent-driven-development` 主工作流——拆解时先把共同依赖剥成契约卡,依赖解除后按 wave 并行扇出,统一合入后审一次;职能子 Agent 只有 `reviewer`(写的人 ≠ 审的人)。

> 项目自身的定位、收口门槛与知识导航在项目的 `.spec/AGENTS.md` 与 `.spec/knowledge/README.md`(由 `/lumio:init` 生成);本文件只定义跨项目通用的调度与编码规程。

> **技能名的写法**:下文一律用裸名(如 `brainstorming`)。Claude Code 把插件技能暴露为 `lumio:brainstorming`,按裸名匹配即可;按 Agent Plugins 标准直接加载 `skills/` 的客户端看到的就是裸名。**不要在规则正文里硬编码 `lumio:` 前缀**——那会破坏跨客户端可移植性。

## 调度核心

**子 Agent 名册**(便利镜像;权威是 `agents/` 下各文件):

| 名称 | 职责 | 何时调度 |
|------|------|----------|
| `reviewer` | 对照任务卡与规范对抗式审查完整交付,产出放行 / 退回裁决 | **整体收口**(全部 wave 合入、收口门槛通过)后审一次;触碰红线面的卡合入前单独审;不审半成品 |

> **agents/ 准入门槛:只收「隔离本身即是产出价值」的角色**(当前仅 `reviewer`)。编码 / 拆解不设角色,规程见「编码约定」与 `writing-plans`。

- **调度取向:快 > 稳 > 好,并行优先。** 先把共同依赖(数据结构 / 类型定义 / API 签名 / 协议 / 通用模块 / 规范)剥成契约卡解除依赖,文件集互不重叠即并行扇出;能继承上下文的 fork 优先于冷启动 worker;串行只留给无法解除的依赖或文件重叠的工作。
- **默认流程:** 创造性工作(新功能 / 建组件 / 改行为)→ `brainstorming` 出设计共识(设计即 feature 文档初版,落 `.spec/knowledge/features/`——终稿口吻、`status: 设计中` 起步,取舍记 `.spec/decisions/`,讨论过程不入库)→ `writing-plans` 契约先行拆解:wave 0 = 契约卡(共同依赖),wave 1+ = 实现卡,每卡 `## 接口` 写明 Consumes / Produces(计划落 `.spec/plans/`;跨宿主任务状态真值仍是 `.spec/tasks/`,计划内 checkbox 只是执行内部进度)→ `subagent-driven-development` 按 wave 执行:契约卡先完成并过 lint + 类型检查,再并行扇出实现卡,每卡 worker 只做 lint + 覆盖测试自检(无子代理宿主按其 Inline Fallback 降级)→ 主 loop 统一合入 → 收口:`closeout-gate` 定级 + 收口门槛机器验证 + 验证证据(口径见「交回物格式」),整体收口审查按「派活模板」触发 `reviewer`(默认快审、显式要求才深审),退回按「失败处理」。修 bug / 排障先 `systematic-debugging` 找根因再动手。分级见 `agents/reviewer.md`。
- **快速模式(收口白名单,默认优先尝试):** 收口前跑 `closeout-gate`(随插件分发于 `tools/closeout-gate.mjs`,判定规则与阈值的单一权威是其头注释)定级——`快速豁免` 即 lint + 测试直接收口,交付附一行豁免声明与工具输出,不派任何 agent;`快审` / `深审` 按「审查闭环」走。白名单为机器可判子集(纯文档 / 纯注释(已知注释语法) / 纯配置数据 / revert / 有效行 < 50——只计新增行);「机械套用既有模式」「生成物随源更新」机器判不了,不再豁免。**红线面永不快速**:规则与可执行配置面(`rules/`、hooks、`.claude/` 等)由工具一票取消豁免;鉴权 / 安全面工具判不了,触碰时人工按至少快审处理。
- **审查闭环:** 交付即待审;审查只在统一合入后做一次(每卡不派 reviewer;触碰红线面的卡例外,合入前单审);completed 由主 loop 在 reviewer 通过(或按豁免跳过)后标记;高风险改动审查通过前**不得提交**。
- **派 worker 三选一:** ① 多个互不依赖任务可并行 ② 改动大到撑爆编排上下文 ③ 需要隔离的干净实现环境。
- **收口门槛:** 以项目 `.spec/AGENTS.md` 声明的验证命令为准;交付前必须通过。项目未声明时,至少跑该项目自身的 lint 与测试。**跑次最少化**:每卡不跑全量——worker 只跑覆盖本卡改动的测试,reviewer 不重跑 worker 已跑过的同一测试;全量收口门槛在统一合入后由主 loop 跑一次(reviewer 深审时的证据复跑不计)。
- **并行边界与合入:** 任务文件集**互不重叠**才可并行(最小化冲突),重叠必串行;拆解产物按 wave 分批扇出,批间串行,wave 0 契约卡不通过不扇出。并行 worker 各在独立 git worktree 实现——Claude Code 用原生 worktree 工具(`EnterWorktree` / Agent 工具的 `isolation: "worktree"`),其他宿主 `git worktree add`,项目内 `.worktrees/` 须先确认已 gitignore。全部 wave 合入后 reviewer 审相对基线的完整 diff,通过后收口,未过审不收口,冲突退回实现方。**分支收尾**:收口通过后按项目合并策略处理(本地合并 / push + PR / 保留分支),无策略则问用户;只清理本工作流创建的 worktree,宿主托管的用宿主退出工具;删除分支或 worktree 前列出将丢失的内容并取得确认。多宿主并存时共享任务真值是 `.spec/tasks/`,宿主内置任务工具只作个人草稿。
- **派活模板:** worker 派遣与 reviewer 触发的 prompt 骨架见 `references/dispatch-templates.md`。
- **交回物格式(单一权威):** ① 改动清单;② **验证证据**——命令与关键输出,不得只声称「已通过」;子代理的成功报告不作数,以 diff 与测试为准;③ known gaps;④ 知识沉淀落点(或声明无需沉淀)。拆解类交任务卡集合,②以自检结论 + 待澄清项代替;reviewer 交审查报告(见 `agents/reviewer.md`)。
- **谁来调度:** 只有主 loop 派活;子 Agent 只执行,各自上下文只拿任务卡 + 相关文件。
- **失败处理:** P0 / P1 → 附审查报告退回重做。处理退回意见:先对照代码核实再改,不盲改、不表演性认同;任一条不清楚则全部澄清后再动手,不分批;修复顺序阻塞 → 简单 → 复杂,逐条测;与用户既有决策冲突的意见上报用户裁决。同一问题三次不过 → 质疑方案:拆解问题重拆卡,方向问题升级用户。

## 编码约定

**约束一切写代码的上下文——主 loop 直编或通用 worker,一视同仁。**

- **领任务先标记**:动手前标为进行中(Claude Code 用 `TaskUpdate`;多宿主更新 `.spec/tasks/<slug>.md` 的 `status`);不自标 completed(归「审查闭环」)。
- **先加载再动手**:经项目 `.spec/knowledge/README.md` 导航读相关规范与被改源文件,按规模校准深度——改动 ≤ 1 个文件只读直接相关文档与源文件;2–5 个文件读全部相关文档;多模块多步骤 → 回主 loop 用 `writing-plans` 重拆。低估规模是最常见的失误。
- **测试分级**:任务大小按 `closeout-gate` 的有效行口径判定——纯文档 / 纯配置数据 / 纯注释或纯删除改动、或有效新增行 < 50 = **小任务**,其余 = **大任务**(红线面 / revert / 二进制等抬级或豁免规则只影响审查级别,不影响测试分级;写卡时按预估标注,收口时以工具报告的有效行数与文件类型判定)。小任务不要求先失败的测试、不为每处改动新增用例,收口只跑 lint 与既有测试一次;大任务需求先经 `brainstorming` 聊清,再用 `test-driven-development`;修 bug 同此分级——小修复以复现步骤验证症状消失代替新测试,大修复先写能复现的失败测试并留作回归(铁律:没有先失败的测试就没有生产代码;反模式见其 `testing-anti-patterns.md`)。
- **排障先找根因**:遇到 bug / 测试失败 / 异常行为,先走 `systematic-debugging` 四阶段,**未完成根因调查不得动手修**;修 3 次不成 = 质疑架构,停下上报。
- **不夹带(单一权威)**:只做当前目标要求的改动,不顺手重构、不加未要求的功能、不引入任务外新依赖。
- **收工即验证**:交付前必过「收口门槛」;任何「完成 / 修好 / 通过」的声称前先跑对应验证命令并读完输出——没跑过就不许声称,声称附命令与关键输出。
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

Codex 主 loop 本地执行:设计与计划用 `brainstorming` / `writing-plans`(拆卡扇出用其浅拆模式),执行按 `subagent-driven-development` 的 Inline Fallback,实现按「编码约定」,实质改动交付后读 `agents/reviewer.md` 本地对抗审查——同上下文自审丧失「写 ≠ 审」独立性,**属已知降级**;fork(继承上下文的子代理)与 worktree 隔离是 Claude Code 侧能力,Codex 无对应物时并行退化为串行,仅用户明确要求并行时用 Codex 多代理工具。宿主能力演进快,以官方文档为准,偏差时更新本表。
