---
name: workflow
description: 开发工作流——分支/提交/合并·PR 与知识同步义务;动手改代码、开 PR 前查
metadata:
  type: doc
  level: L1
  status: 已交付
---

# 开发工作流（分支 / 提交 / 合并）

> 本文是“开发这件事**怎么做**”的手册。Agent 之间**怎么协作**（拆解 → 实现 → reviewer 对抗审查 → 收口）在 [`AGENTS.md`](../../AGENTS.md) 的「调度核心」与「编码约定」里，不在这里。
> “禁止碰什么”的硬性护栏在 [`rules/system.md`](../../rules/system.md)；本文只描述流程，遇到护栏处**引用**它，不重复定义。

## 分支策略（**落地必填**）

<!-- 落地项目在此替换为自己的分支模型（主干开发 / feature 分支 + PR / 发布分支等）。 -->
种子仓自身：直接在 `main` 开发提交，不开功能分支、无 PR 流程。

## 提交规范（通用）

- 格式：`type(scope): subject`，例如 `feat(agents): 新增 reviewer`、`fix(skills): 修复 TDD 步骤`。
- 常用 type：`feat` / `fix` / `refactor` / `chore` / `docs` / `ci`。scope 可省略。
- **一次提交只做一类事**；文档、脚手架、功能、测试修复不混在一起。
- 提交前自检：验证命令通过（见 `AGENTS.md`「收口门槛」与 `rules/system.md`）、无调试残留、知识已同步（见下节）。

## 合并 / PR 流程（**落地必填**）

<!-- 落地项目在此替换：PR 必含要素（Summary / 改动清单 / 验证证据 / known gaps）、评审人规则、合并方式。 -->
种子仓自身：直接 push `main`（对外发布动作的确认规则见 `rules/system.md`）。

## 改动完成 = 知识已同步

一处改动只有在**知识沉淀完成**后才算 Done：用 `spec-steward` 技能更新对应 `knowledge/` 文档、`status` 与「变更记录」、`knowledge/README.md` 导航。豁免口径与 `AGENTS.md`「编码约定」的交付标准一致：纯修复 / 机械套用既有模式可豁免，但**豁免必须在交回物里声明**，不得静默跳过。

## 相关

- 验收与测试：[`testing.md`](./testing.md)
- 注释与命名：[`code-style.md`](./code-style.md)
- 护栏（禁止项）：[`rules/system.md`](../../rules/system.md)
- 沉淀方法：[`skills/spec-steward`](../../skills/spec-steward/SKILL.md)
