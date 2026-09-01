# LumioAgent Entry

遵循 [AGENTS.md 开放标准](https://agents.md/) 的入口文件,供不读 `CLAUDE.md` 的客户端使用。

**本仓库既是 LumioAgent 插件本体,也是使用它的项目。** 插件按 [Agent Plugins 1.0.0](https://agent-plugins.org/) 打包:
技能层(`skills/`)跨客户端可移植;子 Agent、slash command 与 hook 是 Claude Code 专有层(规范 v1 不覆盖)。

**没有 SessionStart hook 的宿主请主动读这两份常驻规则**——Claude Code 由插件自动注入,其他客户端拿不到:

1. [`rules/system.md`](rules/system.md) —— 硬红线:协作禁令与安全护栏。
2. [`rules/dispatch.md`](rules/dispatch.md) —— 调度核心、编码约定、交回物格式、宿主差异。

<!-- lumio:init -->
## LumioAgent

本项目使用 LumioAgent 插件的调度与编码规程。项目自身的定位、收口门槛与知识导航见:

- [`.spec/AGENTS.md`](.spec/AGENTS.md) —— 项目中心文档(先读)
- [`.spec/knowledge/README.md`](.spec/knowledge/README.md) —— 知识导航
- [`.spec/decisions/`](.spec/decisions/README.md) —— 决策唯一落点(ADR)

> 通用规程与硬红线由插件在每次会话注入(Claude Code);无此机制的宿主请主动读取上述文件。
