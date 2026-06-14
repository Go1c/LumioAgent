---
name: spec-steward
description: 用于新增/修改本仓库的 Agent、Skill、知识或规则，或在完成一处改动后把信息沉淀进 knowledge/ 时——保证放对位置、frontmatter 合规、索引与名册同步、状态更新
metadata:
  version: 1.0.0
  author: LumioAgent
  category: project-maintenance
  tags: [spec, maintenance, knowledge]
  related_skills:
    - task-breakdown
---

# Spec Steward（仓库管家）

保证对 `.spec/` 的任何改动都「放对位置、格式合规、索引与名册同步」，并在开发完成后把「改了什么、为什么」沉淀回知识库。
本技能**不复述**那些规矩（权威在 `AGENTS.md` 和各目录 README），只在改动发生时把规矩**用起来**，并指回对应处。

## 何时使用

- 新增 / 修改一个子 Agent、Skill、知识文档或规则时。
- 完成一处代码 / 设计改动后，要把它沉淀进 `knowledge/` 时。
- 不确定某份内容该放哪（rules / standards / features / agents / skills）时。

## 前置条件

- 能随时查阅 `AGENTS.md` 与各目录 `README.md`（本技能指回它们，不重复）。
- 改动目标明确（知道要加 / 改什么）。

## 操作步骤

### 流程 A · 维护结构（新增 / 修改能力）

1. **判类型**——这份内容属于哪一类：
   - 禁止碰什么（护栏）→ `rules/`（见 `rules/README.md`）
   - 怎么做（流程 / 规范）→ `knowledge/standards/`（见 `knowledge/README.md`）
   - 某功能的设计 / 记录 → `knowledge/features/<领域>/…`（见 `knowledge/README.md`）
   - 一个职能角色 → `agents/`（见 `AGENTS.md` §7）
   - 可复用方法 → `skills/`（见 `skills/README.md`）
2. **放对位置 + 命名**（见 `AGENTS.md` §9 命名规约）。
3. **写 frontmatter**：
   - agents：仅 `name` + `description`
   - skills：`name` + `description`，扩展进 `metadata`（见 `skills/README.md`）
   - knowledge：`name` + `description` + `metadata`（type / level / status）（见 `knowledge/README.md`）
   - rules：**无** frontmatter
4. **同步登记**（漏一处，能力就隐身）：
   - 加 / 删子 Agent → 更新 `AGENTS.md` 子 Agent 名册
   - 加 / 删 skill → 在用得上的 agent「使用的技能」登记
   - 加 / 删知识文档或目录 → 更新**所在目录 README** 的下钻索引
   - 改动影响调度 → 更新 `AGENTS.md` 调度策略

### 流程 B · 沉淀知识（改动完成后）

1. 一句话总结：这次改了什么、为什么。
2. 找对应的 `knowledge/features/` 文档：有就更新，没有就从 `_TEMPLATE.md` 新建（放对领域 / 模块）。
3. 更新正文 + frontmatter 的 `status`（如 `设计中 → 已实现`）。
4. 更新所在目录 README 下钻索引的描述 / 状态。
5. 待执行的事走 `planner` 任务卡，**别堆进知识库**。

## 快速参考

| 内容 | 去处 | frontmatter |
|------|------|-------------|
| 禁止碰 / 改 / 提交某物 | `rules/` | 无 |
| 怎么开发（流程 / 规范） | `knowledge/standards/` | 有 |
| 某功能的设计 / 记录 | `knowledge/features/…` | 有 |
| 职能角色 | `agents/` | 仅 name+description |
| 可复用方法 | `skills/` | name+desc+metadata |

## 注意事项（Pitfalls）

- **不抄 SPEC，只指回它**——同一规则只在一处定义（单一权威）。
- **索引漂移 = 知识隐身**：新增文档必须更新同级 README，否则 Agent 发现不了。
- **rules 管禁止，standards 管怎么做**，别混。
- 本技能是**被拉取**的：「每次改完都更新知识」这条**义务**靠 `workflow.md` 与 `coder` 的交付标准保证，不靠本技能自觉。

## 验证

- [ ] 内容在正确目录、命名合规。
- [ ] frontmatter 合规（该有的有、扩展在 `metadata`、该无的无）。
- [ ] 相关索引 / 名册已同步。
- [ ] knowledge 文档 `status` 与现状一致。
- [ ] 没有把任何规矩复制进多处。
