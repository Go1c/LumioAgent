# CLAUDE.md

Claude Code 入口。下面的 `@import` 行把内容**强制加载**进每次会话上下文——权威源是 `.spec/`，本文件只负责加载，不另立规则。

中心文档（概念 + 原则 + 调度）：

@.spec/AGENTS.md

硬性禁令 / 护栏（**始终在场，不走渐进式披露**——它们是硬红线，必须一上来就在上下文里）：

@.spec/rules/agent-collaboration.md

> **维护**：`rules/` 下每新增一个具体规则文件，都要在上面补一行 `@.spec/rules/<file>.md`，否则它不会被强制加载。`README.md` 是说明文档，不导入。

Claude 特有：

- 子 Agent、技能、护栏通过软链接暴露：`.claude/agents -> ../.spec/agents`、`.claude/skills -> ../.spec/skills`、`.claude/rules -> ../.spec/rules`。
- 不要在此维护任何 Claude 专属规则。行为变了就改 `.spec/`，本文件只当指针。
