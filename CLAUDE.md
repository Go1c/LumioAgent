# CLAUDE.md

Claude Code 入口。中心文档（宪法 + 总览 + 全局规则 + 调度）通过下面这行**强制加载**——它是唯一权威源，本文件不另立规则。

@.spec/AGENTS.md

Claude 特有：

- 子 Agent、技能、护栏通过软链接暴露：`.claude/agents -> ../.spec/agents`、`.claude/skills -> ../.spec/skills`、`.claude/rules -> ../.spec/rules`。
- 不要在此维护任何 Claude 专属规则。行为变了就改 `.spec/`，本文件只当指针。
