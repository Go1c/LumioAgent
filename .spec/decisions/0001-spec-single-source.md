# 0001 · `.spec/` 是单一权威源,宿主入口只做指针,核心三份强制载入

- 日期:框架初建时确立,2026-07-03 补录
- 状态:生效

## 背景

项目会被多种 Agent 宿主(Claude Code、Codex 等)驱动。各宿主有自己的入口约定(CLAUDE.md / AGENTS.md / `.claude/` / `.agents/`),若在各入口分别维护规则,必然漂移出多个互相矛盾的「权威」。同时,调度方式、知识地图、硬红线这三样东西如果靠 Agent「想起来再去读」,等于没有。

## 决策

- 规则、知识、角色、技能全部只存在于 `.spec/` 一处:`rules/`(硬红线)、`knowledge/`(standards + features)、`agents/`、`skills/`、`decisions/`(框架 ADR)。
- 宿主入口一律是**指针**:根 `CLAUDE.md` 只放 `@import` 行;根 `AGENTS.md` 只指路;`.claude/*`、`.agents/*` 是指向 `.spec/` 的软链接。任何入口不得定义规则。
- 强制载入集 = `AGENTS.md` + `knowledge/README.md` + `rules/*.md`:调度、知识地图、红线必须从 init 起在场;其余知识走导航按需下钻(渐进式披露)。

## 后果

- 接受无 `@import` 机制的宿主(Codex)依赖「主动读三份」的君子协定——已知不对称。
- `@import` 行与软链接成为需要守护的基础设施——由 `tools/spec-lint.mjs` 校验 @import 完整性兜底。
