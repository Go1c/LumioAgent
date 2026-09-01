# 项目中心文档

本项目使用 [LumioAgent](https://github.com/Go1c/LumioAgent) 插件提供的调度与编码规程。
**通用规程(调度核心 / 编码约定 / 交回物格式 / 宿主差异)由插件在每次会话注入,本文件不复述**——这里只写本项目独有的东西。

## 项目是什么

LumioAgent —— 通用开发项目管理 Agent 框架,以**双标准 Agent 插件**分发:根 `plugin.json` 遵循 Agent Plugins 1.0.0(技能层跨客户端可移植),`.claude-plugin/` 承载 Claude Code 专有的子 Agent、slash command 与 hook。

零运行时依赖,纯 Node 内置模块 + Markdown。**不做**业务运行时代码——本仓只产出规范、技能定义与校验脚本。

## 收口门槛

```bash
node tools/plugin-lint.mjs && node tools/spec-lint.mjs && node --test tests/*.test.mjs tools/*.test.mjs && claude plugin validate . --strict
```

## 项目专属约定

本仓既是插件本体又是它的使用者,因此比下游项目多两条:

- **改插件资产必过 `plugin-lint`**:`skills/`、`agents/`、`rules/`、`hooks/`、`templates/`、两份清单——任一改动后跑 `node tools/plugin-lint.mjs`。
- **发版四方同步**:`plugin.json` / `.claude-plugin/plugin.json` / `package.json` / `CHANGELOG.md` 的版本号必须一致(由 `tests/agent-plugins-conformance.test.mjs` 锁死),发布用 `claude plugin tag` 打 `lumio--v<version>`。

## 知识与决策

- 规范与功能记录:[`knowledge/README.md`](knowledge/README.md)(导航)
- 决策唯一落点:[`decisions/`](decisions/README.md)(ADR,不改写、只新增取代)
- 离线任务卡:[`tasks/`](tasks/README.md)(无内置任务工具的宿主用)
