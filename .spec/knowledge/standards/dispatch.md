---
name: dispatch
description: 派活模板——worker 派遣与 reviewer 触发的 prompt 骨架;主 loop 扇出任务或触发审查时查
metadata:
  type: doc
  status: 已交付
---

# 派活模板（worker 派遣 / reviewer 触发）

主 loop 派活时照抄骨架填空，保证每次派发要素齐全、口径一致。规则本身（并行边界、交回物格式、审查清单）在 `AGENTS.md` 与 `reviewer.agent.md`，此处只是把它们组装成可复用的 prompt 形状。

## worker 派遣模板

```text
你只执行这一张卡，不碰范围外文件。
【任务卡】<卡全文，或 .spec/tasks/<slug>.md 路径>
【文件集边界】只改：<路径列表>。并行方正在改：<路径列表>（一律不动；
lint 报错涉及它们时只记录，主 loop 统一收口）。
【环境】<主工作区 / 独立 worktree 路径>
【规程】遵守 AGENTS.md「编码约定」（领任务先标记 / before-you-code /
TDD / 不夹带 / 收工即验证）。
【交回】按 AGENTS.md「交回物格式」四要素；验证证据必须是命令 + 关键输出。
```

- 能继承上下文的 fork 优先；冷启动 worker 才需要把背景摘要写进【任务卡】。
- 多卡并行时，每个 worker 的【文件集边界】互不重叠（见 `AGENTS.md`「并行边界与合入」）。

## reviewer 触发模板

```text
对 <一张卡 / 功能包> 做一次性对抗审查。
【审查对象】<worktree / 快照路径>相对基线 <commit> 的完整 diff + 下列交回物。
【任务卡】<路径或全文>
【交付报告】<各卡交回物摘要：改动清单 / 验证证据声称 / known gaps>
【复跑清单】收口门槛命令 + 需抽查重放的验证声称。
【范围外】<并行在途的文件集，diff 中出现一律不审>
按 reviewer.agent.md 清单逐维过，输出标准审查报告。
```

- 审查对象必须与在途改动隔离（worktree 或快照），否则 diff 被并行方污染。
- 交付报告给「声称」，让 reviewer 核实而不是相信——这是对抗审查的输入格式。

## 变更记录

- 2026-07-04：建立本文档。
