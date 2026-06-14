# Rules（共享规则）

本目录存放 **Agent 护栏 / 禁令（guardrails）**：所有硬性的「**不得 / 禁止**」约束，统一归这里。两类都算：

1. **能力护栏**——禁止 Agent 访问 / 搜索 / 修改 / 提交某物。
2. **协作 / 调度禁令**——禁止某些 Agent 协作行为（如「子 Agent 不得再派生子 Agent」「frontmatter 只用 name+description」）。

这里的规则属于 `.spec/`，因此是 LumioAgent 的权威规范组成部分。它适合存放稳定的、跨工具、跨 Agent、**与具体任务无关**的禁令。

判据很简单——**rules 回答「禁止 / 只能怎样」，不回答「怎么做 / 是什么」。**

- ✅ 属于 rules：不准 push 到 `main`、不准提交 `secrets/`、不准修改 `vendor/`、不准搜索 / 外发某类数据；子 Agent 不得再派生子 Agent、frontmatter 只用 name+description。
- ❌ 不属于 rules：开发流程 / 规范（怎么开分支、提交、合并、注释、TDD、验收）放 `knowledge/standards/`；系统怎么运转、原则、调度**机制**放 `AGENTS.md`。

## 如何使用

- Codex 通过根 `AGENTS.md` 指针读取这些规则。
- Claude Code 通过 `.claude/rules -> ../.spec/rules` 读取同一套规则。
- 其他工具也必须指向这里，不能维护自己的副本。
- Codex 用户级授权规则（如 `~/.codex/rules/*.rules`）不是项目行为规则，不能替代本目录。

## 边界

- 全局机制（怎么调度、名册、原则）在 `.spec/AGENTS.md`；它们的**硬性禁令**在本目录（`agent-collaboration.md`）。
- **开发流程 / 规范（怎么开分支、提交、合并、注释、TDD、验收）放在 `.spec/knowledge/standards/`，不放这里。**
- 项目知识（设计、记录）放在 `.spec/knowledge/`。
- 可复用方法放在 `.spec/skills/<name>/SKILL.md`。
- 角色特定行为放在 `.spec/agents/<name>.agent.md`。
- 本目录只放多个 Agent 或多个工具都需要遵守的**护栏 / 禁令**片段。

## 命名

一个主题一个文件（名字体现“禁止什么”）：

```text
rules/
├── README.md
├── agent-collaboration.md  # 协作 / 调度禁令（不得再派生子Agent、frontmatter 限制等）
├── protected-paths.md      # 禁止修改 / 提交的目录与文件
├── secrets.md              # 密钥 / 敏感数据的禁止项
└── git-guardrails.md       # 禁止的 git 操作（如直接 push 受保护分支）
```

不要在 `.claude/` 或 `.agents/` 下新增工具专属规则文件；要新增或修改规则，就改这里的源文件。

## 强制还是约定

当前这些护栏是**约定**——靠主 loop 和子 Agent 自觉遵守，宿主不替我们硬性执行（符合本项目「约定为主、runtime 暂缓」的定位）。

真正的**硬强制**（让“禁止”在机制上做不到）留到后续的自动化阶段，第一步通常是：

- `.gitignore`：从源头挡住 secrets / 不该提交的目录被提交。
- pre-commit 钩子 / 工具权限 deny：拦截受保护分支、受保护路径的写入。

在那之前，把护栏写清楚、可执行，就是它现在能起的最大作用。
