# LumioAgent

一个**通用的开发项目管理 Agent**。主 Agent 负责理解目标、拆解任务、调度；不同职能的子 Agent 负责执行；技能（Skill）是可复用的方法；`.md` 文件是规则。

`.spec/` 是唯一权威目录。Codex、Claude 和根目录入口都只是指针，最终都指向 `.spec/` 里的同一套规范。

> 一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

## 它怎么工作

- **主 Agent**（`.spec/AGENTS.md`）是系统宪法与总调度者。
- **子 Agent**（`.spec/agents/*.agent.md`）是有单一职责的专职角色，分 `orchestrator`（可再派活）和 `worker`（只干活）两级。
- **技能**（`.spec/skills/<name>/SKILL.md`）是可复用的标准化流程，任何子 Agent 都能调用。
- 能力按 **渐进式披露** 加载：平时只占「名字 + 描述」两行，任务匹配时才加载全文，所以可以挂很多能力而不爆上下文。

Skill 格式**兼容 [Agent Skills 开放标准](https://agentskills.io)**（Anthropic 发起，Claude Code / Cursor / Gemini CLI / Kiro 等均支持），我们的私有字段收在 `metadata` 命名空间内，不破坏兼容。

## 仓库地图

```
LumioAgent/
├── .spec/                    # 唯一权威源
│   ├── AGENTS.md             # 主 Agent 宪法：身份、全局规则、调度策略
│   ├── SPEC.md               # ★ 唯一权威规范，先读它
│   ├── ARCHITECTURE.md       # 思维导图 + 目录架构图
│   ├── agents/               # 子 Agent 定义（一个文件一个职能）
│   ├── rules/                # 共享规则片段（跨工具、跨 Agent）
│   ├── skills/               # 技能库，扁平结构，一个技能一个目录
│   └── examples/             # 走查样板
├── AGENTS.md                 # 根入口指针 → .spec/AGENTS.md + .spec/SPEC.md
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

1. **[.spec/SPEC.md](.spec/SPEC.md)** —— 唯一权威规范。定义 Agent / SubAgent / Skill / 上下文文件分别是什么、长什么样、怎么创建 / 更新 / 维护。**任何改动都先以它为准。**
2. **[.spec/AGENTS.md](.spec/AGENTS.md)** —— 看系统当前有哪些子 Agent、默认怎么调度。
3. **[.spec/rules/](.spec/rules/)** —— 看跨工具、跨 Agent 的共享规则片段。
4. `.spec/agents/` 和 `.spec/skills/` —— 看具体职能和技能的实现样例。

## 怎么扩展

- **加一个职能** → 在 `.spec/agents/` 新建 `<name>.agent.md`，并在 `.spec/AGENTS.md` 的子 Agent 名册登记。（见 SPEC 第 7.1 节）
- **加一个技能** → 在 `.spec/skills/<name>/` 新建 `SKILL.md`，在用得上它的子 Agent 的 `skills:` 列表登记。（见 SPEC 第 7.2 节）

> 当前仓库内容均为规范与定义文档（`.md`），尚未包含运行时代码。
