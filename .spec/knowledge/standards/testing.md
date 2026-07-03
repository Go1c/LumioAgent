---
name: testing
description: 测试与验收——测试分层政策、TDD 时机、验收 DoD 与验证证据;实现功能/修 bug 时查
metadata:
  type: doc
  level: L1
  status: 已交付
---

# 测试与验收（含 TDD 政策）

> 本文定**政策**（测什么、何时测、怎么算过）；“先写失败测试再实现”的**方法**在技能 [`skills/test-driven-development`](../../skills/test-driven-development/SKILL.md)。

## 测试分层（通用政策）

- **单元测试**：默认层，随项目验证命令（`AGENTS.md`「收口门槛」）每次跑，快、无外部依赖。
- **集成测试**（真库 / 真服务）：显式触发，不进默认验证命令，保持收口快。
- **端到端 / E2E**：显式触发；关键主链路至少一条。

## 何时走 TDD

- 必须走：新功能、修 bug（先写能复现的失败测试，修完留作回归测试）、改无测试保护的关键逻辑。
- 可不走：纯文档改动、一次性脚本。豁免在交回物里声明。

## 验证证据

测试跑没跑、结果如何，**必须以「命令 + 关键输出」形式进交回物**（见 `AGENTS.md`「交回物格式」）——「已通过」三个字不是证据。

## 验收标准（Definition of Done）

- [ ] 收口门槛命令全绿（种子默认 `node tools/spec-lint.mjs` + `node --test tools/spec-lint.test.mjs`）。
- [ ] 新增 / 修改行为有测试覆盖；bug 修复留有回归测试。
- [ ] 无 lint / 类型错误、无调试残留。
- [ ] 相关知识文档已更新（见 [`workflow.md`](./workflow.md)）。

## 项目测试栈与命令（**落地必填**）

<!-- 落地项目在此填写：测试框架、各层运行命令、集成/E2E 的开关方式与环境要求。 -->
种子仓自身：`node --test tools/spec-lint.test.mjs`（spec-lint 的 fixture 自测）。
