# Changelog

本文件记录 LumioAgent 的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0]

结构破坏性变更：从「复制进项目的模板仓库」改为**双标准 Agent 插件**。

### Added

- 根 `plugin.json` —— 遵循 [Agent Plugins 1.0.0](https://agent-plugins.org/)，技能层对 Codex / Cursor / Copilot / VS Code 等客户端可移植。
- `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` —— Claude Code 侧清单，使 agents / commands / hooks 生效。
- `tests/agent-plugins-conformance.test.mjs` —— 机械校验规范合规与双清单一致。

### Changed

- 技能与子 Agent 从 `.spec/` 上移到插件根的 `skills/` 与 `agents/`。

[1.0.0]: https://github.com/Go1c/LumioAgent/releases/tag/lumio--v1.0.0
