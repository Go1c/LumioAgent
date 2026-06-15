---
name: spec-steward
description: 维护本仓库 .spec/ 的结构并把改动沉淀进知识库——放对位置、校验 frontmatter、同步索引与名册、更新状态。当新增或修改 Agent、Skill、知识或规则，或完成一处改动后需要沉淀进 knowledge/ 时使用。
---

# Spec Steward（仓库管家）

保证对 `.spec/` 的任何改动都「放对位置、格式合规、索引与名册同步」，并在开发完成后把「改了什么、为什么」沉淀回知识库。
本技能**不复述**那些规矩（权威在 `AGENTS.md` 与 `knowledge/README.md`），只在改动发生时把规矩**用起来**，并指回对应处。

## 何时使用

- 新增 / 修改 / 删除一个子 Agent、Skill、知识文档或规则时。
- 完成一处代码 / 设计改动后，要把它沉淀进 `knowledge/` 时。
- 不确定某份内容该放哪（rules / standards / features / agents / skills）时。

## 前置条件

- 能随时查阅 `AGENTS.md`（调度策略、宿主差异）与 `knowledge/README.md`（知识导航）——本技能指回它们，不重复。
- 改动目标明确（知道要加 / 改 / 删什么）。

## 操作步骤

### 流程 A · 维护结构（新增 / 修改 / 删除能力）

1. **判类型**——这份内容属于哪一类：
   - 禁止碰什么（护栏）→ `rules/`（系统级硬规则在 `rules/system.md`，无 frontmatter）
   - 怎么做（流程 / 规范）→ `knowledge/standards/`（见 `knowledge/README.md`）
   - 某功能的设计 / 记录 → `knowledge/features/<领域>/…`（见 `knowledge/README.md`）
   - 一个职能角色 → `agents/`（照 `planner` / `coder` 范例写，正文承载判断；frontmatter 见下面第 3 步，禁令见 `rules/system.md`）
   - 可复用方法 → `skills/<name>/SKILL.md`（目录名即 skill 名）
2. **放对位置 + 命名**（agent 文件 `<name>.agent.md`、skill 目录 `skills/<name>/`；均 kebab、全局唯一，且目录 / 文件名与 frontmatter `name` 一致）。
3. **写 frontmatter**：
   - agents：仅 `name` + `description`
   - skills：**仅** `name` + `description`（`version` / `license` / `metadata` 等非规范字段会被忽略，别加）
   - knowledge：`name` + `description` + `metadata`（type / level / status）
   - rules：**无** frontmatter
4. **同步登记**（漏一处，能力就隐身）：
   - 加 / 删子 Agent → 更新 `AGENTS.md` 子 Agent 名册 **+** 宿主差异表
   - 加 / 删 skill → 在用得上的 agent「使用的技能」里登记 / 移除
   - 加 / 删知识文档 → 更新 `knowledge/README.md` 文件导航
   - 改动影响调度 → 更新 `AGENTS.md` 调度策略

### 流程 B · 沉淀知识（改动完成后）

1. 一句话总结：这次改了什么、为什么。
2. 判断文档归属：
   - 影响**开发流程 / 规范**（workflow / 测试策略 / 代码风格等）→ 更新 `knowledge/standards/` 对应文件。
   - 影响**功能设计**（新功能、行为变更、架构决策）→ 找 `knowledge/features/` 对应文档：有就更新，没有就从 `_TEMPLATE.md` 新建（放对领域 / 模块）。
3. 更新正文 + frontmatter 的 `status`（如 `设计中 → 已实现`）。
4. 更新 `knowledge/README.md` 导航的描述 / 状态。
5. 待执行的事走 `planner` 任务卡，**别堆进知识库**。

## 快速参考

| 内容 | 去处 | frontmatter |
|------|------|-------------|
| 禁止碰 / 改 / 提交某物 | `rules/` | 无 |
| 怎么开发（流程 / 规范） | `knowledge/standards/` | 有 |
| 某功能的设计 / 记录 | `knowledge/features/…` | 有 |
| 职能角色 | `agents/` | 仅 name+description |
| 可复用方法 | `skills/<name>/SKILL.md` | 仅 name+description |

## 注意事项（Pitfalls）

- **不抄 SPEC，只指回它**——同一规则只在一处定义（单一权威）。
- **索引漂移 = 知识隐身**：新增 / 删除文档必须同步更新 `knowledge/README.md`，否则 Agent 发现不了。
- **rules 管禁止，standards 管怎么做**，别混。
- 本技能是**被拉取**的：「每次改完都更新知识」这条**义务**靠 `workflow.md` 与 `coder` 的交付标准保证，不靠本技能自觉。

## 验证

- [ ] 内容在正确目录、命名合规。
- [ ] frontmatter 合规（该有的有、该无的无）。
- [ ] `AGENTS.md` 名册、宿主差异表、调度策略与实际一致。
- [ ] `knowledge/README.md` 导航无遗漏、无悬空行。
- [ ] knowledge 文档 `status` 与现状一致。
- [ ] 没有把任何规矩复制进多处。
- [ ] 删除操作：无悬空引用残留。
