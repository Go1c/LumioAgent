---
name: workflow
description: 开发工作流——分支/提交/合并·PR 流程；动手改代码、开 PR 前查
metadata:
  type: doc
  level: L1
  status: 设计中
---

# 开发工作流（分支 / 提交 / 合并）

> 本文是“开发这件事**怎么做**”的手册。注意区分：Agent 之间**怎么协作**（planner → coder → reviewer → 收口）在 [`AGENTS.md`](../../AGENTS.md) 的「调度核心」里，不在这里。
> “禁止碰什么”的硬性护栏（如禁止直接 push 受保护分支）在 [`rules/`](../../rules/)；本文只描述流程，遇到护栏处**引用**它，不重复定义。

## 分支策略

- 直接在 `main` 开发提交，不开功能分支。
- 无受保护分支限制。

## 提交规范

- 格式：`type(scope): subject`，例如 `feat(agents): 新增 reviewer`、`fix(coder): 修复 TDD 步骤`。
- 常用 type：`feat` / `fix` / `refactor` / `chore` / `docs`。
- scope 可省略（如 `chore: initial setup`）。
- 粒度：一次提交解决一件事；不把无关改动混在一起。
- 提交前：测试通过、无调试残留、知识已同步（见下节）。

## 合并 / PR 流程

- 无 PR 流程，直接 push `main`。

## 改动完成 = 知识已同步

一处改动只有在**知识沉淀完成**后才算 Done：用 `spec-steward` 技能更新对应 `knowledge/` 文档、`status` 和 `knowledge/README.md` 导航。未同步的改动不得提交 / 合并。

## 相关

- 验收与测试：[`testing.md`](./testing.md)
- 注释与命名：[`code-style.md`](./code-style.md)
- 护栏（禁止项）：`rules/`
- 沉淀方法：`skills/spec-steward`
