---
name: code-style
description: 代码与文档风格——语言约定、命名、注释原则、生成物纪律;写代码/建文档时查
metadata:
  type: doc
  status: 已交付
---

# 代码与文档风格

> 能交给工具（formatter / linter）强制的，优先交给工具；本文只写工具管不了、需要人 / Agent 判断的部分。

## 语言与文件命名（通用）

- **规范主体使用中文**（`.spec/` 下全部文档）；例外：根 `CLAUDE.md`（宿主入口惯例）与 `skills/` 下允许英文技能文档（中英以该技能既有语言为准，不混写）。若改用其他语言，需全仓一致——注意 LumioAgentSpec 插件的 spec-lint 内置中文 status 枚举，换语言需同步上游。
- 文件与目录命名一律 **kebab-case**；ADR `NNNN-<slug>.md`（agent 与 skill 的命名约定属插件资产，见插件 `rules/dispatch.md`）。

## 注释原则（通用）

- 注释只写**代码表达不了的约束**（为什么这样做、边界条件、外部依赖的坑）。
- 不写「改动说明」式注释（改了什么、为什么正确）——那是给评审人的话，进交回物或提交信息，不进代码。
- 注释密度、命名、习语向**周边既有代码**看齐。

## 生成物纪律（通用）

- 生成物不得手改，只能经生成源与生成命令更新，并与生成源一起提交（红线由 LumioAgentSpec 插件每次会话注入）。

## 语言 / 框架特定风格（**落地必填**）

<!-- 落地项目在此填写：语言版本、formatter / linter 配置指向、目录分层约定、框架惯例。 -->
纯 Markdown + Node 脚本（ESM、零依赖、仅 Node 内置模块，`engines.node >= 20`）。无 formatter / linter 配置——`tools/` 下的脚本靠自身测试与两支 lint 约束。
