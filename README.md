# LumioAgent

一个**通用的开发项目管理 Agent 框架**，以 Agent 插件分发。主 Agent 负责理解目标、拆解任务、调度、收口，对清晰小改动直接编码；唯一职能子 Agent `reviewer` 负责对抗审查；技能（Skill）是可复用的方法；`.md` 文件是规则。

> 一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

## 双标准

| 层 | 标准 | 内容 | 谁能用 |
|---|---|---|---|
| 可移植层 | [Agent Plugins 1.0.0](https://agent-plugins.org/)（根 `plugin.json`） | `skills/` | Claude Code、Codex CLI、Cursor、GitHub Copilot、VS Code、ChatGPT、Kiro… |
| 专有层 | Claude Code（`.claude-plugin/plugin.json`） | `agents/`、`commands/`、`hooks/` | 仅 Claude Code |

规范 v1 明确把 agents / commands / hooks / rules 排除在可移植层之外，这是标准的边界。**其他客户端只能拿到技能层**；红线规则靠 `/lumio:init` 写进项目入口文件兜底。

## 安装

```bash
claude plugin marketplace add Go1c/LumioAgent && claude plugin install lumio@lumioagent
```

装完在你的项目里跑一次：

```bash
/lumio:init
```

它会在项目里生成 `.spec/` 脚手架（知识库 / 决策 / 任务卡骨架）并写入宿主入口指针。**默认不覆盖任何已有文件**，可反复跑——升级插件后再跑一次即可补齐新增模板。

然后填两处空：`.spec/AGENTS.md` 的「项目是什么」与「收口门槛」。不填则收口无从判断。

## 它怎么工作

- **规则常驻**：`rules/*.md`（硬红线 + 调度规程）由 SessionStart hook 每次会话注入。目录是 glob 的，新增规则文件即生效——没有登记表，也就没有漂移。
- **提交守卫**：PreToolUse hook 在 `git commit` 前跑项目侧 `spec-lint`，不通过就阻断。项目没有 `.spec/` 时静默放行。
- **渐进式披露**：常驻的只有 `rules/`；技能、派活模板、审查清单按需下钻。
- **一致性靠机器**：两支 lint 分别校验插件自身与项目实例，清单以各脚本头部注释为单一权威。

## 仓库地图

本仓库既是插件本体，也是使用它的项目（dogfood）。

**发布面与开发面严格分开**：用户装到的只有 `plugin/`，marketplace 用 `git-subdir` 只拉这一层。

```
LumioAgent/
├── plugin/                   # ★ 发布面——装进用户机器的就是这个目录
│   ├── plugin.json           #   Agent Plugins 1.0.0 清单（可移植层）
│   ├── .claude-plugin/       #   Claude Code 清单
│   ├── skills/               #   技能库，一个技能一个目录
│   ├── agents/               #   子 Agent（仅 reviewer）
│   ├── commands/             #   /lumio:init、/lumio:lint
│   ├── hooks/hooks.json      #   SessionStart 注入规则 + PreToolUse 拦提交
│   ├── rules/                #   每次会话注入：system.md 红线 + dispatch.md 调度规程
│   ├── references/           #   按需下钻：派活 prompt 骨架
│   ├── templates/            #   /lumio:init 的释放源
│   └── tools/                #   两支 lint + hook 脚本 + 脚手架脚本
├── .claude-plugin/           # marketplace.json（留仓库根，供 marketplace add 发现）
├── tests/                    # 全部测试——开发面，不下发
└── .spec/                    # 本仓自己的项目实例数据（= init 的产出），不下发
```

plugin-lint 有一条专门的校验：`plugin/` 里出现 `tests`、`.spec`、`package.json` 等开发文件即报错——因为那会被原样装进每个用户的机器。

## 怎么扩展

- **加 / 改技能、职能或知识** → 用 `spec-steward` 技能：它保证放对位置、frontmatter 合规、索引 / 名册同步。
- **加一条硬规则** → 丢进 `rules/`，自动进入每次会话，无需登记。
- **决策** → 一律落项目 `.spec/decisions/` 新 ADR，不改写旧决策。
- 改完跑 `/lumio:lint`；发版四方版本号同步后用 `claude plugin tag` 打 `lumio--v<version>`。

## 开发

```bash
node --test tests/*.test.mjs && node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && claude plugin validate . --strict
```

开发期实时加载：把 `~/.claude/skills/lumio` 软链到本仓的 **`plugin/`**，即以 `lumio@skills-dir` 自动加载，改动立即生效。

## License

MIT
