---
name: spec-steward
description: 维护 LumioAgent 的结构并把改动沉淀进知识库——放对位置（插件资产 vs 项目实例）、校验 frontmatter、同步索引与名册、更新状态。当新增或修改 Agent、Skill、知识或规则，或完成一处改动后需要沉淀时使用。
---

# Spec Steward（仓库管家）

保证任何结构改动都「放对位置、格式合规、索引与名册同步」，并在开发完成后把「改了什么、为什么」沉淀回知识库。
本技能**不复述**那些规矩（权威在插件 `rules/dispatch.md` 与项目 `.spec/knowledge/README.md`），只在改动发生时把规矩**用起来**，并指回对应处。

**先分清两个归属**——放错位置的代价是能力隐身或跟着错误的生命周期走：

| 归属 | 位置 | 特征 |
|------|------|------|
| **插件资产** | 插件仓的 `rules/` `skills/` `agents/` `commands/` `hooks/` `references/` `templates/` | 跨项目通用，随插件版本升级 |
| **项目实例** | 项目的 `.spec/knowledge/` `.spec/decisions/` `.spec/tasks/` `.spec/AGENTS.md` | 只属于这个项目，留在项目仓库 |

判据:**换一个项目还成立吗?** 成立 → 插件资产;不成立 → 项目实例。

## 何时使用

- 新增 / 修改 / 删除一个子 Agent、Skill、知识文档或规则时。
- 完成一处代码 / 设计改动后，要把它沉淀进 `knowledge/` 时。
- 不确定某份内容该放哪（rules / standards / features / agents / skills）时。

## 前置条件

- 能随时查阅插件 `rules/dispatch.md`（调度核心、宿主差异）与项目 `.spec/knowledge/README.md`（知识导航）——本技能指回它们，不重复。
- 改动目标明确（知道要加 / 改 / 删什么）。

## 操作步骤

### 流程 A · 维护结构（新增 / 修改 / 删除能力）

1. **判类型**——这份内容属于哪一类：
   - 禁止碰什么（护栏）→ **插件** `rules/`（系统级硬规则在 `rules/system.md`，无 frontmatter；放进去即随每次会话注入，无需登记）
   - 怎么做（流程 / 规范）→ **项目** `.spec/knowledge/standards/`（见其 `README.md`）
   - 某功能的设计 / 记录 → **项目** `.spec/knowledge/features/<领域>/…`
   - 一个职能角色 → **插件** `agents/`（先过 `rules/dispatch.md` 的准入门槛「隔离本身即是产出价值」，再照 `reviewer` 范例写，正文承载判断；frontmatter 见下面第 3 步，禁令见 `rules/system.md`）
   - 可复用方法 → **插件** `skills/<name>/SKILL.md`（目录名即 skill 名；description 只写触发条件、不概括流程——概括流程的 description 会让 agent 照描述走捷径、跳过正文）
2. **放对位置 + 命名**（agent 文件 `agents/<name>.md`、skill 目录 `skills/<name>/`；均 kebab、全局唯一，且目录 / 文件名与 frontmatter `name` 一致）。
3. **写 frontmatter**：
   - agents：仅 `name` + `description`
   - skills：必含 `name` + `description`；跨客户端可移植性所需的 Agent Skills 标准可选字段（`license` / `allowed-tools` / `metadata` / `version`）允许出现，其余键被 plugin-lint 拒绝
   - knowledge：`name` + `description` + `metadata`（type / status）
   - rules：**无** frontmatter
4. **同步登记**（漏一处，能力就隐身）：
   - 加 / 删子 Agent → 更新插件 `rules/dispatch.md` 的子 Agent 名册 **+** 宿主差异表（plugin-lint 双向校验，幽灵行也抓）
   - 加 / 删 skill → 在用得上的 agent「使用的技能」里登记 / 移除；若进入默认流程，同步 `rules/dispatch.md`
   - 加 / 删知识文档 → 更新项目 `.spec/knowledge/README.md` 文件导航
   - 改动影响调度 → 更新插件 `rules/dispatch.md` 调度核心

### 流程 B · 沉淀知识（改动完成后）

1. 一句话总结：这次改了什么、为什么。
2. 判断文档归属：
   - 影响**开发流程 / 规范**（workflow / 测试策略 / 代码风格等）→ 更新 `knowledge/standards/` 对应文件。
   - 影响**功能设计**（新功能、行为变更）→ 找 `knowledge/features/` 对应文档：有就更新，没有就从 `_TEMPLATE.md` 新建（放对领域 / 模块）——只写设计现状，不留决策记录。
   - **决策**（功能内与框架级都算：为什么这样调度 / 选型 / 划边界）→ 项目 `.spec/decisions/` 新增 ADR（**唯一落点**，见其 `README.md`）。
   - **复发问题 / 踩坑经验**（reviewer 退回报告、known gaps 中第二次出现的同类问题）→ 追加进项目 `.spec/knowledge/lessons.md`（收录准入与条目格式见该文档）。
3. 更新正文——**只保留当前有效内容**，交付历史不入库（git 提交即历史）。
4. frontmatter `status` 只能取枚举：`设计中` / `实施中` / `已交付` / `历史归档`；`description` 保持一句话（是什么 + 何时查，≤120 字符，spec-lint 强制），**不得**把交付历史写进 description / status。
5. 项目 `.spec/knowledge/README.md` 导航行**来源于** frontmatter `description`：同一句话口径，允许排版差异，但不得出现 description 没有的事实、不含交付历史（行文一致性靠本步骤自觉，spec-lint 只机械校验长度 / 枚举 / 覆盖 / 链接）——导航行是 Agent 决定「要不要翻开这份文档」的唯一依据，含糊或膨胀都会让判断失准。
6. 待执行的事走任务卡（拆解用 `task-breakdown`），**别堆进知识库**。

### 流程 C · 清理离线任务卡（无内置任务工具的宿主，项目 `.spec/tasks/`）

- `.spec/tasks/` 目录只留**未完成 / 进行中**的卡。
- 任务完成后直接删除卡文件（历史在 git，不设归档目录）。

### 流程 D · 跨仓回填（下游项目 → 插件）

- **准入**：在至少一个下游真实项目里验证过的**通用机制**（角色 / 流程 / 校验 / 模板 / 红线）。
- **不收**：项目名词、技术栈绑定、业务规则——这些留在下游自己的 `.spec/`。
- 回填 = 改插件仓 + 四方版本号同步 + `claude plugin tag`；跨仓引用某次决策用 `LumioAgent#<提交>`（两仓 ADR 编号空间各自独立）。
- 反方向（插件更新 → 下游吸收）：`claude plugin update` 拿到新版本后，跑一次 `/lumio:init` 补齐新增模板（不覆盖既有文件）。

## 快速参考

| 内容 | 去处 | frontmatter |
|------|------|-------------|
| 禁止碰 / 改 / 提交某物 | 插件 `rules/` | 无 |
| 怎么开发（流程 / 规范） | 项目 `.spec/knowledge/standards/` | 有 |
| 某功能的设计 / 记录 | 项目 `.spec/knowledge/features/…` | 有 |
| 决策（功能内 / 框架级，唯一落点） | 项目 `.spec/decisions/`（ADR） | 无（见其 README 模板） |
| 复发问题 / 踩坑经验 | 项目 `.spec/knowledge/lessons.md` | 有 |
| 职能角色 | 插件 `agents/` | 仅 name+description |
| 可复用方法 | 插件 `skills/<name>/SKILL.md` | name+description（+ 标准可选字段）|

## 注意事项（Pitfalls）

- **不抄 SPEC，只指回它**——同一规则只在一处定义（单一权威）。
- **索引漂移 = 知识隐身**：新增 / 删除文档必须同步更新 `.spec/knowledge/README.md`，否则 Agent 发现不了。
- **导航行是被按需读取的**：插件化后每次会话强制注入的只有 `rules/*.md`，`.spec/knowledge/README.md` 靠项目入口文件的指针按需下钻。导航行仍要精简——它是 Agent 判断「该不该翻这份文档」的唯一依据；历史在 git，不进正文 / 导航行 / description / status。
- **rules 管禁止，standards 管怎么做**，别混。
- **放错归属比放错目录更贵**：项目专属内容混进插件会污染所有下游；通用机制留在项目里则无法复用。
- 本技能是**被拉取**的：「每次改完都更新知识」这条**义务**靠 `workflow.md` 与 `rules/dispatch.md`「编码约定」的交付标准保证，不靠本技能自觉。

## 验证

- [ ] `/lumio:lint` 通过（完整校验项清单以两支 lint 脚本的头部注释为准，机器兜底）。
- [ ] 内容在正确目录、命名合规。
- [ ] 插件 `rules/dispatch.md` 的名册、宿主差异表、调度核心与实际一致。
- [ ] knowledge 文档 `status` 与现状一致；正文只含当前有效内容，无历史堆积。
- [ ] 没有把任何规矩复制进多处。
- [ ] 删除操作：无悬空引用残留。
- [ ] `.spec/tasks/` 只含在途卡（完成的已按流程 C 删除）。
