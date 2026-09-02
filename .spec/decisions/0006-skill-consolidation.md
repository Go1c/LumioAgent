# 0006 · 技能精简:下线被宿主原生能力覆盖的技能,11 → 6

- 日期:2026-09-02
- 状态:生效

## 背景

11 个技能承袭自 superpowers 谱系。其中 `before-you-code`、`verification-before-completion`、`receiving-code-review`、`using-git-worktrees` 四个的正文只是在劝模型做现代 Claude Code / Codex 默认就会做的事(动手前读相关文档、跑完验证再声称、收到审查意见先核实、用 worktree 隔离);这些要求在 `rules/dispatch.md` 里各有一行规则,Claude Code 又有原生 plan mode、`EnterWorktree`、Agent 工具的 worktree 隔离。每次调用它们都在花上下文而不增加信息。`task-breakdown` 与 `writing-plans` 都是拆解,只差产物深浅;`brainstorming` 的提问流程与原生 plan mode 重叠。

## 决策

- 技能只留两类内容:**模型默认不会做的方法**(严格 TDD、四阶段排障、按 wave 派子代理)与**本框架特有的落点约定**(设计落 feature 文档、决策落 ADR、插件资产 vs 项目实例归属)。劝模型做默认行为的技能一律下线。
- 删除 `before-you-code`、`verification-before-completion`、`receiving-code-review`、`using-git-worktrees`;各自唯一有信息量的句子并入 `rules/dispatch.md`(「先加载再动手」的规模校准、「收工即验证」的证据要求、「失败处理」的退回意见处理规则、「并行边界与合入」的原生 worktree 工具与 gitignore 检查)。
- `task-breakdown` 并入 `writing-plans` 作「浅拆模式」;`brainstorming` 只保留 HARD-GATE、流程骨架与落点规则,提问交给宿主原生 plan mode。
- SDD「禁止并行派实现子代理」与 dispatch.md「默认并行」的矛盾,以 dispatch.md 为准:文件集不重叠即可并行。

## 后果

- 装过 1.0.0 的用户调用 `lumio:before-you-code` 等五个名字会失效;规则已由 SessionStart 注入,不需要替代调用。
- 技能正文少了近 600 行训诫式文本,规则密度上升;代价是对「模型默认会这么做」的假设押在现代模型上,老模型或弱模型的宿主需自行补规则。
