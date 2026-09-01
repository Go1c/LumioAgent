# 计划目录（历史记录）

实现计划落这里：`YYYY-MM-DD-<name>.md`（日期前缀，执行完不改写）。历史记录靠日期自然排序，**本目录不设索引**——本文件只是格式契约（单一权威，写计划处均指回这里）。

## 格式契约

- frontmatter 复用任务卡契约：仅 `status` 一个字段，枚举 `pending` / `in_progress` / `completed`（spec-lint 强制）。
- 状态由执行方流转：创建 `pending`，开工 `in_progress`，收口 `completed`。
- 一次性工程的设计并入计划文档（设计节 + 任务节合一）；功能设计不在这里——那是 feature 文档（`knowledge/features/`）。
