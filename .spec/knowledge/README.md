---
name: knowledge
description: 项目知识库导航——查"某事怎么做"(standards)或"某功能怎么设计的"(features)时,从这里找到对应 .md
metadata:
  type: index
---

# Knowledge(项目知识库 · 导航)

本文件是 `knowledge/` 下所有 .md 的导航 meta:一行描述 + 路径,按需下钻。

> **导航行与各文档 frontmatter `description` 同一句话口径,只写「是什么 + 何时查」。** 交付历史在各文档的「变更记录」节,此处不堆([决策 0003](../decisions/0003-knowledge-anti-bloat.md));长度 / status 枚举 / 登记覆盖 / 链接可达由 `node tools/spec-lint.mjs` 机械校验。

## standards/(开发规范 · 要遵守的「怎么做」)

| 文档 | 一句话 |
|------|--------|
| [`standards/workflow.md`](standards/workflow.md) | 开发工作流:分支 / 提交 / 合并 · PR——动手改代码、开 PR 前查 |
| [`standards/code-style.md`](standards/code-style.md) | 代码风格:注释 / 命名等需判断的约定——写代码时查 |
| [`standards/testing.md`](standards/testing.md) | 测试与验收:何时走 TDD、验收标准 DoD——实现功能 / 修 bug 时查 |
| [`standards/ai.md`](standards/ai.md) | AI 能力接入规范:LLM 端口边界、数据外发受控例外、密钥/prompt/评测——做产品 AI 能力/接外部 LLM 前查 |

## features/(功能设计与记录 · 供了解)

| 文档 | 一句话 |
|------|--------|
| [`features/_TEMPLATE.md`](features/_TEMPLATE.md) | 新功能文档模板——新增功能记录时照此建,放对 领域 / 模块 |

> 暂无正式功能文档。

---

新增 / 修改 / 维护知识文档(放哪、frontmatter、同步本导航)→ 用 `spec-steward` 技能;框架级决策记录 → [`../decisions/`](../decisions/README.md)。
