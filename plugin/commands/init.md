---
description: 在当前项目释放 LumioAgentSpec 脚手架（.spec/ 骨架 + 宿主入口指针）
argument-hint: "[--force]"
allowed-tools: Bash(node:*), Read, Edit
---

在当前项目释放 LumioAgentSpec 的项目侧脚手架。

执行：

```bash
node "${CLAUDE_PLUGIN_ROOT}/tools/init-scaffold.mjs" --target "${CLAUDE_PROJECT_DIR}" $ARGUMENTS
```

脚本默认**不覆盖**任何已存在的文件，指针追加是幂等的，可以反复跑（例如升级插件后再跑一次补齐新增模板）。

跑完后向用户交代：

1. 新建了哪些文件、跳过了哪些（跳过 = 用户已有同名文件，未被改动）。
2. **提醒用户填两处空**——它们是脚手架里仅有的必填项，不填则收口门槛无从判断：
   - `.spec/AGENTS.md` 的「项目是什么」
   - `.spec/AGENTS.md` 的「收口门槛」（本项目的验证命令）
3. 如果这个项目已有自己的规范文档（如现成的 CONTRIBUTING.md、测试约定），指出 `.spec/knowledge/standards/` 里对应的骨架该如何与之合并，不要让两处各说各话。

不要替用户猜测这两处空的内容——除非项目里已有明确依据（如 package.json 的 scripts 能直接确定验证命令），那就提出建议值并说明依据。
