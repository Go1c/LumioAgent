---
name: workflow
description: 开发工作流——分支/提交/合并·PR 流程；动手改代码、开 PR 前查
metadata:
  type: doc
  level: L1
  status: 草稿
---

# 开发工作流（分支 / 提交 / 合并）

> 本文是“开发这件事**怎么做**”的手册。注意区分：Agent 之间**怎么协作**（planner → coder → 收口）在 [`AGENTS.md`](../../AGENTS.md) 的「调度策略」里，不在这里。
> “禁止碰什么”的硬性护栏（如禁止直接 push 受保护分支）在 [`rules/`](../../rules/)；本文只描述流程，遇到护栏处**引用**它，不重复定义。

## 分支策略

- 分支命名：`<TODO: 约定，如 feat/xxx、fix/xxx>`
- 从哪开、往哪合：`<TODO>`
- 受保护分支：`<TODO>`（其“禁止直接 push”这条护栏写在 `rules/`，这里只说流程）

## 提交规范

- 提交信息格式：`<TODO: 如 type(scope): subject>`
- 一次提交的粒度：`<TODO>`
- 提交前自检：`<TODO: 如本地测试通过、无调试残留>`

## 合并 / PR 流程

1. `<TODO: 开 PR 前要做什么>`
2. `<TODO: 合并前的检查 / 把关由谁做、看什么>`
3. `<TODO: 合并方式：squash / merge / rebase？>`

## 改动完成 = 知识已同步

一处改动只有在**知识沉淀完成**后才算 Done：用 `spec-steward` 技能更新对应 `knowledge/` 文档、`status` 和所在目录 README 索引。未同步的改动不得提交 / 合并。

## 相关

- 验收与测试：[`testing.md`](./testing.md)
- 注释与命名：[`code-style.md`](./code-style.md)
- 护栏（禁止项）：`rules/`
- 沉淀方法：`skills/spec-steward`
