# LumioAgent 规范文档（SPEC）

> 本文是 LumioAgent 的唯一权威规范，存放在 `.spec/SPEC.md`。它定义「Agent / SubAgent / Skill / 上下文 .md 文件」分别是什么、长什么样、如何创建、如何更新、如何维护。
> 所有人（以及 Agent 自己）在新增或修改能力时，都以本文为准。

---

## 0. LumioAgent 是什么

LumioAgent 是一个**通用的开发项目管理 Agent**。它的工作方式是：

- 有一个**主 Agent**负责理解目标、拆解任务、调度；
- 主 Agent 把具体工作分派给不同职能的**子 Agent（SubAgent）**，每个子 Agent 有自己的职责、目标和可用能力；
- 子 Agent 通过**技能（Skill）**来执行可复用的标准化流程；
- 所有人共享一套**上下文文件（.md）**作为规则与背景。

一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

### 三条不可动摇的设计原则

1. **能力长在边缘，不长在核心。** 新增能力优先做成 Skill 或 SubAgent，而不是改主 Agent 的核心逻辑。核心保持「窄腰」。
2. **规则即文档。** Agent 的行为由 `.md` 文件定义，不靠隐藏约定。任何人读这些 `.md` 就能完整理解系统怎么运转。
3. **渐进式披露（Progressive Disclosure）。** Agent 默认只加载每个能力的「名字 + 描述」，只有当任务匹配时才把完整内容读进上下文。这让系统可以挂载大量能力而几乎不占用上下文。详见第 1.5 节。

> 关于兼容性：本规范的 **Skill 格式刻意兼容 [Agent Skills 开放标准](https://agentskills.io)**（由 Anthropic 发起，Claude Code、Cursor、Gemini CLI、Kiro 等都已采纳）。这意味着我们写的技能可以被这些工具直接复用，别人写的技能也能拿来即用。我们在标准之上加了少量**可选扩展字段**（见第 5 节），扩展字段不破坏兼容——不认识它们的工具会直接忽略。

---

## 1. 四个核心概念

| 概念 | 是什么 | 载体文件 | 类比 |
|------|--------|----------|------|
| **Agent（主 Agent）** | 系统的总入口与调度者，有全局身份和最高规则 | `.spec/AGENTS.md` | 项目负责人 |
| **SubAgent（子 Agent）** | 有明确单一职责的专职角色，被主 Agent 调度 | `.spec/agents/<name>.agent.md` | 团队里的专职成员 |
| **Skill（技能）** | 可复用的标准化操作流程 / 方法论 | `.spec/skills/<name>/SKILL.md`（扁平） | 岗位 SOP / 操作手册 |
| **上下文 .md** | 提供规则、背景、约束的纯文档 | `.spec/AGENTS.md`、目录内 `CONTEXT.md` 等 | 公司制度与项目说明书 |

它们的关系：

```
            ┌─────────────────────────┐
            │   AGENTS.md（主 Agent）  │  ← 全局规则 / 调度策略 / 身份
            └───────────┬─────────────┘
                        │ 调度（delegate）
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  planner.agent.md  coder.agent.md  reviewer.agent.md   ← 子 Agent（职能）
        │               │               │
        └──── 使用 ──────┼──── 使用 ──────┘
                        ▼
                  skills/**/SKILL.md                     ← 技能（方法）
```

---

## 1.5 渐进式披露：能力如何被加载

这是整套系统能「挂很多能力却不爆上下文」的核心机制，来自 Agent Skills 开放标准。任何 Skill / SubAgent 都按三个阶段加载：

| 阶段 | 名称 | 加载什么 | 触发时机 |
|------|------|----------|----------|
| 1 | **发现（Discovery）** | 只读每个能力的 `name` + `description` | 启动时，一次性扫描全部能力 |
| 2 | **激活（Activation）** | 把匹配到的那个能力的**完整正文**读进上下文 | 当前任务匹配某个 `description` 时 |
| 3 | **执行（Execution）** | 按正文操作，按需再加载 `references/` `scripts/` 等附属文件 | 真正干活时 |

**这条机制带来一个铁律：`description` 决定一切。** 在阶段 1，Agent 看到的只有 `name` 和 `description`——它靠这一句话判断「这个能力跟当前任务有没有关」。`description` 写得含糊，等于这个能力对 Agent 不可见。所以：

- `description` 要写清楚**「什么场景下用它」**，而不是「它是什么」。
- 推荐句式：`用于<什么情况>，做<什么事>`。例：`用于代码合并前，对改动做结构化安全与质量审查`。
- 反例：`帮助审查代码`（没说何时用、解决什么问题，Agent 无从判断）。

正文（阶段 2 才加载）可以写得很长很细，因为它只在被选中后才进上下文。**把判断信息压进 `description`，把执行细节留在正文。**

---

## 2. 目录架构

```
LumioAgent/
├── .spec/                         # 唯一权威源
│   ├── AGENTS.md                  # 主 Agent 宪法：身份、全局规则、调度策略
│   ├── SPEC.md                    # 本规范文档（唯一权威）
│   ├── ARCHITECTURE.md            # 架构图与目录索引
│   ├── agents/                    # 子 Agent 定义（一个文件一个职能）
│   ├── rules/                     # 共享规则片段（跨工具、跨 Agent）
│   ├── skills/                    # 技能库（扁平结构，一个技能一个目录）
│   └── examples/                  # 走查样板
├── AGENTS.md                      # 根入口指针 → .spec/AGENTS.md + .spec/SPEC.md
├── CLAUDE.md                      # Claude Code 入口指针 → .spec/
├── .claude/
│   ├── agents -> ../.spec/agents  # 软链接：让 Claude Code 读到同一套子 Agent
│   ├── rules -> ../.spec/rules    # 软链接：让 Claude Code 读到同一套规则片段
│   └── skills -> ../.spec/skills  # 软链接：让 Claude Code 读到同一套技能
├── .agents/
│   └── skills -> ../.spec/skills  # 软链接：让 Codex 读到同一套技能
└── README.md
```

规则：

- **一个职能 = 一个 `*.agent.md` 文件**，放在 `.spec/agents/`。
- **一个技能 = 一个目录**，目录里必须有 `SKILL.md`；`.spec/skills/` 是**扁平结构**（技能目录直接放在 `.spec/skills/` 下，不再嵌套类别目录）。逻辑分类靠 `SKILL.md` 里的 `metadata.category` 字段，不靠目录层级。
- 技能如果需要脚本 / 模板 / 参考资料，放在技能目录下的 `scripts/`、`templates/`、`references/`（可选）。
- `.spec/AGENTS.md` 是主 Agent 的真实定义；仓库根 `AGENTS.md` 只是兼容入口指针。
- `.spec/rules/` 存放共享规则片段；它不是第二份 `AGENTS.md`，只放跨工具、跨 Agent 复用的规则文件。
- **跨工具共享：** `.claude/skills` 和 `.agents/skills` 都是指向 `.spec/skills/` 的软链接，让 Claude Code 和 Codex 读到同一套技能。`.spec/skills/` 是唯一权威源；新增技能只需放进 `.spec/skills/`，两个工具自动可见，无需再动软链接。详见第 5.4 节。

---

## 3. 主 Agent 规范 —— `AGENTS.md`

`AGENTS.md` 是整个系统的「宪法」。它不描述某一个任务，而是定义**所有 Agent 都必须遵守的全局规则**和**主 Agent 如何调度子 Agent**。

### 必含章节

```markdown
# LumioAgent

## 身份与目标
LumioAgent 是一个通用开发项目管理 Agent，目标是 ……（一句话定位）

## 全局原则
- 原则 1：能力长在边缘（优先 Skill / SubAgent，不改核心）
- 原则 2：规则即文档
- 原则 3：……

## 子 Agent 名册
| 名称 | 职责 | 何时调度 |
|------|------|----------|
| planner  | 把目标拆成任务 | 任务开始、需求不清时 |
| coder    | 写代码与改代码 | 有明确任务卡时 |
| reviewer | 审查产出 | 任何代码 / 文档完成后 |

## 调度策略
- 默认流程：planner → coder → reviewer
- 谁能调度谁：只有 orchestrator 角色能再派生子 Agent
- 冲突 / 失败时如何处理：……

## 硬性规则（红线）
- 不得绕过 reviewer 直接交付
- 不得在未读相关文件前断言其行为
- ……
```

### 维护规则

- 每新增 / 删除一个子 Agent，**必须**同步更新「子 Agent 名册」表。
- `AGENTS.md` 只放「全局且稳定」的规则；某个职能特有的规则放进对应的 `*.agent.md`。

---

## 4. 子 Agent 规范 —— `agents/<name>.agent.md`

每个子 Agent 是一个独立文件，由 **frontmatter（元数据）+ 正文（行为说明）** 组成。

### Frontmatter 字段

```yaml
---
name: coder                      # 必填。小写+连字符，全局唯一
description: 根据任务卡编写和修改代码  # 必填。一句话说清职责，≤60 字
role: worker                     # 必填。orchestrator（可再派生子 Agent）| worker（纯执行）
goal: 在不破坏现有行为的前提下，交付通过测试的最小可用实现  # 必填。这个角色追求什么
skills:                          # 选填。该角色可调用的技能（对应 skills/ 下的 name）
  - test-driven-development
  - code-review
tools:                           # 选填。允许使用的工具白名单；不写表示继承默认
  - read_file
  - write_file
  - terminal
model: default                   # 选填。指定模型档位，不写则继承
version: 1.0.0                   # 必填。语义化版本
---
```

### 正文章节（按此顺序）

```markdown
# Coder（编码子 Agent）

简介：2-3 句话说明这个角色是干什么的、边界在哪。

## 职责范围
- 做什么（明确列出）

## 不做什么
- 边界（明确列出不该越界的事）

## 工作流程
1. 读任务卡和相关文件
2. ……
3. 自测后交给 reviewer

## 使用的技能
- `test-driven-development`：写代码前先写失败测试
- `code-review`：自查清单

## 交付标准
- 产出必须满足的验收条件
```

### 设计要点

- **职责单一。** 一个子 Agent 只干一类事。职责重叠就是该合并或拆分的信号。
- **`role` 决定权力边界。** `orchestrator` 可以再调度别的子 Agent；`worker` 只能干活、不能派活。这防止无限派生。
- **`goal` 是它的北极星。** 当行为有歧义时，以 `goal` 为准做取舍。

---

## 5. 技能规范 —— `SKILL.md`

技能是**可复用的标准化流程**。任何子 Agent 都能调用技能。技能本身不绑定角色。

> **兼容性声明：** LumioAgent 的 Skill 格式**兼容 agentskills 开放标准**（由 Anthropic 发起，Claude Code、Cursor、Gemini CLI、Kiro 等均支持）。这意味着：我们写的技能能被这些工具直接读取，别人写的标准技能也能拿来即用。我们在标准之上加了少量**扩展字段**（放在 `metadata` 命名空间内，不污染标准，不影响兼容）。

### 5.1 渐进式披露（Progressive Disclosure）—— 为什么 `description` 是命脉

agentskills 标准的核心机制。Agent 加载技能分三个阶段，每个阶段才读更多内容：

1. **发现（Discovery）** — 启动时，Agent **只**读取每个技能的 `name` 和 `description`，刚好够它判断「这个技能何时可能有用」。
2. **激活（Activation）** — 当某个任务匹配上某个 `description`，Agent 才把那个技能的 `SKILL.md` **全文**读进上下文。
3. **执行（Execution）** — Agent 按 SKILL.md 指令执行，**按需**再加载 `scripts/`、`references/`、`templates/` 里的文件。

**含义（直接决定我们怎么写技能）：**

- `description` 是技能在「发现」阶段唯一可见的东西。写不好 = 技能不存在，因为 Agent 永远不会激活它。
- 把重内容（长流程、参考资料、脚本）拆到 `references/` 等子目录，让 `SKILL.md` 主体保持轻量——只有真正用到时才付出上下文代价。
- 这就是为什么可以「手握上百个技能而上下文几乎不涨」：没被激活的技能只占两行（name + description）。

### 5.2 Frontmatter 字段

```yaml
---
# ── 标准字段（agentskills 标准，保证跨工具兼容）──
name: code-review                # 必填。小写+连字符，全局唯一，≤64 字
description: 用于在代码合并前进行结构化审查  # 必填。≤1024 字，建议以「用于…」开头

# ── 我们的扩展字段（全部收进 metadata，不破坏标准兼容）──
metadata:
  version: 1.0.0                 # 必填（我们的约定）。语义化版本
  author: LumioAgent             # 选填
  license: MIT                   # 选填
  category: software-development # 必填（我们的约定）。逻辑分类，不对应目录层级
  tags: [review, quality]        # 选填
  related_skills:                # 选填。关联技能，便于发现
    - test-driven-development
---
```

> **为什么扩展字段放进 `metadata`：** agentskills 标准只强制 `name` 和 `description`，对其他字段不做约束。把我们的私有字段统一收进 `metadata` 命名空间，标准校验器会原样忽略它们——这样技能既符合标准、能被任何兼容工具加载，又保留了我们调度和归类需要的信息。**绝不**在顶层乱加非标准字段。

frontmatter 硬性要求（创建时会被校验）：

- 文件**第一个字节**就是 `---`，前面不能有空行 / BOM。
- 必须是合法 YAML 映射，且含 `name` 与 `description`（标准要求）。
- 必须有非空正文。
- 单个 `SKILL.md` 建议 ≤ 20k 字符；超出就把细节拆到同目录 `references/*.md`（见 5.1 渐进式披露）。

### 5.3 技能目录结构（兼容标准）

```
skills/<name>/
├── SKILL.md          # 必需：元数据 + 指令
├── scripts/          # 可选：可执行脚本
├── references/       # 可选：扩展文档（从 SKILL.md 拆出的细节）
├── templates/        # 可选：模板、资源
└── ...               # 其他任意文件
```

这与 agentskills 标准的技能布局完全一致：**`<name>/SKILL.md` 直接挂在 `.spec/skills/` 下，中间不嵌套类别目录**。类别由 frontmatter 的 `metadata.category` 承担逻辑分类，不靠目录层级。

> **为什么扁平、不按目录分类：** Claude Code（`.claude/skills/`）和 Codex（`.agents/skills/`）都按**扁平方式**扫描技能——它们期望 `<skills根>/<name>/SKILL.md`，中间多一层类别目录会让它们把类别名当成技能名而找不到 `SKILL.md`。扁平结构是兼容这两个工具（见 5.4）的前提。逻辑分类不丢，它在 `metadata.category` 里。

### 正文章节（固定顺序）

```markdown
# Code Review（代码审查）

2-3 句话说明这个技能解决什么问题。

## 何时使用
- 列出触发场景（什么时候该用这个技能）

## 前置条件
- 运行前需要满足什么（如：已有可运行的测试）

## 操作步骤
1. 第一步
2. 第二步
3. ……

## 快速参考
- 高频命令 / 检查项的速查表

## 注意事项（Pitfalls）
- 常见错误与规避方式

## 验证
- 怎么确认这个技能执行成功了（验收清单）
```

### 设计要点

- **技能是「方法」，不是「角色」。** 写技能时不要假设谁来用它。
- **`description` 要具体。** 写「用于在代码合并前做结构化审查」，不要写「帮助审查代码」这种泛泛的话——`description` 是别人决定要不要用它的唯一依据。
- **分类靠 `metadata.category`，不靠目录。** 想按类别归类时，写进 frontmatter 的 `metadata.category`，目录始终保持扁平（见 5.3、5.4）。

### 5.4 跨工具共享：让 Claude Code 与 Codex 读到同一套技能

LumioAgent 的技能权威源**只有一处**：`.spec/skills/`。Claude Code 和 Codex 各自约定的技能目录通过**软链接（symlink）**指向它，从而三方共享同一套技能、永不分叉。

| 工具 | 它扫描的技能目录 | 我们的处理 |
|------|------------------|-----------|
| LumioAgent（权威源） | `.spec/skills/` | 真实文件存放处 |
| Claude Code | `.claude/skills/` | 软链接 → `../.spec/skills` |
| Codex | `.agents/skills/` | 软链接 → `../.spec/skills` |

```
.claude/skills  ─┐
                 ├─→  .spec/skills/   （唯一权威源）
.agents/skills  ─┘
```

规则：

- **只在 `.spec/skills/` 下增删改技能。** 两个软链接是只读视角，不要在 `.claude/skills/` 或 `.agents/skills/` 里直接建技能——那样会绕过权威源、造成分叉。
- **软链接用相对路径**（`../.spec/skills`），保证仓库被 clone 到任何位置都不断链。
- **新增技能自动对两个工具可见**，无需再补任何链接——因为链接的是整个 `skills/` 目录，不是单个技能。
- 软链接是仓库的一部分，**需要提交到版本控制**。Git 原生支持记录 symlink。
- 这套机制成立的前提是技能目录**扁平**（见 5.3）：三方都期望 `<根>/<name>/SKILL.md` 的布局。

---

## 6. 上下文 `.md` 文件规范

除了上述三类「有结构」的文件，系统里还有纯说明性的上下文文件，用来给 Agent 提供**规则和背景**。

| 文件 | 作用域 | 内容 |
|------|--------|------|
| `.spec/AGENTS.md` | 全局 | 主 Agent 宪法（见第 3 节） |
| `.spec/rules/*.md` | 跨工具 / 跨 Agent | 共享规则片段，不放身份、调度和技能流程 |
| 目录内 `CONTEXT.md`（可选） | 该目录 | 这个子项目 / 模块的局部规则、技术栈、约定 |
| `references/*.md`（技能内） | 该技能 | 技能的扩展说明，从 SKILL.md 拆出来的细节 |

规则：

- 上下文 `.md` 是**给人和 Agent 同时读**的，语言要直接、可执行。
- 共享规则放进 `.spec/rules/`；Codex 通过根 `AGENTS.md` 指针读取，Claude Code 通过 `.claude/rules` 软链接读取。
- 局部规则放在离它最近的目录里（就近原则），不要全堆进 `.spec/AGENTS.md`。
- 上下文文件**不含 frontmatter**，就是普通 Markdown。

---

## 7. 生命周期：如何创建 / 更新 / 维护

### 7.1 新增一个子 Agent

1. 确认现有子 Agent 真的覆盖不了这个职责（避免重复）。
2. 在 `.spec/agents/` 下新建 `<name>.agent.md`，按第 4 节填 frontmatter 和正文。
3. 在 `.spec/AGENTS.md` 的「子 Agent 名册」里加一行。
4. 如果它需要新方法，再去新增对应的 Skill（见下）。

### 7.2 新增一个技能

1. 先翻一遍 `.spec/skills/` 下已有技能，确认没有重复（`grep` 一下 `name:` 即可）。
2. 在 `.spec/skills/<name>/` 下建 `SKILL.md`（扁平，不再嵌 category 目录）。
3. 按第 5 节写 frontmatter（注意第一个字节是 `---`），把 `category` 写进 `metadata.category`，再写固定章节正文。
4. 需要脚本 / 模板 / 长参考时，放进同目录 `scripts/` `templates/` `references/`。
5. 在用得上它的子 Agent 的 `skills:` 列表里登记。
6. **无需**手动建软链接——`.claude/skills` 和 `.agents/skills` 整目录指向 `.spec/skills/`，新技能自动对 Claude Code 和 Codex 可见（见 5.4 节）。

### 7.3 更新已有定义

- **改了行为 / 流程** → 升 `version`（语义化版本）：
  - 不兼容的大改 → 主版本号 +1（如 1.x → 2.0.0）
  - 向后兼容地加能力 → 次版本号 +1（如 1.0 → 1.1.0）
  - 修措辞 / 补例子 → 修订号 +1（如 1.0.0 → 1.0.1）
- 改动若影响调度关系，**必须**同步更新 `AGENTS.md` 的名册或调度策略。

### 7.4 废弃 / 删除

- 不要直接删。先在 frontmatter 加 `deprecated: true` 并在正文顶部写明替代方案。
- 确认没有任何 `*.agent.md` 的 `skills:` 或 `AGENTS.md` 还引用它，再删除文件。

---

## 8. 维护准则（给维护者和 Agent 自己）

1. **单一权威。** 同一条规则只在一个地方定义。全局规则在 `.spec/AGENTS.md`，共享规则片段在 `.spec/rules/*.md`，职能规则在对应 `.spec/agents/*.agent.md`，方法在 `.spec/skills/*/SKILL.md`。发现重复就合并。
2. **改定义先验证现状。** 在把某事称为「缺陷」并修改前，先读相关文件确认它不是有意设计。
3. **名册永远准确。** `AGENTS.md` 的子 Agent 名册、各子 Agent 的 `skills:` 列表，必须和实际文件一致。这是系统能正确调度的前提。
4. **描述决定可发现性。** `description` 写不好，等于这个能力不存在——没人（包括 Agent）会去用一个看不懂用途的东西。
5. **能力长在边缘。** 想加新功能时，先问「这能不能做成一个 Skill 或 SubAgent？」，把改核心当作最后手段。

---

## 9. 命名规约（速查）

| 对象 | 规则 | 示例 |
|------|------|------|
| 子 Agent 文件 | `<name>.agent.md`，name 小写+连字符 | `code-reviewer.agent.md` |
| 技能目录 | `skills/<name>/`（扁平，无 category 层） | `skills/code-review/` |
| 技能文件 | 固定为 `SKILL.md`（大写） | `SKILL.md` |
| name 字段 | 小写字母 + 连字符，全局唯一 | `task-breakdown` |
| version 字段 | 语义化版本 `主.次.修订` | `1.2.0` |

---

*本规范是 LumioAgent 的根约定。任何对 Agent / SubAgent / Skill / 上下文文件的改动，都应先符合本文。*
