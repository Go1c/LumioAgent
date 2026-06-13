# LumioAgent 架构图

> 本文是 LumioAgent 的「一图看懂」入口：一张概念思维导图 + 一张目录架构图。
> `.spec/` 是唯一权威目录；详细定义以 [`SPEC.md`](./SPEC.md) 为准，本文只做可视化索引。

---

## 一、思维导图（概念关系）

```
                LumioAgent
                   通用开发项目管理 Agent
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   【三条铁律】         【四个概念】          【运转机制】
        │                   │                   │
  ┌─────┴──────┐            │            渐进式披露(3阶段)
  │ 能力长在边缘 │            │            ┌──────────────────┐
  │ 规则即文档   │            │            │ ①发现 Discovery   │ 只读 name+description
  │ 渐进式披露   │            │            │ ②激活 Activation  │ 匹配后读全文
  └────────────┘            │            │ ③执行 Execution   │ 按需加载附属文件
                            │            └──────────────────┘
        ┌───────────────────┤
        │                   │
   ┌────▼─────┐   ┌─────────▼────┐   ┌──────────┐   ┌───────────┐
   │ 主 Agent  │   │  子 Agent     │   │  Skill   │   │ 上下文 .md │
   │ AGENTS.md │   │ *.agent.md    │   │ SKILL.md │   │ CONTEXT.md│
   └────┬─────┘   └──────┬───────┘   └────┬─────┘   └─────┬─────┘
        │                │                │               │
   「项目负责人」      「专职成员」        「岗位 SOP」      「公司制度」
        │                │                │               │
   ·身份与目标       frontmatter:       标准字段(兼容):     ·全局规则
   ·全局原则         ·name 唯一标识      ·name             ·局部约定
   ·子Agent名册      ·description 调度时机 ·description      ·就近原则
   ·调度策略         ·role 权力边界 ◄─┐   ─────────────    ·无 frontmatter
   ·硬性红线         ·goal 北极星     │   扩展字段(metadata):
        │            ·skills 能力白名单 │   ·version 语义化版本
        │            ·tools 工具白名单  │   ·category 类别
        │                │            │   ·tags / related_skills
        │ 调度 delegate   │            │
        └──────►─────────┤            │
                         │            │
                ┌────────┴──────┐     │
                │ role 两级角色   │     │
                ├───────────────┤     │
                │ orchestrator   │ 可再派生子 Agent
                │ worker         │ 只执行，不可派活（防无限派生）
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
       planner         coder         reviewer
       (拆任务)        (写代码)       (审产出)
          └─────────────┼─────────────┘
                 默认流程: planner → coder → reviewer
                                 │
                          技能不绑定角色
                       任何子 Agent 都能调用 Skill
```

---

## 二、目录架构图

```
LumioAgent/
│
├── .spec/ ★★                   唯一权威源
│   ├── AGENTS.md               主 Agent「宪法」/ 调度策略 / 红线
│   ├── SPEC.md                 唯一权威规范(四概念定义+模板+生命周期)
│   ├── ARCHITECTURE.md         本文：思维导图 + 目录架构图
│   ├── agents/                 子 Agent 定义 —— 一个文件 = 一个职能
│   │   ├── orchestrator.agent.md [role: orchestrator] 唯一能派活的角色
│   │   ├── planner.agent.md      [role: worker]       把目标拆成任务
│   │   ├── coder.agent.md        [role: worker]       写/改代码
│   │   └── reviewer.agent.md     [role: worker]       审查产出
│   │        └ frontmatter: name·description·role·goal·skills·tools·version
│   ├── skills/                 技能库权威源 —— 扁平结构，一个技能一个目录
│   │   ├── code-review/
│   │   │   └── SKILL.md         兼容 agentskills 开放标准
│   │   ├── test-driven-development/
│   │   │   └── SKILL.md
│   │   └── task-breakdown/
│   │       └── SKILL.md
│   │       技能目录可选附属(渐进式披露第③阶段才加载):
│   │       └── <skill>/
│   │           ├── SKILL.md ★   必需：元数据 + 指令(保持轻量)
│   │           ├── scripts/     可选：可执行脚本
│   │           ├── references/  可选：从 SKILL.md 拆出的长细节
│   │           └── templates/   可选：模板·资源
│   ├── rules/                  共享规则片段 —— 跨工具、跨 Agent
│   │   └── README.md            说明 rules 的边界与命名
│   └── examples/               走查样板
│
├── AGENTS.md ★                 根入口指针 → .spec/AGENTS.md + .spec/SPEC.md
├── CLAUDE.md ★                 Claude Code 入口指针 → .spec/
├── README.md                   项目地图与上手指引
│
├── .claude/
│   ├── agents -> ../.spec/agents Claude Code 读取同一套子 Agent
│   ├── rules -> ../.spec/rules   Claude Code 读取同一套规则片段
│   └── skills -> ../.spec/skills Claude Code 读取同一套技能
│
├── .agents/
│   └── skills -> ../.spec/skills Codex 读取同一套技能
│
└── (可选) 任意子目录/
    └── CONTEXT.md               局部上下文，就近放置，无 frontmatter

图例:  ★ 入口    ★★ 权威源
```

---

*本文随 `SPEC.md` 和实际目录结构同步更新。两者冲突时，以 `SPEC.md` 为准。*
