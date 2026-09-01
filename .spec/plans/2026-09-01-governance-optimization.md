---
status: in_progress
---

# 治理优化 Roadmap——单一落点、机器判定、注入面瘦身

依据下游 LumioGameEngine 治理复盘（PR #53 / #55，2026-09-01）与本仓实证，对框架做一次「删除优先」的治理优化。设计与波次合一（一次性工程不另设设计稿，见 [ADR 0003](../decisions/0003-governance-optimization.md)）。

## 背景：下游报告在本仓的实证

- **框架自己种双根**：[dispatch.md](../../plugin/rules/dispatch.md) 与 [brainstorming](../../plugin/skills/brainstorming/SKILL.md)、[writing-plans](../../plugin/skills/writing-plans/SKILL.md) 把设计/计划落 `docs/specs/`、`docs/plans/`——lint 盲区。下游五个并行文档根中的 `docs/`，即框架默认流程亲手产出。
- **二次搬运**：设计稿定稿后靠 spec-steward 抄成 feature 文档，同一功能两份文档，搬运靠自觉。
- **散文判定**：快速模式白名单声称「机器可判」，无对应脚本。
- **注入面臃肿**：调度核心 13 条法律条文 + 宿主差异表，每次会话付费。

## 设计公理

1. **入库产物必须落在机器校验的遍历面内。** `docs/` 腐烂不因名字，因盲区。框架不得指定任何 lint 覆盖不到的入库落点。
2. **lint 的校验对象是 git 索引，不是文件系统。** git-ignored 草稿（`.sdd/`）天然豁免、不受禁名约束——下游 `.sdd-scratch/` 改名事故在机制上不再可能。

## 产物落点：三股分流、三分归位

设计过程拆三股：**定了什么样** → feature 文档（终稿口吻，`status: 设计中 → 实施中 → 已交付`）；**为什么这么定、弃了什么** → ADR；**讨论过程本身** → 不入库。

| 产物 | 性质 | 落点 |
|---|---|---|
| 功能设计 | 活文档 | `.spec/knowledge/features/<topic>.md`，即 feature 文档初版，靠 status 流转，零搬运 |
| 一次性工程设计 | 历史记录 | 并入该工程的计划文档（本文档即样本） |
| 实现计划 | 历史记录 | `.spec/plans/YYYY-MM-DD-<name>.md`，执行完不改写 |
| 审查报告 | 过程记录 | **不入库**（活在交回物与 PR）；决策想留下只有一条路：ADR |
| 进度台账 | 临时草稿 | `.sdd/`，git-ignored，不受 lint（公理二正名，不改名） |
| 任务卡 | 在途状态 | `.spec/tasks/`，**单轨**：宿主任务工具为日常真值，本目录只收跨会话必须存活的卡（修正 dispatch.md 的双轨表述） |

`plans/` frontmatter 复用任务卡契约：仅 `status`，枚举 `pending / in_progress / completed`——零新增枚举。`plans/` 不设 README 索引：历史记录靠日期前缀自然排序，不需要被「发现」。

## 强制注入面瘦身

强制注入面只装两种东西：每次会话都要用的**判定**，和硬红线。

- 「调度核心」13 条 → 一张路由表：`情形 → 流程 → 审查级别 → 收口命令`，一行一种活，细节链接技能与 references/。
- 宿主差异表 → 下沉 `plugin/references/host-differences.md`，dispatch 留一行指针。
- 快速模式散文 → 一句：「跑 `closeout-gate` 定级；红线面永不快速」。
- `system.md` 硬红线不动。

## lint 与工具（每项对应一次真实事故）

**spec-lint 补三项**（项目侧）：

1. **禁并行文档根**：走 `git ls-files`，索引内出现 `docs/specs/`、`docs/plans/`（框架产物旧落点）或仓根之外的第二个 `.spec/`（下游嵌套第二套框架的病灶）即红（对应下游五根之乱）。
2. **ADR 状态校验**：`- 状态:` 行必须存在，且以「生效」或「（部分）被 NNNN 取代」开头；被取代必须链接取代者（对应两起裁决事故）。适配本仓无 frontmatter 的 ADR 体例，不换格式。
3. **`plans/` frontmatter 强制**：仅 `status` + 枚举（新目录出生即在管辖内）。

**plugin-lint 补一项**（插件侧）：拿禁名单 grep `plugin/skills/`、`plugin/rules/`、`plugin/references/`、`plugin/templates/` 正文，技能指定往禁区落文件即红——替代「足迹声明系统」（声明自身会漂移，grep 抓正文实际写的路径）。

**closeout-gate.mjs**（新工具，`plugin/tools/`）：输入 diff，输出三态 + 命中理由——`快速豁免`（纯文档 / 纯注释 / 纯配置数据 / 有效行 < 50——只计新增行 / revert）、`快审`、`深审`；红线面路径（`rules/`、hooks、`.claude/` 等可执行配置）一票升级为至少快审；鉴权面机器判不了，人工把关。**白名单随之收窄到机器可判子集**：原白名单中「机械套用既有模式」「生成物随源更新」机器判不了，不再享豁免、归入快审。把 dispatch.md 已有的「判定须机器可判」从散文变成命令。

全部新校验各配反例测试。

## 明确不做（勿增实体）

- **lessons 自动升格机器**：错题本本身**保留且必要**（大项目必须有错题本；它是「不配当规则的经验」的候待区，防规则无限膨胀）；不建的只是「标签 + 引用计数 + 数到三自动升格」的流水线——本仓错题本现为空，升格仍走人工判断，池子攒够条目后再议。
- **技能足迹声明系统**：禁名 grep 够用。
- **`reviews/` 目录**：审查报告不入库，温床不存在则无需防虫。
- **下游回流机制**：人肉回流（贴报告）现阶段工作良好，不建通道实体。

## 波次（换轨一次换完——下游最大教训）

| 波次 | 内容 | 验收 |
|---|---|---|
| **W1 · 落点换轨** | 同一 PR 内：dispatch.md 流程句改落点；brainstorming / writing-plans / subagent-driven-development 改产物路径；spec-steward 从「二次搬运」改为「状态流转守护」；templates 扩 `plans/` 骨架与 tasks/plans 契约；本仓 `.spec/` 实例同步；spec-lint 三项 + plugin-lint 禁名 grep 同波落地 | 全部校验带反例测试；收口门槛通过；规则-技能-模板-lint 无一处残留 `docs/specs`、`docs/plans` 旧轨 |
| **W2 · closeout-gate** | 新工具 + dispatch.md 白名单段接入 | 三态各配用例；对本仓真实 diff 演练一次 |
| **W3 · 注入面瘦身** | 调度核心拆路由表；宿主差异下沉 references/；任务单轨表述修正 | plugin-lint 链接校验通过；注入面行数显著下降且判定无损 |

## 收口门槛

```
node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs && claude plugin validate . --strict
```
