# Changelog

本文件记录 LumioAgentSpec 的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.1]

### Added

- **快速模式「语义红线面」与机器判别子集**:
  - `rules/dispatch.md`「快速模式」段明确语义红线面定义：数据布局 / 存储 stride、公共语义与 ABI/FFI（wire、abi、schema 文件）、发布原子性与提交点、事务回放与回执账本、快照 / 迁移 / 存档格式、generation 与实例身份、资源预算与容量常量、物理边界与精度——触碰即至少快审，不因有效行数小而豁免。
  - `tools/closeout-gate.mjs` 头注释确立「红线名单权威表」，区分机器判别子集与人工判别子集；机器实现一票取消豁免清单追加路径段 `wire`、`abi`（匹配 `**/wire/**`、`**/abi/**`）与文件名模式 `*.schema.json`、`*snapshot*`、`*ledger*`、`*budget*`、`*migration*`。
  - `rules/dispatch.md`「并行边界与合入」段补充约束：文件集不重叠但共享同一数据不变量（存储、快照、物理读取）的改动，必须声明一条共同的集成验收链。
  - `tests/closeout-gate.test.mjs` 补充覆盖用例：触碰上述语义路径/模式的 3 行小 diff 均一票定级为快审，未跟踪语义红线文件亦直接阻断快速豁免。

## [1.1.0]

### Changed

- **仓库与品牌改名 LumioAgentSpec**(依据 ADR 0004):两份插件清单、marketplace.json、模板与工具文案中的名称与 URL 全部更新。插件 id `lumio` 与 `/lumio:init`、`/lumio:lint`、`lumio:<skill>` 调用方式不变。
- **仓库迁入 LumioGames 组织**(依据 ADR 0005):地址为 `LumioGames/LumioAgentSpec`,清单的 `author` / `homepage` / `repository` 与 marketplace 的 `git-subdir` url 一并指向组织。
- marketplace 标识 `lumioagent` → `lumioagentspec`;`package.json` name 同步。
- README 重写为中英双语(`README.md` 英文 + `README.zh-CN.md` 中文):先讲解决什么问题(跨 Agent 切换、单一上下文、机器把关),再讲支持哪些 Agent 与设计理念,附工作流图与技能清单。
- **默认流程改为并行优先、契约先行**(依据 ADR 0007):`writing-plans` 新增浅拆模式——先把共同依赖(数据结构 / 类型 / API / 协议 / 通用模块 / 规范)剥成 wave 0 契约卡,实现卡按 wave 并行扇出;`subagent-driven-development` 重构为 wave 执行器,**每任务审查取消**,只在全部合入后审一次(红线面卡合入前单审);全量收口门槛只在合入后跑一次。
- **测试分级**(依据 ADR 0007):任务大小复用 `closeout-gate` 有效行口径——纯文档 / 配置 / 注释 / 删除或有效新增行 < 50 为小任务,免 TDD、不为每处改动加用例;大任务需求先聊清再 TDD 先行。`test-driven-development` 顶部加分级门,`standards/testing.md` 模板同步。修 bug 同此分级:小修复以复现步骤验证症状消失,大修复先写复现测试留作回归。`closeout-gate` 在红线面快审与纯文档 / 配置分支也打印有效行数,供测试分级读取(判定逻辑未改)。
- `brainstorming` 瘦身到 HARD-GATE + 流程骨架 + 落点规则(140 → 37 行);提问交给宿主原生 plan mode。
- `rules/dispatch.md` 吸收被删技能的有效规则:「先加载再动手」的规模校准、「收工即验证」的证据要求、「失败处理」的退回意见处理、「并行边界与合入」的原生 worktree 工具与 gitignore 检查;SDD 与 dispatch.md 关于并行的矛盾以 dispatch.md 为准。

### Removed

- **技能 11 → 6**(依据 ADR 0006):下线 `before-you-code`、`verification-before-completion`、`receiving-code-review`、`using-git-worktrees`(内容已由宿主原生能力与 `rules/dispatch.md` 覆盖)与 `task-breakdown`(并入 `writing-plans` 浅拆模式)。`lumio:<name>` 调用这五个名字将失效,无需替代调用——规则由 SessionStart 注入常驻。
- `agents/reviewer.md` 的「使用的技能」节(唯一条目已下线)。

### 升级指引

- 已按 1.0.0 安装的用户请重新添加 marketplace 并重装:`claude plugin marketplace add LumioGames/LumioAgentSpec && claude plugin install lumio@lumioagentspec`。旧地址(`Go1c/LumioAgent`、`Go1c/LumioAgentSpec`)由 GitHub 自动重定向,仍可拉取但不再维护;旧标识 `lumioagent` 同样废弃。

## [1.0.0]

结构破坏性变更：从「复制进项目的模板仓库」改为**双标准 Agent 插件**，并完成治理优化前两波（单一文档根 + 机器判定收口，依据 ADR 0003）。

### Added

- 根 `plugin.json` —— 遵循 [Agent Plugins 1.0.0](https://agent-plugins.org/)，技能层对 Codex / Cursor / Copilot / VS Code 等客户端可移植。
- `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` —— Claude Code 侧清单，使 agents / commands / hooks 生效。
- `tests/agent-plugins-conformance.test.mjs` —— 机械校验规范合规与双清单一致。
- `tools/closeout-gate.mjs` —— 收口审查定级命令：输入 diff（相对 BASE），输出三态（`快速豁免` / `快审` / `深审`）加逐条命中理由；定级是建议不是门禁（退出码恒 0）。**判定规则与阈值的单一权威是工具头注释**：有效行 < 50 豁免（只计新增行，纯删除按 0 算）、≥ 500 深审、红线面 + ≥ 100 深审；红线面（路径段 `rules/`、`hooks/`、`.claude/` 含嵌套；`.github/workflows/`、`.circleci/`；`hooks.json`、`.gitlab-ci.yml`）一票取消豁免、永不快速。防逃逸加固（红线改名、pathspec 魔法、子目录根定界、revert 前缀蹭豁免、BASE 选项注入）均有用例钉住。
- spec-lint 三项防复发校验（各配反例测试）：**禁并行文档根**（走 `git ls-files -z` 索引，git-ignored 草稿天然豁免）、**ADR 状态行强制**（`生效` 或带链接的 `(部分)被 [NNNN](<file>) 取代`）、**`.spec/plans/` frontmatter 强制**（仅 `status`，与任务卡同枚举）。
- plugin-lint 落点禁名 grep —— 插件资产正文指定旧文档根（`docs/specs/`、`docs/plans/`）即红，防「规则禁名、技能照写」的框架自伤。
- `templates/.spec/plans/README.md` —— 计划目录格式契约（历史记录，日期前缀，不设索引）。

### Changed

- 技能与子 Agent 从 `.spec/` 上移到插件根的 `skills/` 与 `agents/`。
- **框架产物单一落点 `.spec/`**：设计即 feature 文档初版（`.spec/knowledge/features/`，终稿口吻，`metadata.status: 设计中` 起步，靠状态流转，零二次搬运）；实现计划落 `.spec/plans/`；取舍与弃案记 ADR；讨论过程与审查报告不入库。`docs/specs/`、`docs/plans/` 默认落点废除。
- **快速模式白名单从散文变命令**：收口前跑 `closeout-gate` 定级；白名单收窄为机器可判子集（纯文档 / 纯注释(已知注释语法) / 纯配置数据 / revert / 有效行 < 50），「机械套用既有模式」「生成物随源更新」不再豁免。dispatch.md、reviewer、派活模板的豁免口径统一收敛到 `rules/dispatch.md` + 工具头注释。
- `/lumio:lint` 自仓分支修复（插件移入 `plugin/` 后的死路径）。

### 升级指引（Breaking，从 0.x 迁移必读）

1. **提交可能被拦**：guard-commit 每次 `git commit` 跑 spec-lint；仓内任何层级已入库的 `docs/specs/`、`docs/plans/` 会红——`git mv` 进 `.spec/` 对应目录（计划补 `status` frontmatter）或取消跟踪后再提交。
2. **仓根之外的第二个 `.spec/` 被禁**（`templates/.spec/` 豁免）——monorepo 需合并到根 `.spec/`。
3. **ADR 必须有 `- 状态:` 行**且取值合规；按旧模板写的无链接「被 NNNN 取代」需补链接。围栏代码块里的状态行不算数。
4. `.spec/plans/` 根级计划文件必须带 `status` frontmatter（`pending` / `in_progress` / `completed`）。
5. spec-lint 需要 git：非 git 仓库跳过禁根校验，其余 git 失败会显式报错（不再静默）。
6. 升级后重跑 `/lumio:init` 领取新模板（`plans/README.md` 等；不覆盖既有文件）。

[Unreleased]: https://github.com/LumioGames/LumioAgentSpec/compare/lumio--v1.0.0...HEAD
[1.0.0]: https://github.com/LumioGames/LumioAgentSpec/releases/tag/lumio--v1.0.0
