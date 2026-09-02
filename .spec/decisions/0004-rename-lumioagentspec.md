# 0004 · 仓库与品牌改名 LumioAgentSpec，marketplace 标识同步改为 lumioagentspec

- 日期:2026-09-02
- 状态:生效

## 背景

1.0.0 发布时仓库与品牌名为 LumioAgent。名字只说了「Agent」,没有表达框架的核心——它交付的不是运行时代码,而是**规范**:常驻规则、收口门槛、审查规程与 `.spec/` 项目实例。对外展示(README 双语重写)时需要一个能自解释的名字。

同时存在一个不一致:marketplace 标识 `lumioagent` 与仓库名绑定,改仓库名而不改标识,安装命令 `lumio@lumioagent` 会与仓库名 `LumioAgentSpec` 对不上。

## 决策

1. GitHub 仓库改名为 `Go1c/LumioAgentSpec`;全部 URL(两份插件清单、marketplace.json、CHANGELOG、`.spec/` 与下发模板)随之更新。
2. 品牌名在全部文档、模板、工具注释与注入文案中统一为 LumioAgentSpec。
3. marketplace 标识 `lumioagent` → `lumioagentspec`,`package.json` 的 name 同步。
4. **不改**:插件 id `lumio`、`/lumio:init` `/lumio:lint` `lumio:<skill>` 调用方式、指针标记 `<!-- lumio:init -->`、tag 前缀 `lumio--v`。这些是用户侧的稳定接口,与品牌名解耦。
5. **不改**:已生效 ADR 与历史计划中的旧名(记录不改写)、`tests/spec-lint.test.mjs` 假项目 fixture 字符串、本地目录名与 `.claude/settings.local.json` 中的本地绝对路径。

## 后果

- 已安装 1.0.0 的用户需要重新 `claude plugin marketplace add Go1c/LumioAgentSpec` 并以 `lumio@lumioagentspec` 重装;旧 marketplace 条目依赖 GitHub 的 URL 重定向,能继续拉取但标识已废弃。写进 CHANGELOG 升级指引。
- 不发新版本号:改名不改变任何技能、规则或工具行为,归入下一版本的 Changed。
- 本地目录仍叫 `LumioAgent`,与远端名不一致,属开发者本机状态,不影响任何产物。
