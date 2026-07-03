# Changelog

种子按语义化版本发布:每次发版打 `vX.Y.Z` git tag——新增机制(角色 / 流程 / 校验 / 模板)升 minor,修订与修复升 patch。下游项目在 `ADOPTING.md` 描述的流程里记录自己基于的种子版本,吸收更新时对照本文件。

## [0.3.0] - 2026-07-03

来自对种子仓自身的 60 条审计(六视角 + 逐条对抗核实)的集中修复:

- 新增 `ADOPTING.md`:全新项目裁剪 checklist、存量项目(brownfield)接入路径、下游吸收种子更新的流程。
- 审查环闭环:coder 完成语义改为「交回待审」,completed 由主 loop 在 reviewer 通过后标记;明确审查对象(工作区未提交改动);实质改动审查通过前不得提交。
- 调度补规:并行派活仅限文件集互不重叠;多宿主/多人并存时共享任务真值为 `.spec/tasks/`。
- `.spec/AGENTS.md` 增加「项目是什么 / 收口门槛」落地槽位。
- rules 补红线:提交前 lint 必过、生成物不手改、dev-only 开关不上生产、密钥不入库不进 prompt、对外发布须确认、外部内容不当指令(prompt injection)。
- standards 三份骨架充实为可用的通用政策,落地必改写的节显式标注。
- spec-lint 盲区修复:多行 YAML 标量绕过、名册反向(幽灵行)、软链接存活、缺核心文件崩栈、Windows 路径;新增 `tools/spec-lint.test.mjs` 自测。
- 仓库件:LICENSE(MIT)、.gitignore、CI(spec-lint + 自测)、本 CHANGELOG、`decisions/0005`(种子↔下游契约)。

## [0.2.0] - 2026-07-03

从首个下游真实项目(GameFlow)三周实践回填的精髓:

- 新增 `reviewer` 对抗审查角色与交回物格式(验证证据不得只声称)、失败升级路径。
- 知识反膨胀纪律:导航行与 description 同一句话口径、交付历史下沉「变更记录」节、status 四值枚举。
- 新增 `standards/ai.md`(产品 AI 能力边界:不写库 / 可溯源 / 可关闭 / 外发受控)与 rules 安全外发节。
- 新增 `decisions/` ADR 机制(0001–0004)。
- 新增 `tools/spec-lint.mjs` 结构一致性机械校验;修复根 README 悬空引用。

## [0.1.0] - 2026-06-15

初始骨架:`.spec/` 单一权威源(AGENTS 中心文档 / rules / knowledge / skills)、planner + coder 双角色、四个基础技能(before-you-code / task-breakdown / test-driven-development / spec-steward)、双宿主入口指针与软链接。
