# 0005 · 仓库迁入 LumioGames 组织，清单归属改为组织

- 日期:2026-09-02
- 状态:生效

## 背景

仓库此前挂在个人账号 `Go1c` 下。同一批 Lumio 系列产物（引擎、服务端、客户端、配置工具等九个仓库）已统一在 `LumioGames` 组织，只有本仓在外，托管归属与其余产物不一致。

清单里的 `author` 此前是个人（Cui / github.com/Go1c）。仓库迁入组织后若只改 `homepage` / `repository` 而留着个人 `author`，对外呈现会出现「组织托管、个人署名」的割裂。

## 决策

1. 仓库转移至 `LumioGames/LumioAgentSpec`（GitHub 转移 API，star 与 issue 随仓保留，旧路径自动重定向）。
2. 两份插件清单与 marketplace.json 的 `author` / `owner` 改为组织（LumioGames / github.com/LumioGames），`homepage`、`repository` 与 `git-subdir` 的 url 一并指向组织仓库。
3. 双语 README 的安装命令、`.spec/AGENTS.md` 与下发模板中的插件链接同步。
4. **不改**:插件 id `lumio`、marketplace 标识 `lumioagentspec`、`/lumio:init` `/lumio:lint` `lumio:<skill>` 调用方式、指针标记、tag 前缀 `lumio--v`——与 0004 同一条边界:用户侧接口与托管归属解耦。
5. **不改**:已生效 ADR 正文中的旧地址（记录不改写）。CHANGELOG 的 Unreleased 段尚未发布，按最终状态改写而非追加矛盾条目。

## 后果

- 安装命令变为 `claude plugin marketplace add LumioGames/LumioAgentSpec`。旧地址靠 GitHub 重定向仍可拉取，**但重定向会在有人重新占用旧路径时失效**——这是唯一的长期风险点，升级指引已写进 CHANGELOG。
- 不发新版本号:迁移不改变任何技能、规则或工具行为，与 0004 同归入下一版本的 Changed。
- 提交署名（git author）仍是个人，只有插件清单的 `author` 表示归属方，两者语义不同，不做统一。
- 本地目录仍叫 `LumioAgent`，与远端名和归属都不一致，属开发者本机状态，不影响任何产物。
