---
status: completed
---

# W1 落点换轨 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task (hosts without subagents: its Inline Fallback section). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把框架产物落点从 `docs/` 收进 `.spec/`（规则、技能、模板、lint 同一波换完，不留半轨），并落地三项 spec-lint 校验 + plugin-lint 禁名 grep。

**Architecture:** 依据 [治理优化 Roadmap](2026-09-01-governance-optimization.md) 与 ADR 0003。设计稿即 feature 文档初版（status 状态机）；计划落 `.spec/plans/`（frontmatter 复用任务卡契约）；lint 走 git 索引禁并行文档根。文档编辑在前、lint 启用在后——plugin-lint 禁名 grep 一旦启用，仓内残留旧路径会当场打红，顺序不能反。

**Tech Stack:** Node ESM（`node:test`、`execFileSync`）；纯文本编辑用精确 old/new 替换。

## Global Constraints

- **不动版本号**：四方版本号（两清单 + `package.json` + `CHANGELOG.md`）由 conformance 测试锁死，统一在 W3 收口时 bump（breaking → 2.0.0）。
- **插件资产不得引用本仓 ADR 编号**（如「ADR 0003」）——插件跨项目分发，下游 ADR 编号空间独立。
- **每项新 lint 校验必配反例测试**（fixture 模式照抄现有测试文件）。
- 英文技能保持英文行文；中文枚举值（`设计中` 等）原样保留。
- 每个任务收尾跑：`node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs`，全绿才 commit（guard-commit hook 也会强制）。

---

### Task 1: 规则与技能落点换轨（纯文档编辑）

**Files:**
- Modify: `plugin/rules/dispatch.md:21`
- Modify: `plugin/skills/brainstorming/SKILL.md:26`、`plugin/skills/brainstorming/SKILL.md:101-105`
- Modify: `plugin/skills/writing-plans/SKILL.md:18-19`、header 模板块、`:160`
- Modify: `plugin/skills/subagent-driven-development/SKILL.md:254`、Durable Progress 末尾
- Modify: `plugin/skills/spec-steward/SKILL.md:58`
- Modify: `plugin/templates/.spec/knowledge/features/_TEMPLATE.md`（设计节首行）

**Interfaces:**
- Produces: 插件资产正文零出现 `docs/specs/`、`docs/plans/`（Task 4 的 grep 校验依赖此状态）；计划 frontmatter 约定 `status: pending`（Task 3 校验它）。

- [ ] **Step 1: dispatch.md 流程句改落点**

old（`plugin/rules/dispatch.md:21` 内的括号段）：

```text
(设计落 `docs/specs/`、计划落 `docs/plans/`,均为功能级工作产物;跨宿主任务状态真值仍是 `.spec/tasks/`,计划内 checkbox 只是执行内部进度)
```

new：

```text
(设计即 feature 文档初版,落 `.spec/knowledge/features/`——终稿口吻、`status: 设计中` 起步,取舍记 `.spec/decisions/`,讨论过程不入库;计划落 `.spec/plans/`;跨宿主任务状态真值仍是 `.spec/tasks/`,计划内 checkbox 只是执行内部进度)
```

- [ ] **Step 2: brainstorming checklist 第 5 项**

old：

```text
5. **Write design doc** — save to `docs/specs/YYYY-MM-DD-<topic>-design.md` and commit
```

new：

```text
5. **Write design doc** — the design IS the feature doc: `.spec/knowledge/features/<topic>.md` (see "After the Design"); commit
```

- [ ] **Step 3: brainstorming「After the Design / Documentation」段重写**

old：

```text
- Write the validated design (spec) to `docs/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Commit the design document to git
```

new：

```text
- The design document IS the feature doc's first version — no separate spec file, no later sedimentation step:
  - Feature work: write to `.spec/knowledge/features/<topic>.md` in final-register voice (describe what it IS, not the discussion), frontmatter per the project's `_TEMPLATE.md` with `status: 设计中`, and register it in `.spec/knowledge/README.md` navigation. Status flows `设计中 → 实施中 → 已交付` as work proceeds — the document never moves.
  - One-off engineering efforts (nothing long-lived to describe): fold the design into the effort's plan document in `.spec/plans/` (see writing-plans) as a design section — no feature doc.
  - Trade-offs, rejected alternatives, and the "why" go to an ADR in `.spec/decisions/`; the feature doc keeps only the design as it stands.
  - The discussion process itself is NOT committed anywhere — it lives in the conversation.
  - (User preferences for spec location override these defaults)
- Commit the design document to git
```

- [ ] **Step 4: writing-plans 落点 + frontmatter 契约**

old（`:18-19`）：

```text
**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)
```

new：

```text
**Save plans to:** `.spec/plans/YYYY-MM-DD-<feature-name>.md`
- Start the file with frontmatter `status: pending` — the only key allowed; enum `pending / in_progress / completed` (spec-lint enforced). Execution flips it: subagent-driven-development sets `in_progress` at start, `completed` at final close.
- (User preferences for plan location override this default)
```

- [ ] **Step 5: writing-plans header 模板块加 frontmatter**

old（Plan Document Header 的 markdown 围栏开头）：

````text
```markdown
# [Feature Name] Implementation Plan
````

new：

````text
```markdown
---
status: pending
---

# [Feature Name] Implementation Plan
````

- [ ] **Step 6: writing-plans 交接语（`:160`）**

old：`Plan complete and saved to `docs/plans/<filename>.md``（引号内路径）→ new：`.spec/plans/<filename>.md`（该行其余文字不动）。

- [ ] **Step 7: subagent-driven-development 两处**

`:254` old：`[Read plan file once: docs/plans/feature-plan.md]` → new：`[Read plan file once: .spec/plans/feature-plan.md]`

Durable Progress 一节末尾（`git clean -fdx` bullet 之后）追加一条 bullet：

```text
- Plan frontmatter mirrors the coarse state: set `status: in_progress` when
  execution starts and `status: completed` when the final review passes
  (enum enforced by spec-lint).
```

- [ ] **Step 8: spec-steward 流程 B 第 2 步功能设计 bullet**

old（`:58`）：

```text
   - 影响**功能设计**（新功能、行为变更）→ 找 `knowledge/features/` 对应文档：有就更新，没有就从 `_TEMPLATE.md` 新建（放对领域 / 模块）——只写设计现状，不留决策记录。
```

new：

```text
   - 影响**功能设计**（新功能、行为变更）→ 更新 `knowledge/features/` 对应文档并流转 `status`（feature 文档由 brainstorming 在设计期直接建立、`设计中` 起步，交付时改 `已交付`；确无文档才从 `_TEMPLATE.md` 补建）——只写设计现状，不留决策记录，无二次搬运。
```

- [ ] **Step 9: features/_TEMPLATE.md 设计节首行**

old：`- 关键设计与取舍。涉及多学科时分小节：` → new：`- 终稿口吻写「定了什么样」；取舍与弃案记 ADR（`decisions/`），不写在这里。涉及多学科时分小节：`

- [ ] **Step 10: 验证零残留**

Run: `grep -rn 'docs/specs\|docs/plans' plugin/ --include='*.md'`
Expected: 无输出（exit 1）。

- [ ] **Step 11: 跑收口命令并 commit**

```bash
node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs
git add plugin/
git commit -m "feat(plugin)!: 框架产物落点收进 .spec/——设计即 feature 文档,计划落 .spec/plans/"
```

---

### Task 2: 模板与实例骨架 + ADR 体例修正

**Files:**
- Create: `plugin/templates/.spec/plans/README.md`
- Create: `.spec/plans/README.md`（同内容）
- Modify: `.spec/decisions/0001-plugin-migration.md`（状态行）
- Modify: `.spec/decisions/README.md`、`plugin/templates/.spec/decisions/README.md`（格式说明中的状态枚举行）

**Interfaces:**
- Produces: `plans/README.md` 是计划格式契约的单一权威；ADR 状态行体例 `生效 | (部分)被 [NNNN](<file>) 取代`（Task 3 的校验正则以此为准）。

- [ ] **Step 1: 写 plans/README.md（两份同内容）**

```markdown
# 计划目录（历史记录）

实现计划落这里：`YYYY-MM-DD-<name>.md`（日期前缀，执行完不改写）。历史记录靠日期自然排序，**本目录不设索引**——本文件只是格式契约（单一权威，写计划处均指回这里）。

## 格式契约

- frontmatter 复用任务卡契约：仅 `status` 一个字段，枚举 `pending` / `in_progress` / `completed`（spec-lint 强制）。
- 状态由执行方流转：创建 `pending`，开工 `in_progress`，收口 `completed`。
- 一次性工程的设计并入计划文档（设计节 + 任务节合一）；功能设计不在这里——那是 feature 文档（`knowledge/features/`）。
```

- [ ] **Step 2: 修正 ADR 0001 状态行（与索引对齐）**

old：`- 状态:生效` → new：`- 状态:部分被 [0002](0002-plugin-subdir.md) 取代——仅「仓库根即插件根」一条,其余决策继续有效`

- [ ] **Step 3: 两份 decisions/README.md 的格式说明改状态枚举**

old（缩进代码块内）：`      - 状态:生效 | 被 NNNN 取代` → new：`      - 状态:生效 | (部分)被 [NNNN](NNNN-<slug>.md) 取代`

并在其上方「一旦记录不改写」bullet 末尾追加一句：`被取代的状态行必须链接取代者(spec-lint 强制)。`

- [ ] **Step 4: 跑收口命令并 commit**

```bash
node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs
git add plugin/templates/.spec/plans .spec/plans/README.md .spec/decisions plugin/templates/.spec/decisions/README.md
git commit -m "feat(plugin): plans/ 骨架与格式契约;ADR 状态体例改带链接取代式"
```

---

### Task 3: spec-lint 三项校验 + 反例测试

**Files:**
- Modify: `plugin/tools/spec-lint.mjs`（头部清单加 5/6/7 三项；新增代码见各步）
- Test: `tests/spec-lint.test.mjs`

**Interfaces:**
- Consumes: Task 2 的 ADR 状态体例与 plans 契约。
- Produces: 错误信息关键词 `并行文档根` / `第二个 .spec` / `缺「- 状态:」行` / `不合法` / `计划缺少 frontmatter`（测试断言这些字样）。

- [ ] **Step 1: 写失败测试（追加到 tests/spec-lint.test.mjs 末尾）**

```js
// ── W1 新增:禁并行文档根(git 索引) ──────────────────────────────
function gitFixture(overrides = {}) {
  const root = fixture(overrides)
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['add', '-A'], { cwd: root })
  return root
}

test('git 索引中的 docs/specs|plans 被抓(并行文档根)', () => {
  const { code, output } = lint(gitFixture({ 'docs/plans/2026-01-01-x.md': '# 旧落点\n' }))
  assert.equal(code, 1)
  assert.match(output, /并行文档根/)
})

test('嵌套第二个 .spec 被抓,模板骨架豁免', () => {
  const { code, output } = lint(gitFixture({
    'engine/.spec/AGENTS.md': '# 第二套\n',
    'vendor/templates/.spec/AGENTS.md': '# 模板骨架\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /第二个 \.spec/)
  assert.doesNotMatch(output, /vendor/)
})

test('合法 git 仓库全绿(非 git fixture 则跳过该项)', () => {
  const { code, output } = lint(gitFixture())
  assert.equal(code, 0, output)
})

// ── W1 新增:ADR 状态校验 ────────────────────────────────────────
test('ADR 缺状态行被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/decisions/README.md': '# 决策索引\n\n[0001](0001-x.md)\n',
    '.spec/decisions/0001-x.md': '# 0001 · X\n\n- 日期:2026-01-01\n\n## 背景\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /缺「- 状态:」行/)
})

test('ADR 状态非法被抓,生效与带链接取代式通过', () => {
  const bad = lint(fixture({
    '.spec/decisions/README.md': '# 决策索引\n\n[0001](0001-x.md)\n',
    '.spec/decisions/0001-x.md': '# 0001\n\n- 状态:Accepted\n',
  }))
  assert.equal(bad.code, 1)
  assert.match(bad.output, /不合法/)
  const good = lint(fixture({
    '.spec/decisions/README.md': '# 决策索引\n\n[0001](0001-x.md) [0002](0002-y.md)\n',
    '.spec/decisions/0001-x.md': '# 0001\n\n- 状态:部分被 [0002](0002-y.md) 取代——仅某条\n',
    '.spec/decisions/0002-y.md': '# 0002\n\n- 状态:生效(取代 0001 一条)\n',
  }))
  assert.equal(good.code, 0, good.output)
})

// ── W1 新增:plans/ frontmatter ──────────────────────────────────
test('计划缺 frontmatter / 多余字段 / 非枚举被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/plans/2026-01-01-a.md': '# 无 frontmatter\n',
    '.spec/plans/2026-01-01-b.md': '---\nstatus: pending\nowner: me\n---\n\n# b\n',
    '.spec/plans/2026-01-01-c.md': '---\nstatus: done\n---\n\n# c\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /计划缺少 frontmatter/)
  assert.match(output, /只允许 status/)
  assert.match(output, /不在枚举/)
})

test('合法计划与 plans/README 通过', () => {
  const { code, output } = lint(fixture({
    '.spec/plans/README.md': '# 计划目录\n',
    '.spec/plans/2026-01-01-a.md': '---\nstatus: completed\n---\n\n# a\n',
  }))
  assert.equal(code, 0, output)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/spec-lint.test.mjs`
Expected: 新增 7 个测试 FAIL（旧 lint 抓不到这些违规），既有 10 个 PASS。

- [ ] **Step 3: 实现三项校验**

`plugin/tools/spec-lint.mjs` 顶部 import 行加 `execFileSync`：

```js
import { execFileSync } from 'node:child_process'
```

任务卡校验重构为共享函数并覆盖 plans（**替换**原「── 4. 任务卡 frontmatter ──」整段）：

```js
// ── 4. 任务卡 / 计划 frontmatter(共享契约:仅 status,同一枚举) ──────────
function checkStatusCards(dir, label) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory() || !name.endsWith('.md') || name === 'README.md') continue
    const fm = parseFrontmatter(p)
    if (!fm) { err(p, `${label}缺少 frontmatter(格式契约见该目录 README.md)`); continue }
    const keys = fm.__keys.filter((k) => k !== '__keys')
    if (keys.join(',') !== 'status') err(p, `${label} frontmatter 只允许 status,实际:${keys.join(',')}`)
    if (!TASK_STATUS_ENUM.has(fm.status)) {
      err(p, `status「${fm.status ?? ''}」不在枚举(${[...TASK_STATUS_ENUM].join(' / ')})`)
    }
  }
}
checkStatusCards(join(SPEC, 'tasks'), '任务卡')
checkStatusCards(join(SPEC, 'plans'), '计划')
```

ADR 状态校验（并入既有「── 2 ──」decisions 循环体，索引校验之后）：

```js
    const status = readFileSync(file, 'utf8').match(/^-\s*状态[:：]\s*(.+)$/m)
    if (!status) { err(file, 'ADR 缺「- 状态:」行'); continue }
    const v = status[1].trim()
    if (!/^生效/.test(v) && !/^(部分)?被\s*\[\d{4}\]\([^)\s]+\)\s*取代/.test(v)) {
      err(file, `ADR 状态「${v}」不合法——只能以「生效」开头,或「(部分)被 [NNNN](<file>) 取代」`)
    }
```

禁并行文档根（新增「── 5 ──」段，放在汇总之前）：

```js
// ── 5. 禁并行文档根(遍历面 = git 索引;非 git 环境跳过) ───────────────
let indexedFiles = null
try {
  indexedFiles = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean)
} catch { /* 非 git 仓库或无 git:本项跳过 */ }
for (const rel of indexedFiles ?? []) {
  if (/(^|\/)docs\/(specs|plans)\//.test(rel)) {
    err(join(ROOT, rel), '并行文档根:框架产物(设计/计划)只落 .spec/,不落 docs/')
  }
  if (rel.includes('/.spec/') && !rel.includes('templates/.spec/')) {
    err(join(ROOT, rel), '仓根之外出现第二个 .spec/(模板骨架 templates/.spec/ 豁免)')
  }
}
```

头部注释清单追加：

```text
 *  5. 禁并行文档根:git 索引内不得出现 docs/specs/、docs/plans/,或仓根之外的
 *     第二个 .spec/(templates/.spec/ 模板骨架豁免);非 git 环境跳过本项。
 *  6. ADR 状态行:每条 ADR 必有「- 状态:」行,取值以「生效」开头,或
 *     「(部分)被 [NNNN](<file>) 取代」——被取代必须链接取代者。
 *  7. 计划 frontmatter:.spec/plans/ 根目录每份计划(README 除外)与任务卡同契约
 *     (仅 status,枚举 pending / in_progress / completed)。
```

- [ ] **Step 4: 跑测试确认全绿**

Run: `node --test tests/spec-lint.test.mjs`
Expected: 17/17 PASS。再跑 `node plugin/tools/spec-lint.mjs`（本仓自身）Expected: `spec-lint: OK`。

- [ ] **Step 5: Commit**

```bash
git add plugin/tools/spec-lint.mjs tests/spec-lint.test.mjs
git commit -m "feat(lint): spec-lint 三项防复发校验——禁并行文档根(git 索引)、ADR 状态、计划 frontmatter"
```

---

### Task 4: plugin-lint 落点禁名 grep + 反例测试

**Files:**
- Modify: `plugin/tools/plugin-lint.mjs`（头部清单加第 8 项；新增代码见 Step 3）
- Test: `tests/plugin-lint.test.mjs`

**Interfaces:**
- Consumes: Task 1 已清零插件资产内的旧路径（否则本校验会把本仓打红）。

- [ ] **Step 1: 写失败测试（追加到 tests/plugin-lint.test.mjs 末尾）**

```js
// 落点禁名:技能/规则正文一旦指定旧文档根落点,提交前就拦下(防框架自伤)。
test('技能正文指定旧文档根落点被抓', () => {
  const { code, output } = lint(fixture({
    'skills/demo/SKILL.md':
      '---\nname: demo\ndescription: 演示技能,描述要够长以便被识别\n---\n\n# Demo\n\nSave to `docs/plans/x.md`.\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /旧文档根落点/)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/plugin-lint.test.mjs`
Expected: 新测试 FAIL，其余 PASS。

- [ ] **Step 3: 实现禁名 grep（新增「── 8 ──」段，放在汇总之前）**

```js
// ── 8. 落点禁名:插件资产正文不得指定旧文档根落点(防规则-技能自伤) ────────
const BANNED_LANDING_PATHS = ['docs/specs/', 'docs/plans/']
for (const file of walk(ROOT, (p) => p.endsWith('.md'))) {
  const text = readFileSync(file, 'utf8')
  for (const banned of BANNED_LANDING_PATHS) {
    if (text.includes(banned)) err(file, `正文出现旧文档根落点「${banned}」——框架产物只落 .spec/`)
  }
}
```

头部注释清单追加：

```text
 *  8. 落点禁名:插件树下 .md 正文不得出现 docs/specs/、docs/plans/ ——
 *     技能指定的落点必须在项目 .spec/ 校验面内(防规则与技能互相打架)。
```

- [ ] **Step 4: 跑测试确认全绿**

Run: `node --test tests/plugin-lint.test.mjs`
Expected: 14/14 PASS。再跑 `node plugin/tools/plugin-lint.mjs` Expected: `plugin-lint: OK`。

- [ ] **Step 5: Commit**

```bash
git add plugin/tools/plugin-lint.mjs tests/plugin-lint.test.mjs
git commit -m "feat(lint): plugin-lint 落点禁名 grep——技能正文指定旧文档根即红"
```

---

### Task 5: W1 整体收口

**Files:**
- 无新改动；全量验证 + 本计划状态流转。

- [ ] **Step 1: 全量收口门槛**

```bash
node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs && claude plugin validate . --strict
```

Expected: 全绿。

- [ ] **Step 2: 旧轨残留终检**

Run: `git grep -n 'docs/specs\|docs/plans' -- 'plugin/' ':!*.test.mjs'`
Expected: 仅 lint 脚本内的禁名单常量与头部注释命中（那是防复发名单本身），无任何落点指定残留。

- [ ] **Step 3: 本计划状态流转 + commit**

把本文件 frontmatter 改为 `status: completed`，commit：

```bash
git add .spec/plans/2026-09-01-w1-location-switch.md
git commit -m "chore(spec): W1 落点换轨收口"
```
