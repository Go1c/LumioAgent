# LumioAgent

一个**通用的开发项目管理 Agent**。主 Agent 负责理解目标、拆解任务、调度；不同职能的子 Agent 负责执行；技能（Skill）是可复用的方法；`.md` 文件是规则。

`.spec/` 是唯一权威目录。Codex、Claude 和根目录入口都只是指针，最终都指向 `.spec/` 里的同一套规范。

> 一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

## 它怎么工作

- **主 Agent**（`.spec/AGENTS.md`）是系统宪法与总调度者，即宿主的主对话循环（主 loop）本身。
- **子 Agent**（`.spec/agents/*.agent.md`）是有单一职责的专职角色（planner / coder），由主 loop 调用、只执行、不再派活。
- **技能**（`.spec/skills/<name>/SKILL.md`）是可复用的标准化流程，任何子 Agent 都能调用。
- 能力按 **渐进式披露** 加载：平时只占「名字 + 描述」两行，任务匹配时才加载全文，所以可以挂很多能力而不爆上下文。

Skill 格式**兼容 [Agent Skills 开放标准](https://agentskills.io)**（Anthropic 发起，Claude Code / Cursor / Gemini CLI / Kiro 等均支持），我们的私有字段收在 `metadata` 命名空间内，不破坏兼容。

## 仓库地图

```
LumioAgent/
├── .spec/                    # 唯一权威源
│   ├── AGENTS.md             # ★ 唯一中心文档：宪法 + 总览 + 全局规则 + 调度，先读它
│   ├── agents/               # 子 Agent 定义（一个文件一个职能）
│   ├── rules/                # Agent 护栏 / 禁令（跨工具、跨 Agent）
│   ├── knowledge/            # 项目知识库（standards 规范支 + features 功能支）
│   └── skills/               # 技能库，扁平结构，一个技能一个目录
├── AGENTS.md                 # 根入口指针 → .spec/AGENTS.md
├── CLAUDE.md                 # Claude Code 入口指针 → .spec/
├── .claude/
│   ├── agents -> ../.spec/agents
│   ├── rules -> ../.spec/rules
│   └── skills -> ../.spec/skills
├── .agents/
│   └── skills -> ../.spec/skills
└── README.md
```

## 从哪开始读

1. **[.spec/AGENTS.md](.spec/AGENTS.md)** —— 唯一中心文档：四概念、原则、渐进式披露、子 Agent 名册、调度、红线、命名。**先读它，任何改动都先符合它。**
2. **[.spec/skills/README.md](.spec/skills/README.md)** / **[.spec/knowledge/README.md](.spec/knowledge/README.md)** / **[.spec/rules/README.md](.spec/rules/README.md)** —— 各类文件的详细写法与维护规范（按需查）。
3. `.spec/agents/` 和 `.spec/skills/` —— 看具体职能和技能的实现样例。

## 怎么扩展

- **加 / 改一个职能、技能或知识** → 用 `spec-steward` 技能照着做：它保证放对位置、frontmatter 合规、索引 / 名册同步。
- 各类文件的格式规范见对应目录的 `README.md`（子 Agent 写法在 `AGENTS.md` 第 7 节）。

> 当前仓库内容均为规范与定义文档（`.md`），尚未包含运行时代码。
