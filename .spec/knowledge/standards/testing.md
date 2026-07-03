---
name: testing
description: 测试与验收——何时走 TDD、验收标准 DoD；实现功能 / 修 bug 时查
metadata:
  type: doc
  level: L1
  status: 设计中
---

# 测试与验收（含 TDD 政策）

> 什么时候写测试、要不要走 TDD、产出怎么算“验收通过”。
> 具体“先写失败测试再实现”的操作方法是一个**技能**：[`skills/test-driven-development`](../../skills/test-driven-development/SKILL.md)。本文定**政策**（何时用），技能讲**方法**（怎么用）。

> 当前仓库为纯文档项目，尚无运行时代码。引入首批代码时在此填写具体测试策略。

## 何时走 TDD

- 必须走 TDD：新功能、修 bug。
- 可不走：纯文档改动、一次性脚本。
- 方法见 `skills/test-driven-development`。

## 测试要求

待定（引入代码时填写覆盖范围与运行命令）。

## 验收标准（Definition of Done）

- [ ] 测试全绿。
- [ ] 无 lint / 类型错误。
- [ ] 相关知识文档已更新（见 `workflow.md`）。

## 调试约定

- 调试残留（`console.log`、断点、临时注释）不得提交，见 `workflow.md` 提交前自检。
