# CLAUDE.md

Claude Code entrypoint.

**本仓库既是 LumioAgent 插件本体,也是使用它的项目(dogfood)。** 两个身份的边界:

- **发布面 = `plugin/`**:装进用户机器的就是这个目录的全部内容(`skills/` `agents/` `commands/` `hooks/` `rules/` `references/` `templates/` `tools/` + 清单 + LICENSE)。marketplace 用 `git-subdir` 只拉这一层。
- **开发面 = 仓库根**:`.spec/`(本仓自己的项目实例)、`tests/`、`package.json`、CI —— **一律不下发**。往 `plugin/` 里放开发文件会被 plugin-lint 拦下。

通用规程(调度核心 / 编码约定 / 硬红线)由插件的 SessionStart hook 每次会话注入 `rules/*.md`,**本文件不再用 `@import` 载入它们**——新增规则文件放进 `rules/` 即自动生效,没有登记表可漏。

开发本插件时的实时加载:把 `~/.claude/skills/lumio` 软链到本仓的 **`plugin/`**(不是仓库根),即以 `lumio@skills-dir` 自动加载,改动立即生效、无需重装。

<!-- lumio:init -->
## LumioAgent

本项目使用 LumioAgent 插件的调度与编码规程。项目自身的定位、收口门槛与知识导航见:

- [`.spec/AGENTS.md`](.spec/AGENTS.md) —— 项目中心文档(先读)
- [`.spec/knowledge/README.md`](.spec/knowledge/README.md) —— 知识导航
- [`.spec/decisions/`](.spec/decisions/README.md) —— 决策唯一落点(ADR)

> 通用规程与硬红线由插件在每次会话注入(Claude Code);无此机制的宿主请主动读取上述文件。
