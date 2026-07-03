# LumioAgent

一个**通用的开发项目管理 Agent 框架**。主 Agent 负责理解目标、拆解任务、调度、收口；不同职能的子 Agent 负责执行；技能（Skill）是可复用的方法；`.md` 文件是规则。

`.spec/` 是唯一权威目录。Codex、Claude 和根目录入口都只是指针，最终都指向 `.spec/` 里的同一套规范。

> 一句话：**主 Agent 调度，子 Agent 执行，Skill 是方法，.md 是规则。**

## 它怎么工作

- **主 Agent**（`.spec/AGENTS.md`）是系统宪法与总调度者，即宿主的主对话循环（主 loop）本身。
- **子 Agent**（`.spec/agents/*.agent.md`）是有单一职责的专职角色（planner / coder / reviewer），由主 loop 调用、只执行、不再派活。实质改动必过 `reviewer` 对抗审查——写的人和审的人是两个上下文。
- **技能**（`.spec/skills/<name>/SKILL.md`）是可复用的标准化流程，任何子 Agent 都能调用。
- **决策**（`.spec/decisions/`）用 ADR 记录框架自身的取舍——为什么这样调度、为什么这种结构。
- **一致性**由 `node tools/spec-lint.mjs` 机械校验（frontmatter / status 枚举 / 导航与 ADR 索引覆盖 / 链接可达 / @import 完整性 / 名册一致），不靠人肉清单。

能力按**渐进式披露**加载：三份核心（中心文档 / 知识导航 / 硬红线）每次 init 强制载入，其余按需下钻。Skill 格式**兼容 [Agent Skills 开放标准](https://agentskills.io)**。

## 仓库地图

```
LumioAgent/
├── .spec/                    # 唯一权威源
│   ├── AGENTS.md             # ★ 中心文档：项目定位 + 调度核心 + 名册，先读它
│   ├── agents/               # 子 Agent 定义（planner / coder / reviewer）
│   ├── rules/                # Agent 护栏 / 禁令（跨工具、跨 Agent，强制载入）
│   ├── knowledge/            # 项目知识库（standards 规范支 + features 功能支）
│   ├── decisions/            # 框架决策记录（ADR）
│   └── skills/               # 技能库，扁平结构，一个技能一个目录
├── tools/
│   └── spec-lint.mjs         # .spec 结构一致性机械校验
├── AGENTS.md                 # 根入口指针 → .spec/AGENTS.md
├── CLAUDE.md                 # Claude Code 入口：@import 强制加载三份核心
├── .claude/
│   ├── agents -> ../.spec/agents
│   └── skills -> ../.spec/skills
├── .agents/
│   └── skills -> ../.spec/skills
└── README.md
```

## 从哪开始读

1. **[.spec/AGENTS.md](.spec/AGENTS.md)** —— 中心文档：调度核心（默认流程 / 交回物格式 / 失败升级）+ 子 Agent 名册。**先读它，再按需下钻。**
2. **[.spec/knowledge/README.md](.spec/knowledge/README.md)** —— 知识导航：有哪些规范和功能记录、在哪。
3. **[.spec/rules/system.md](.spec/rules/system.md)** —— 硬红线：协作禁令与安全护栏。
4. **[.spec/decisions/README.md](.spec/decisions/README.md)** —— 框架为什么长这样：核心决策与代价。

## 怎么扩展

- **加 / 改一个职能、技能或知识** → 用 `spec-steward` 技能照着做：它保证放对位置、frontmatter 合规、索引 / 名册同步。
- 改完 `.spec/` 跑 `node tools/spec-lint.mjs`——索引漂移、悬空链接、漏 @import 都会被机器抓住。
- 框架级取舍（调度方式、结构约定）落 `decisions/` 新 ADR，不改写旧决策。

> 当前仓库内容为规范、定义文档与校验脚本，尚未包含业务运行时代码。
