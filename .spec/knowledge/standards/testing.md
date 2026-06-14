---
name: testing
description: 测试与验收——何时走 TDD、验收标准 DoD；实现功能 / 修 bug 时查
metadata:
  type: doc
  level: L1
  status: 草稿
---

# 测试与验收（含 TDD 政策）

> 什么时候写测试、要不要走 TDD、产出怎么算“验收通过”。
> 具体“先写失败测试再实现”的操作方法是一个**技能**：[`skills/test-driven-development`](../../skills/test-driven-development/SKILL.md)。本文定**政策**（何时用），技能讲**方法**（怎么用）。

## 何时走 TDD

- 必须走 TDD：`<TODO: 如新功能、修 bug>`
- 可不走：`<TODO: 如一次性脚本、纯文档>`
- 方法见 `skills/test-driven-development`。

## 测试要求

- 覆盖范围：`<TODO: 哪些层必须有测试>`
- 运行方式：`<TODO: 测试命令>`

## 验收标准（Definition of Done）

- [ ] `<TODO: 测试全绿>`
- [ ] `<TODO: 无 lint / 类型错误>`
- [ ] `<TODO: 相关知识文档已更新>`

## 调试约定

- `<TODO: 排查套路、日志规范、调试残留不得提交（提交自检见 workflow.md）>`
