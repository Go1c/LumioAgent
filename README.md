# LumioAgent

一个**通用的开发项目管理 Agent 框架**。主 Agent 负责理解目标、拆解任务、调度、收口，对清晰小改动直接编码；唯一职能子 Agent `reviewer` 负责对抗审查；技能（Skill）是可复用的方法；`.md` 文件是规则。

`.spec/` 是唯一权威目录。Codex、Claude 和根目录入口都只是指针，最终都指向 `.spec/` 里的同一套规范。

> 一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

## 它怎么工作

- 调度、编码约定、并行与审查闭环的**权威定义在 [.spec/AGENTS.md](.spec/AGENTS.md)**，本节不复述：主 loop 调度一切，唯一职能子 Agent 是 `reviewer`（写的人 ≠ 审的人），技能（`.spec/skills/`）是可复用方法，决策一律走 `.spec/decisions/` ADR——全仓唯一决策落点（空模板，给你的项目用）。
- **一致性**由 `node .spec/tools/spec-lint.mjs` 机械校验（完整校验项清单见该脚本头部注释），不靠人肉清单。

能力按**渐进式披露**加载：三份核心（中心文档 / 知识导航 / 硬红线）每次 init 强制载入（Claude Code 经 `@import`；无此机制的宿主靠主动读三份核心），其余按需下钻。Skill 格式**兼容 [Agent Skills 开放标准](https://agentskills.io)** 的必填子集（本仓约定只用 name + description）。

## 仓库地图

```
LumioAgent/
├── .spec/                    # 唯一权威源
│   ├── AGENTS.md             # ★ 中心文档：项目槽位 + 调度核心 + 名册，先读它
│   ├── agents/               # 子 Agent 定义（仅 reviewer；准入门槛见 AGENTS.md）
│   ├── rules/                # Agent 护栏 / 禁令（跨工具、跨 Agent，强制载入）
│   ├── knowledge/            # 项目知识库（standards 规范 + features 功能 + lessons 经验池）
│   ├── decisions/            # ADR 决策目录（空模板，从 0001 开始写）
│   ├── tasks/                # 离线任务卡（无内置任务工具的宿主用；完成即删，历史在 git）
│   ├── skills/               # 技能库，扁平结构，一个技能一个目录
│   └── tools/                # spec-lint 结构校验脚本 + fixture 自测
├── AGENTS.md                 # 根入口指针 → .spec/AGENTS.md
├── CLAUDE.md                 # Claude Code 入口：@import 强制加载三份核心
├── .claude/、.agents/        # 软链接 → .spec/（宿主自动发现 agents / skills）
├── LICENSE                   # MIT
├── .gitignore
└── README.md
```

## 从哪开始读

1. **[.spec/AGENTS.md](.spec/AGENTS.md)** —— 中心文档：调度核心（默认流程 / 交回物格式 / 失败升级）+ 子 Agent 名册。**先读它，再按需下钻。**
2. **[.spec/knowledge/README.md](.spec/knowledge/README.md)** —— 知识导航：有哪些规范和功能记录、在哪。
3. **[.spec/rules/system.md](.spec/rules/system.md)** —— 硬红线：协作禁令与安全护栏。

## 怎么用到你的项目

把这个仓库复制进你的项目，然后：

1. **填空**：`.spec/AGENTS.md` 顶部有「项目是什么 / 收口门槛」两处占位，填上你项目的定位和验证命令。
2. **改写规范骨架**：`.spec/knowledge/standards/` 里三份文档标了「落地必填」的段落，换成你项目的真实约定；其余通用部分可保留。
3. **保留框架资产**：`.spec/rules/` 的红线原样保留；`.spec/decisions/` 是空 ADR 模板，你的决策从 0001 开始写；`.claude/settings.json` 的提交前 lint 兜底随仓生效（Claude Code 启动会话时加载）。
4. **老项目也能用**：不必一步到位，先只搬 `.spec/rules/` + `.spec/AGENTS.md`，其余分批接入。

> 每次收尾跑一下 `node .spec/tools/spec-lint.mjs`，结构不一致会被当场指出。版本历史见 git tags；后续从下游项目验证过的通用经验会以打 tag 的方式回流到这里。

## 怎么扩展

- **加 / 改一个职能、技能或知识** → 用 `spec-steward` 技能照着做：它保证放对位置、frontmatter 合规、索引 / 名册同步。
- 改完 `.spec/` 跑 `node .spec/tools/spec-lint.mjs`——索引漂移、悬空链接、漏 @import 都会被机器抓住。
- 决策（功能内取舍、调度方式、结构约定）一律落 `decisions/` 新 ADR，不改写旧决策；其他任何地方不留决策记录。
- 下游项目的通用经验回填种子 → `spec-steward` 的「流程 D」。

> 当前仓库内容为规范、定义文档与校验脚本，尚未包含业务运行时代码。
