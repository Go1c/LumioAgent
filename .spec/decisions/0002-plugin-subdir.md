# 0002 · 插件本体移入 `plugin/` 子目录，用 git-subdir 只发布这一层

- 日期:2026-09-01
- 状态:生效（取代 [0001](0001-plugin-migration.md) 的「仓库根即插件根」一条，其余决策继续有效）

## 背景

0001 采用「仓库根 = 插件根」的扁平化布局。实测安装结果后发现代价被低估了：用户装到的 396K 里包含我们的 `.spec/`（40K）、`tests/`、`.claude/`、`.gitignore`、`package.json`。

体积是次要的。真正的问题是 `.spec/AGENTS.md` 写着 LumioAgent **自己**的收口门槛命令，被装进别人项目后若当成指引读取，给出的是错的命令。而且这个漏口是**结构性**的：以后每新增一个开发用文件都会自动漏给所有用户。

Claude Code 没有 `.claudeignore` 之类的打包排除机制（已在二进制中确认），但 marketplace 的 `git-subdir` source 用 git sparse-checkout 只拉指定子目录——`ppt-master` 已在用。实测验证：用户只拿到子目录内容，根级文件与 marketplace.json 本身都不下发。

## 决策

1. 插件资产全部移入 `plugin/`（含 `tools/`——hooks 以 `${CLAUDE_PLUGIN_ROOT}/tools/…` 调用它们）。
2. `.claude-plugin/marketplace.json` **留在仓库根**（`claude plugin marketplace add <repo>` 从这里发现），source 改为 `{"source":"git-subdir","url":…,"path":"plugin"}`。
3. 全部测试收拢到根 `tests/`，与 `package.json`、`.spec/` 同属开发面。
4. plugin-lint 新增一条校验：`plugin/` 内出现 `tests` / `.spec` / `package.json` / `.gitignore` / `.claude` 即报错——把这个漏口从「靠自觉」变成「机器拦截」。

## 后果

- **本地开发不再能通过本地路径 marketplace 看到改动**：git-subdir 从 url 克隆，本地路径 marketplace 装不出子目录插件。开发期改用 `~/.claude/skills/lumio` → `plugin/` 的软链（`lumio@skills-dir` 自动加载），改动立即生效。
- **首次发布前 marketplace 不可用**：`git-subdir` 需要 url 上真实存在 `plugin/`，推送到 GitHub 之前任何人（包括我们自己）都装不了。
- 仓库根多一层 `plugin/`，所有插件内路径引用加一级；相对深度变化顺带暴露了 `rules/system.md` 里三处 Wave 2 遗留的失效引用（原先恰好解析到仓库根的同名文件而没被抓住）。
- 继续保留根 `.spec/` 的 dogfood 实例：它是验证 `/lumio:init` 产物是否好用的现成样本，现在不再随插件下发。
