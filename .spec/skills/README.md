# 技能规范 —— 怎么写一个 Skill

> 本目录是 LumioAgent 的技能库（唯一权威源）。技能是**可复用的标准化流程 / 方法论**，任何子 Agent 都能调用，本身不绑定角色。
> 全局心智（四概念、渐进式披露）见 [`../AGENTS.md`](../AGENTS.md)；新增 / 维护的操作流程见 `spec-steward` 技能。

**兼容性：** 本仓库 Skill 格式**兼容 [Agent Skills 开放标准](https://agentskills.io)**（Anthropic 发起，Claude Code / Cursor / Gemini CLI / Kiro 等支持）。我们的私有字段全部收进 `metadata` 命名空间，不破坏兼容——不认识它们的工具会直接忽略。

## 1. 渐进式披露 —— 为什么 `description` 是命脉

技能分三阶段加载：

1. **发现** — 启动时只读每个技能的 `name` + `description`。
2. **激活** — 任务匹配上某个 `description`，才把该 `SKILL.md` 全文读进上下文。
3. **执行** — 按指令操作，**按需**再加载 `scripts/` `references/` `templates/`。

**含义：** `description` 是发现阶段唯一可见的东西，写不好 = 技能不存在。把重内容拆到 `references/` 等子目录，让 `SKILL.md` 主体保持轻量。

## 2. Frontmatter 字段

```yaml
---
# ── 标准字段（agentskills 标准，跨工具兼容）──
name: task-breakdown             # 必填。小写+连字符，全局唯一，≤64 字
description: 用于需求不清时，把模糊目标拆成带验收标准的任务卡  # 必填。≤1024 字，建议以「用于…」开头

# ── 扩展字段（全部收进 metadata，不破坏兼容）──
metadata:
  version: 1.0.0                 # 必填（我们的约定）。语义化版本
  author: LumioAgent             # 选填
  license: MIT                   # 选填
  category: software-development # 必填（我们的约定）。逻辑分类，不对应目录层级
  tags: [planning, tasks]        # 选填
  related_skills:                # 选填。关联技能，便于发现
    - test-driven-development
---
```

硬性要求（创建时会被校验）：

- 文件**第一个字节**就是 `---`，前面不能有空行 / BOM。
- 合法 YAML 映射，且含 `name` 与 `description`。
- 必须有非空正文。
- 单个 `SKILL.md` 建议 ≤ 20k 字符；超出就把细节拆到同目录 `references/*.md`。
- **绝不**在顶层乱加非标准字段——私有字段一律进 `metadata`。

## 3. 目录结构（扁平，兼容标准）

```
skills/<name>/
├── SKILL.md          # 必需：元数据 + 指令
├── scripts/          # 可选：可执行脚本
├── references/       # 可选：从 SKILL.md 拆出的长细节
├── templates/        # 可选：模板、资源
└── ...
```

`<name>/SKILL.md` **直接挂在 `.spec/skills/` 下，中间不嵌套类别目录**。类别由 `metadata.category` 承担，不靠目录层级——因为 Claude Code / Codex 都按扁平方式扫描技能（期望 `<根>/<name>/SKILL.md`），多一层类别目录会让它们找不到 `SKILL.md`。

## 4. 正文章节（固定顺序）

```markdown
# Task Breakdown（任务拆解）

2-3 句话说明这个技能解决什么问题。

## 何时使用
## 前置条件
## 操作步骤
## 快速参考
## 注意事项（Pitfalls）
## 验证
```

## 5. 设计要点

- **技能是「方法」，不是「角色」。** 写技能时不要假设谁来用它。
- **`description` 要具体。** 写「用于需求不清时，把模糊目标拆成带验收标准的任务卡」，不要写「帮助拆任务」。
- **分类靠 `metadata.category`，不靠目录。**
- **更新升 `version`**（语义化）：不兼容大改 → 主版本 +1；兼容加能力 → 次版本 +1；改措辞 → 修订 +1。
- **废弃**：先在 frontmatter 加 `deprecated: true` 并在正文顶部写明替代方案，确认无人引用再删。

## 6. 跨工具共享（软链接）

技能权威源**只有一处**：`.spec/skills/`。两个工具的技能目录通过相对路径软链接指向它：

| 工具 | 扫描目录 | 处理 |
|------|----------|------|
| LumioAgent（权威源） | `.spec/skills/` | 真实文件 |
| Claude Code | `.claude/skills/` | 软链接 → `../.spec/skills` |
| Codex | `.agents/skills/` | 软链接 → `../.spec/skills` |

- **只在 `.spec/skills/` 下增删改**；两个软链接是只读视角，别在那里直接建技能。
- **新增技能自动对两个工具可见**，无需补链接（链的是整个目录）。
- 软链接是仓库的一部分，需提交到版本控制。
