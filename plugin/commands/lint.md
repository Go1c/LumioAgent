---
description: 校验结构一致性（项目侧 .spec/，在插件仓内则同时校验插件自身）
allowed-tools: Bash(node:*)
---

跑结构校验。

项目侧（`.spec/` 的 frontmatter、导航覆盖、ADR 索引、任务卡状态）：

```bash
node "${CLAUDE_PLUGIN_ROOT}/tools/spec-lint.mjs" "${CLAUDE_PROJECT_DIR}"
```

如果当前项目**就是 LumioAgent 插件仓本身**（存在 `plugin/plugin.json` 且其 name 为 `lumio`），再跑一次插件自身的校验与测试：

```bash
node "${CLAUDE_PROJECT_DIR}/plugin/tools/plugin-lint.mjs" && node --test "${CLAUDE_PROJECT_DIR}"/tests/*.test.mjs
```

把失败项逐条报给用户并指出修法；全绿就报 OK，不要加修饰。
