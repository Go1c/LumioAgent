# 离线任务卡目录（Codex 侧任务持久化）

Claude Code 用宿主内置 `TaskCreate` / `TaskUpdate`；无内置任务工具的宿主（Codex）把任务卡落在本目录：一张卡 = 一个 `<slug>.md`，frontmatter 带 `status`（pending / in_progress / completed），正文为验收标准。

- **根目录只放在途卡**。任务完成后移入 `archive/`（归档流程见 `spec-steward` 流程 C；历史在 git）。
