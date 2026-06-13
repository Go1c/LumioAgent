# Rules（共享规则）

本目录存放可复用的项目规则文档。

这里的规则属于 `.spec/`，因此是 LumioAgent 的权威规范组成部分。它适合存放稳定的、跨工具、跨 Agent 的约束：这些规则比 `.spec/AGENTS.md` 更具体，但又不属于某一个 Skill 或某一个 SubAgent。

## 如何使用

- Codex 通过根 `AGENTS.md` 指针读取这些规则。
- Claude Code 通过 `.claude/rules -> ../.spec/rules` 读取同一套规则。
- 其他工具也必须指向这里，不能维护自己的副本。
- Codex 用户级授权规则（如 `~/.codex/rules/*.rules`）不是项目行为规则，不能替代本目录。

## 边界

- 全局身份、调度策略、硬性红线放在 `.spec/AGENTS.md`。
- 可复用方法放在 `.spec/skills/<name>/SKILL.md`。
- 角色特定行为放在 `.spec/agents/<name>.agent.md`。
- 本目录只放多个 Agent 或多个工具都需要遵守的共享规则片段。

## 命名

一个主题一个文件：

```text
rules/
├── README.md
├── naming.md
├── security.md
└── release.md
```

不要在 `.claude/` 或 `.agents/` 下新增工具专属规则文件；要新增或修改规则，就改这里的源文件。
