# 采用指引（从种子到项目）

本文回答种子模板最重要的三件事：**全新项目怎么落地、存量项目怎么接入、之后怎么吸收种子更新**。种子↔下游的契约见 [decisions/0005](.spec/decisions/0005-seed-downstream-contract.md)。

## 1. 全新项目落地（checklist）

复制本仓库内容到新项目后，按序完成：

1. **填项目身份**：`.spec/AGENTS.md` 的「项目是什么」槽位——一句话定位、技术栈、关键边界；把「收口门槛」替换为本项目的验证命令（如 `pnpm verify` / `make check`），并把 `tools/spec-lint.mjs` 挂进去。
2. **改写 standards 骨架**：`knowledge/standards/` 三份各有标注「**落地必填**」的占位节（分支模型、语言/框架风格、测试栈与命令）——改写成本项目真实约定；通用政策部分可保留。
3. **保留框架资产**：`decisions/0001–0005` 是框架级 ADR，**保留不动**；本项目自己的决策从 **0005 之后续号**新增。`rules/system.md` 的红线全部保留，按需追加项目专属红线。
4. **清理种子专属内容**：`CHANGELOG.md` 换成本项目的（或记录「基于种子 vX.Y.Z」后重新开始）；根 `README.md` 改写为项目介绍（仓库地图节可保留结构）。
5. **建第一批知识**：功能文档从 `knowledge/features/_TEMPLATE.md` 起步；每加一份，导航与 frontmatter 按 `spec-steward` 技能的规矩登记。
6. **验证**：跑 `node tools/spec-lint.mjs`，全绿后做第一次提交。

## 2. 存量项目（brownfield）接入

可分阶段，不要求一步到位：

- **第一阶段（最小可用）**：只引入 `.spec/rules/system.md`、`.spec/AGENTS.md`（填好项目槽位）与入口指针。已有 `CLAUDE.md` / `AGENTS.md` 时**合并而不是覆盖**：把 `@import` 三行并入你的 CLAUDE.md，把「先读 .spec/AGENTS.md」指针并入你的根 AGENTS.md；原有规则逐条归位到 `rules/`（禁止类）或 `knowledge/standards/`（怎么做类），入口只留指针。
- **第二阶段（知识库）**：把散落的设计/规范文档按 standards / features 归位进 `knowledge/`，逐份补 frontmatter 并登记导航；历史堆积的「进度记录」放各文档「变更记录」节，不进导航行。
- **第三阶段（角色与校验）**：引入 agents / skills 软链接与 `tools/spec-lint.mjs`，挂进项目验证命令；开始按 planner → coder → reviewer 流程派活。
- 每阶段收尾都以 `node tools/spec-lint.mjs` 全绿为准。

## 3. 吸收种子更新

- 种子按 git tag 发版（`vX.Y.Z`，约定见 [CHANGELOG.md](CHANGELOG.md)）；下游在自己的文档里记录「基于种子 vX.Y.Z」。
- 种子发新版后，下游对照 CHANGELOG **逐条人工吸收**（cherry-pick 或手工对照改写）——下游文件通常已被本地化，不要整文件覆盖；**冲突时以下游项目为准**。
- 跨仓引用 ADR 用 `LumioAgent#0002` 形式（两仓编号空间独立，互不占号）。
- 反方向（下游经验回填种子）走 `spec-steward` 技能的「流程 D · 跨仓回填」。
