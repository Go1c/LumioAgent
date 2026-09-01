# 0001 · 以双标准 Agent 插件分发，规则改由 SessionStart hook 注入

- 日期:2026-09-01
- 状态:部分被 [0002](0002-plugin-subdir.md) 取代——仅「仓库根即插件根」一条,其余决策继续有效

## 背景

原分发模型是「把整个仓库复制进你的项目，再按 README 的 4 步裁剪」。三个问题：升级要人肉 diff；每个下游项目持有一份会漂移的方法论副本；框架资产（技能、reviewer、红线）与项目实例数据（knowledge / decisions / tasks）混在同一棵 `.spec/` 树里，无法分别演进。

同期出现两个可用的标准：[Agent Plugins 1.0.0](https://agent-plugins.org/)（2026-08-06 发布，六个客户端支持）定义了可移植的技能与 MCP 打包格式；Claude Code 有自己的插件格式，覆盖子 Agent、slash command 与 hook。两者的清单文件同名不同位（根 `plugin.json` vs `.claude-plugin/plugin.json`）。

## 决策

1. **仓库根即插件根**，双清单并存：根 `plugin.json` 走 Agent Plugins（技能层跨客户端可移植），`.claude-plugin/plugin.json` 走 Claude Code（子 Agent / 命令 / hook 生效）。四方版本号（两份清单 + `package.json` + `CHANGELOG.md`）由测试锁死。
2. **按「换个项目还成立吗」切分**：成立的进插件，不成立的留项目 `.spec/`，后者由 `/lumio:init` 从 `templates/` 释放。
3. **红线改由 SessionStart hook 注入**。实测 Claude Code 的规则来源类型只有 `User / Project / Local / Managed`，无 `Plugin`——插件无法沿用 `CLAUDE.md` 的 `@import`。注入脚本 **glob `rules/*.md`** 而非逐文件登记，使原「@import 完整性」校验项结构性消失：没有登记表就没有漂移。
4. **lint 拆两支**：`plugin-lint` 校验插件自身，`spec-lint` 校验项目实例并随插件分发。不拆则下游项目会被插件自身的结构校验项误伤。
5. **规则正文用裸技能名**，不硬编码 `lumio:` 前缀——Claude Code 按裸名匹配得到，而硬编码会破坏其他客户端直接加载 `skills/` 的可移植性。

## 后果

- **接受跨客户端能力不对等**：Agent Plugins v1 明确把 agents / commands / hooks / rules 排除在可移植层外。Codex / Cursor 只能拿到技能层，红线靠 `/lumio:init` 写进项目入口文件兜底，子 Agent 退化为主 loop 自审（丧失「写 ≠ 审」独立性，属已知降级）。
- **知识导航不再常驻**。插件化前 `knowledge/README.md` 经 `@import` 每次会话载入；现在只有 `rules/*.md` 常驻，导航靠项目入口文件的指针按需下钻。省掉每会话的固定开销，代价是 Agent 需多一步才能知道有哪些规范。
- **hook 是可执行配置**，安装方须信任插件来源；相应地，改动 hook 永不适用快速模式收口。
- 三条符号链接（`.claude/agents`、`.claude/skills`、`.agents/skills`）与 `.claude/settings.json` 的内联 hook 一并删除，后者拆成 `tools/guard-commit.mjs` 并补了测试。
