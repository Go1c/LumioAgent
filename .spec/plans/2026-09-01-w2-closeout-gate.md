---
status: pending
---

# W2 closeout-gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task (hosts without subagents: its Inline Fallback section). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把快速模式白名单从散文变成一条命令：`closeout-gate` 输入 diff、输出三态定级（快速豁免 / 快审 / 深审）加命中理由，并把 dispatch.md 的白名单段改为指向它。

**Architecture:** 依据 [治理优化 Roadmap](2026-09-01-governance-optimization.md) W2 行与 ADR 0003。新工具 `plugin/tools/closeout-gate.mjs`（纯 Node，无依赖，git 走 `-z` 防 quotePath——W1 教训）；白名单收窄到机器可判子集，「机械套用既有模式」「生成物随源更新」不再豁免；红线面一票取消豁免、永不快速。阈值按用户定调偏宽松（判定规则单一权威在工具头注释）：有效行 < 50 豁免；总有效行 ≥ 500 深审；红线面 + 有效行 ≥ 100 深审（否则快审）；纯文档 / 数据类的未跟踪文件不拦豁免（仅提示未计入），非文档类未跟踪才降快审。

**Tech Stack:** Node ESM、`node:test`、`execFileSync`（临时 git 仓库 fixture，模式照抄 tests/spec-lint.test.mjs 的 gitFixture 思路）。

## Global Constraints

- **不动版本号**（四方版本号 conformance 测试锁死，W3 统一 bump）。
- **插件资产不得引用本仓 ADR 编号**。
- **判定必须可解释**：每个输出等级都附命中理由行；三态各配用例（roadmap W2 验收）。
- git 输出一律 `-z` + NUL 分割（W1 的 quotePath 教训）；`maxBuffer: 64 * 1024 * 1024`。
- 工具退出码恒 0（定级是建议不是门禁）；用法 / 环境错误退出 2。
- 每任务收尾跑：`node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs`，全绿才 commit。

---

### Task 1: closeout-gate.mjs + 测试（TDD）

**Files:**
- Create: `plugin/tools/closeout-gate.mjs`
- Test: `tests/closeout-gate.test.mjs`

**Interfaces:**
- Produces: 命令 `node plugin/tools/closeout-gate.mjs [BASE]`；stdout 首行 `closeout-gate: <快速豁免|快审|深审>`，后随 `  - <理由>` 行（Task 2 的 dispatch.md 文案与演练依赖此格式）。

- [ ] **Step 1: 写测试（新文件 tests/closeout-gate.test.mjs，完整内容如下）**

```js
// closeout-gate 自测:临时 git 仓库 fixture,断言三态定级与红线一票升级。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const GATE = join(dirname(dirname(fileURLToPath(import.meta.url))), 'plugin', 'tools', 'closeout-gate.mjs')

const g = (root, ...args) =>
  execFileSync('git', ['-C', root, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' })

/** 建一个已有首提交的仓库。 */
function repo() {
  const root = mkdtempSync(join(tmpdir(), 'closeout-gate-'))
  g(root, 'init', '-q')
  writeFileSync(join(root, 'base.js'), 'export const a = 1\n')
  g(root, 'add', '-A')
  g(root, 'commit', '-qm', 'init')
  return root
}
function write(root, rel, content) {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, content)
}
/** 跑 gate 并清理仓库,返回 { code, output }。 */
function gate(root, base) {
  try {
    const args = [GATE]
    if (base) args.push(base)
    return { code: 0, output: execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8' }) }
  } catch (e) {
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('纯文档改动(不限行数) → 快速豁免', () => {
  const r = repo()
  write(r, 'README.md', '# 行\n'.repeat(100))
  g(r, 'add', '-A')
  const { code, output } = gate(r)
  assert.equal(code, 0)
  assert.match(output, /closeout-gate: 快速豁免/)
  assert.match(output, /纯文档/)
})

test('纯配置数据(json) → 快速豁免', () => {
  const r = repo()
  write(r, 'config.json', `{\n${'  "k": 1,\n'.repeat(50)}  "z": 0\n}\n`)
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /快速豁免/)
})

test('纯注释改动(js,已知注释语法) → 快速豁免', () => {
  const r = repo()
  write(r, 'base.js', `export const a = 1\n${'// 注释行\n'.repeat(30)}`)
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /快速豁免/)
})

test('有效行 < 50 的代码改动 → 快速豁免', () => {
  const r = repo()
  write(r, 'base.js', `export const a = 1\n${'export const x = 1\n'.repeat(30)}`)
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /快速豁免/)
  assert.match(output, /< 50/)
})

test('有效行 ≥ 50 的代码改动 → 快审(默认)', () => {
  const r = repo()
  write(r, 'base.js', `export const a = 1\n${'export const x = 1\n'.repeat(80)}`)
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
})

test('红线面一票取消豁免:hooks.json 一行也不豁免 → 快审', () => {
  const r = repo()
  write(r, 'hooks/hooks.json', '{"hooks":{}}\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面/)
})

test('红线面 + 有效行 ≥ 100 → 深审', () => {
  const r = repo()
  write(r, 'rules/dispatch.md', '规则行\n'.repeat(120))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 深审/)
  assert.match(output, /红线面/)
})

test('总有效行 ≥ 500 → 深审', () => {
  const r = repo()
  write(r, 'big.js', 'export const x = 1\n'.repeat(520))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 深审/)
  assert.match(output, /≥ 500/)
})

test('BASE..HEAD 全为 revert 提交 → 快速豁免', () => {
  const r = repo()
  write(r, 'base.js', 'export const a = 2\n')
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'revert: 撤销上一次改动')
  const { output } = gate(r, 'HEAD~1')
  assert.match(output, /快速豁免/)
  assert.match(output, /revert/)
})

test('未跟踪的非文档类文件 → 快审(内容不可定级)', () => {
  const r = repo()
  write(r, 'stray.js', 'export const s = 1\n')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /未跟踪/)
})

test('未跟踪的纯文档不拦豁免,但提示未计入', () => {
  const r = repo()
  write(r, 'README.md', '# 改动\n')
  g(r, 'add', '-A')
  write(r, 'note.md', '# 散落笔记\n')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快速豁免/)
  assert.match(output, /未计入/)
})

test('空 diff → 快速豁免(无可定级改动)', () => {
  const { output } = gate(repo())
  assert.match(output, /快速豁免/)
})

test('非 git 目录 → 退出码 2', () => {
  const root = mkdtempSync(join(tmpdir(), 'closeout-gate-bare-'))
  const { code } = gate(root)
  assert.equal(code, 2)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/closeout-gate.test.mjs`
Expected: 全部 FAIL（工具不存在）。

- [ ] **Step 3: 实现工具（新文件 plugin/tools/closeout-gate.mjs，完整内容如下）**

```js
#!/usr/bin/env node
/**
 * closeout-gate —— 收口审查定级:输入 diff(相对 BASE),输出三态 + 命中理由。
 * 随 LumioAgent 插件分发;主 loop 收口前调用,替代散文白名单的人工判读。
 * 用法:node tools/closeout-gate.mjs [BASE]
 *   BASE 省略时取 HEAD(定级未提交 + 已暂存改动);传提交号 / 分支名则定级 BASE..工作区。
 *
 * 三态与判定顺序(先命中先生效;本注释是判定规则的单一权威):
 *   1. 红线面(路径段 rules / hooks、文件 hooks.json、.github/workflows/)被触碰
 *      → 有效行 ≥ 100 深审,否则快审;永不豁免(一票取消豁免)。
 *      鉴权 / 安全面机器判不了,不在本工具内——靠人工与 reviewer。
 *   2. BASE..HEAD 全部提交主题以 revert 开头 → 快速豁免
 *   3. 存在未跟踪的**非文档/数据类**文件 → 快审(内容不可定级,先 git add);
 *      纯文档/数据类的未跟踪文件不拦豁免,仅提示未计入定级。
 *   4. 含二进制文件改动 → 快审(不可豁免)
 *   5. 全部文件为纯文档(.md/.txt/.rst) / 纯配置数据(.json/.yaml/.yml/.toml/.csv) /
 *      纯注释改动(已知注释语法的代码文件,改动行全为注释或空行) → 快速豁免(不限行数)
 *   6. 有效行(去空行与注释行)合计 ≥ 500 → 深审
 *   7. 有效行 < 50 → 快速豁免
 *   8. 其余 → 快审
 *
 * 「机械套用既有模式」「生成物随源更新」机器判不了,已从豁免面移除(归快审)。
 * 退出码:恒 0(定级是建议不是门禁);用法 / 环境错误 2。
 */
import { execFileSync } from 'node:child_process'
import { extname, basename } from 'node:path'

const BASE = process.argv[2] ?? 'HEAD'
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })

let files, untracked
try {
  files = git('diff', '--name-only', '-z', BASE).split('\0').filter(Boolean)
  untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
} catch (e) {
  console.error(`closeout-gate: git 失败(${e.status ?? e.code ?? e.message})——需在 git 仓库内运行且 BASE 可解析`)
  process.exit(2)
}

const DOC_EXT = new Set(['.md', '.txt', '.rst'])
const DATA_EXT = new Set(['.json', '.yaml', '.yml', '.toml', '.csv'])
const COMMENT_MARKERS = new Map(Object.entries({
  '.js': ['//', '/*', '*', '*/'], '.mjs': ['//', '/*', '*', '*/'], '.cjs': ['//', '/*', '*', '*/'],
  '.ts': ['//', '/*', '*', '*/'], '.tsx': ['//', '/*', '*', '*/'], '.jsx': ['//', '/*', '*', '*/'],
  '.css': ['/*', '*', '*/'], '.sh': ['#'], '.py': ['#'], '.rb': ['#'],
  '.yml': ['#'], '.yaml': ['#'], '.toml': ['#'], '.html': ['<!--', '-->'],
}))
const isDocOrData = (f) => DOC_EXT.has(extname(f)) || DATA_EXT.has(extname(f))

const isRed = (f) => {
  const segs = f.split('/')
  return segs.includes('rules') || segs.includes('hooks') ||
    basename(f) === 'hooks.json' || f.startsWith('.github/workflows/')
}

let totalEffective = 0
let hasBinary = false
let allWhitelistedType = files.length > 0
for (const f of files) {
  const d = git('diff', '-U0', BASE, '--', f)
  if (/^Binary files /m.test(d)) { hasBinary = true; allWhitelistedType = false; continue }
  const ext = extname(f)
  const markers = COMMENT_MARKERS.get(ext) ?? []
  const changed = d.split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .map((l) => l.slice(1).trim())
  const effective = changed.filter((l) => l && !markers.some((m) => l.startsWith(m)))
  totalEffective += effective.length
  const whitelisted = isDocOrData(f) || (COMMENT_MARKERS.has(ext) && effective.length === 0)
  if (!whitelisted) allWhitelistedType = false
}

let isRevert = false
if (BASE !== 'HEAD') {
  try {
    const subjects = git('log', '--format=%s', `${BASE}..HEAD`).split('\n').filter(Boolean)
    isRevert = subjects.length > 0 && subjects.every((s) => /^revert/i.test(s))
  } catch { /* BASE 可解析但无提交区间时不阻断 */ }
}

const redFiles = files.filter(isRed)
const untrackedBlocking = untracked.filter((f) => !isDocOrData(f))
const untrackedDocs = untracked.filter(isDocOrData)
const reasons = []
let level

if (files.length === 0 && untrackedBlocking.length === 0 && untrackedDocs.length === 0) {
  level = '快速豁免'
  reasons.push('空 diff——没有可定级的改动')
} else if (redFiles.length > 0) {
  level = totalEffective >= 100 ? '深审' : '快审'
  reasons.push(`红线面被触碰(${redFiles.join('、')})——一票取消豁免,永不快速`)
  if (level === '深审') reasons.push(`红线面 + 有效行 ${totalEffective} ≥ 100`)
} else if (isRevert) {
  level = '快速豁免'
  reasons.push('BASE..HEAD 全部为 revert 提交')
} else if (untrackedBlocking.length > 0) {
  level = '快审'
  reasons.push(`存在未跟踪的非文档类文件(${untrackedBlocking.join('、')})——内容不可定级,先 git add`)
} else if (hasBinary) {
  level = '快审'
  reasons.push('含二进制文件改动——不可豁免')
} else if (files.length > 0 && allWhitelistedType) {
  level = '快速豁免'
  reasons.push('全部文件为纯文档 / 配置数据 / 纯注释改动')
} else if (totalEffective >= 500) {
  level = '深审'
  reasons.push(`有效行 ${totalEffective} ≥ 500`)
} else if (totalEffective < 50) {
  level = '快速豁免'
  reasons.push(`有效行 ${totalEffective} < 50(去空行与注释)`)
} else {
  level = '快审'
  reasons.push(`默认——白名单未命中(有效行 ${totalEffective})`)
}

if (untrackedDocs.length > 0) {
  reasons.push(`提示:未跟踪的文档/数据文件未计入定级(${untrackedDocs.join('、')})`)
}

console.log(`closeout-gate: ${level}`)
for (const r of reasons) console.log(`  - ${r}`)
```

- [ ] **Step 4: 跑测试确认全绿**

Run: `node --test tests/closeout-gate.test.mjs`
Expected: 13/13 PASS。再跑全门槛（Global Constraints 的命令）全绿。

- [ ] **Step 5: Commit**

```bash
git add plugin/tools/closeout-gate.mjs tests/closeout-gate.test.mjs
git commit -m "feat(gate): closeout-gate 三态定级——快速模式白名单从散文变命令"
```

---

### Task 2: dispatch.md 白名单段接入 + 真实 diff 演练

**Files:**
- Modify: `plugin/rules/dispatch.md`（「快速模式」bullet 整段替换）

**Interfaces:**
- Consumes: Task 1 的命令与输出格式。

- [ ] **Step 1: 替换 dispatch.md 快速模式段**

old（整个 bullet）：

```text
- **快速模式(收口白名单,默认优先尝试):** 纯文档 / 纯注释 / 纯配置数据 / 机械套用既有模式 / revert / 生成物随源更新 / 有效 diff < 20 行(去空行注释)——lint + 测试直接收口,交付附一行豁免声明,不派任何 agent。判定须机器可判(文件类型 + diff 行数),拿不准 = 快审。**红线面永不快速**:触碰 `rules/`、鉴权、安全面、可执行配置(如 hooks)的改动至少快审。
```

new：

```text
- **快速模式(收口白名单,默认优先尝试):** 收口前跑 `closeout-gate`(随插件分发于 `tools/closeout-gate.mjs`,判定规则与阈值的单一权威是其头注释)定级——`快速豁免` 即 lint + 测试直接收口,交付附一行豁免声明与工具输出,不派任何 agent;`快审` / `深审` 按「审查闭环」走。白名单为机器可判子集(纯文档 / 纯注释 / 纯配置数据 / revert / 有效行 < 50);「机械套用既有模式」「生成物随源更新」机器判不了,不再豁免。**红线面永不快速**:`rules/`、hooks 等可执行配置由工具一票取消豁免;鉴权 / 安全面工具判不了,触碰时人工按至少快审处理。
```

- [ ] **Step 2: 真实 diff 演练（roadmap W2 验收）**

Run: `node plugin/tools/closeout-gate.mjs main`
Expected: 理由含「红线面被触碰」（本波改了 `plugin/rules/dispatch.md`），等级为 `快审` 或 `深审`（取决于有效行是否 ≥ 100）。把实际输出原样记入交回物。

- [ ] **Step 3: 全门槛 + Commit**

```bash
node plugin/tools/plugin-lint.mjs && node plugin/tools/spec-lint.mjs && node --test tests/*.test.mjs
git add plugin/rules/dispatch.md
git commit -m "feat(rules): 快速模式白名单接入 closeout-gate——散文判定退役"
```

- [ ] **Step 4: 本计划状态流转**

把本文件 frontmatter 改为 `status: completed`，commit：

```bash
git add .spec/plans/2026-09-01-w2-closeout-gate.md
git commit -m "chore(spec): W2 closeout-gate 收口"
```
