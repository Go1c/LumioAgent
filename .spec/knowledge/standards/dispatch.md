---
name: dispatch
description: 派活模板——worker 派遣与 reviewer 触发的 prompt 骨架;主 loop 扇出任务或触发审查时查
metadata:
  type: doc
  status: 已交付
---

# 派活模板（worker 派遣 / reviewer 触发）

主 loop 派活时照骨架填空,保证每次派发要素齐全、口径一致。**prompt 骨架以下列模板文件为单一权威**,本文只负责把它们接进本仓的调度机制(任务卡 / 并行边界 / 交回物格式)。

## 计划执行(默认路径:subagent-driven-development)

按 [`skills/subagent-driven-development`](../../skills/subagent-driven-development/SKILL.md) 执行,prompt 骨架直接用其原文模板:

- **implementer 派遣** → [`implementer-prompt.md`](../../skills/subagent-driven-development/implementer-prompt.md)
- **每任务两级审查** → [`task-reviewer-prompt.md`](../../skills/subagent-driven-development/task-reviewer-prompt.md)
- **整分支收口审查** → [`code-reviewer.md`](../../skills/subagent-driven-development/code-reviewer.md)

执行纪律以 SDD 的 SKILL.md 为单一权威,此处不复述,只列索引:文件交接(路径传递、报告落文件)见其「File Handoffs」;worker 状态分流(`DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`)见其「Handling Implementer Status」;派审 prompt 纪律(不预判 findings、final review 用一个 fix agent 带完整清单)见其「Constructing Reviewer Prompts」。

## 多卡并行扇出(wave;与 SDD 正交)

SDD 串行执行一份计划;**互不重叠文件集**的独立任务卡才可并行(规则见 `AGENTS.md`「并行边界与合入」),每个 worker 独立 worktree。派遣 prompt 在 implementer 模板基础上补两项:

```text
【文件集边界】只改:<路径列表>。并行方正在改:<路径列表>(一律不动;
lint 报错涉及它们时只记录,主 loop 统一收口)。
【环境】<独立 worktree 路径>
```

- 能继承上下文的 fork 优先;冷启动 worker 才需要把背景写进任务简报。
- 各 worker 交付分别过 task-reviewer 审查,通过后主 loop 合入主工作区。
- 并行派遣 prompt 三要素:**聚焦**(一个 prompt 一个问题域,不派「把测试都修了」)、**自足**(错误信息 / 测试名 / 约束全带上,不依赖会话历史)、**交回物明确**(要求返回根因 + 改动摘要,不是「修好了」)。返回后先查改动是否冲突,再跑全量验证——agent 的成功报告不作数,以 diff 与测试为准。

## reviewer(整体收口)触发

**何时触发:** 必触发——SDD 每任务完成后(task-reviewer)、重大功能完成后、合入主干前;可选但值钱——卡住要新视角、重构前留基线、修完复杂 bug 后。豁免口径以 `AGENTS.md`「快速模式」为准:白名单内改动 lint + 测试直接收口,不触发。

材料齐备才开审(任务卡 / 计划、完整 diff 审查包、带验证证据的交付报告),模板用 [`code-reviewer.md`](../../skills/subagent-driven-development/code-reviewer.md) 填空,并注明:

```text
【审查级别】快审(默认)/ 深审 + 一句理由
【复跑清单】收口门槛命令 + 需抽查重放的验证声称。
【范围外】<并行在途的文件集,diff 中出现一律不审>
```

- 审查对象必须与在途改动隔离(worktree 或快照),否则 diff 被并行方污染。
- 交付报告给「声称」,让 reviewer 核实而不是相信——这是对抗审查的输入格式。
- 退回处理按 [`skills/receiving-code-review`](../../skills/receiving-code-review/SKILL.md):先核实再改,不盲改、不表演性认同。
