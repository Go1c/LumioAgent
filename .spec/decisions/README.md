# Decisions(决策记录 · ADR)

用 ADR(Architecture Decision Record)记录决策:为什么这样调度、为什么定这种结构、为什么划这条边界。**本目录是全仓决策记录的唯一落点**——功能内决策与框架级决策都记这里,feature 文档只描述设计现状,不留决策记录。

## 怎么写一条 ADR

- 一个决策 = 一个文件 `NNNN-<slug>.md`,编号从 `0001` 递增;写完在下方索引加一行。
- **一旦记录不改写**:被推翻就新增一条,把旧的状态标成「被 NNNN 取代」,历史留痕。被取代的状态行必须链接取代者(spec-lint 强制)。
- 无 frontmatter。格式照抄:

  ```markdown
  # NNNN · <一句话决策>

  - 日期:YYYY-MM-DD
  - 状态:生效 | 被 [NNNN](NNNN-<slug>.md) 取代(部分取代加前缀「部分」)

  ## 背景
  面对什么问题。

  ## 决策
  定了什么。

  ## 后果
  接受了什么代价。
  ```

## 索引

| 编号 | 决策 | 状态 |
|------|------|------|
| [0001](0001-plugin-migration.md) | 以双标准 Agent 插件分发，规则改由 SessionStart hook 注入 | 部分被 [0002](0002-plugin-subdir.md) 取代 |
| [0002](0002-plugin-subdir.md) | 插件本体移入 `plugin/`，用 git-subdir 只发布这一层 | 生效 |
| [0003](0003-governance-optimization.md) | 治理优化：单一落点、审查不入库、lint 走 git 索引 | 生效 |
| [0004](0004-rename-lumioagentspec.md) | 仓库与品牌改名 LumioAgentSpec，marketplace 标识同步改为 `lumioagentspec` | 生效 |
| [0005](0005-transfer-to-lumiogames.md) | 仓库迁入 LumioGames 组织，清单归属改为组织 | 生效 |
| [0006](0006-skill-consolidation.md) | 技能精简:下线被宿主原生能力覆盖的技能,11 → 6 | 生效 |
| [0007](0007-parallel-first-dispatch.md) | 并行优先:契约先行拆解、统一合入后审一次、测试按任务大小分级 | 生效 |
