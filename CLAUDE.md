# CLAUDE.md

Claude Code entrypoint.

**本仓库既是 LumioAgent 插件本体,也是使用它的项目(dogfood)。** 两个身份的边界:

- **插件资产**(随版本分发,装进别的项目):`skills/`、`agents/`、`commands/`、`hooks/`、`rules/`、`references/`、`templates/`、`tools/`、两份清单。
- **项目实例数据**(只属于本仓):`.spec/` —— 由 `templates/` 经 `/lumio:init` 生成,内容与任何下游项目同构。

通用规程(调度核心 / 编码约定 / 硬红线)由插件的 SessionStart hook 每次会话注入 `rules/*.md`,**本文件不再用 `@import` 载入它们**——新增规则文件放进 `rules/` 即自动生效,没有登记表可漏。

开发本插件时的实时加载:把 `~/.claude/skills/lumio` 软链到本仓,即以 `lumio@skills-dir` 自动加载。

<!-- lumio:init -->
## LumioAgent

本项目使用 LumioAgent 插件的调度与编码规程。项目自身的定位、收口门槛与知识导航见:

- [`.spec/AGENTS.md`](.spec/AGENTS.md) —— 项目中心文档(先读)
- [`.spec/knowledge/README.md`](.spec/knowledge/README.md) —— 知识导航
- [`.spec/decisions/`](.spec/decisions/README.md) —— 决策唯一落点(ADR)

> 通用规程与硬红线由插件在每次会话注入(Claude Code);无此机制的宿主请主动读取上述文件。
