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
/** 跑 gate 并清理仓库,返回 { code, output }。cwd 默认仓库根,可传子目录验证根定界。 */
function gate(root, base, cwd = root) {
  try {
    const args = [GATE]
    if (base) args.push(base)
    return { code: 0, output: execFileSync(process.execPath, args, { cwd, encoding: 'utf8' }) }
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

test('未跟踪的红线面文档不豁免 → 快审', () => {
  const r = repo()
  write(r, 'rules/new-rule.md', '新红线\n')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /未跟踪/)
  assert.doesNotMatch(output, /未计入/) // 已拦级的文件不得再自称未计入(对称排除)
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

// ——— 审查退回加固:根定界 / 防改名逃逸 / BASE 校验 / pathspec / 宽松化锚定 ———

test('大体量纯删除按新增 0 行计 → 快速豁免(锚定「只计新增」,churn 会判深审)', () => {
  const r = repo()
  write(r, 'big.js', 'export const z = 1\n'.repeat(520))
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'big')
  rmSync(join(r, 'big.js'))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /快速豁免/)
  assert.match(output, /纯删除/)
})

test('整体重写按新增行计 → 快速豁免且有效行为 30(锚定不含删除行)', () => {
  const r = repo()
  write(r, 'base.js', 'export const y = 1\n'.repeat(30))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /快速豁免/)
  assert.match(output, /有效行 30 </)
})

test('320 行新增 → 快审(防 500 深审阈值被收紧)', () => {
  const r = repo()
  write(r, 'mid.js', 'export const m = 1\n'.repeat(320))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
})

test('子目录内运行:未跟踪文件仍按仓库根扫描,不漏', () => {
  const r = repo()
  write(r, 'sub/keep.txt', 'x\n')
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'sub')
  write(r, 'stray.js', 'export const s = 1\n')
  const { output } = gate(r, undefined, join(r, 'sub'))
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /未跟踪/)
})

test('子目录内运行:未跟踪红线面路径按仓库根归一,仍判红线', () => {
  const r = repo()
  write(r, 'sub/keep.txt', 'x\n')
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'sub')
  write(r, '.claude/settings.json', '{"a":1}\n')
  const { output } = gate(r, undefined, join(r, 'sub'))
  assert.match(output, /closeout-gate: 快审/)
  assert.doesNotMatch(output, /\.\.\//) // 路径不得带 ../,否则红线前缀判定失效
})

test('红线文件改名移出 rules/ 不得逃逸红线分支', () => {
  const r = repo()
  write(r, 'rules/old.md', '规则行\n'.repeat(40))
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'add rule')
  mkdirSync(join(r, 'docs'), { recursive: true })
  g(r, 'mv', 'rules/old.md', 'docs/new.md')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面/)
  assert.match(output, /rules\/old\.md/) // 源路径必须现身,否则改名即逃逸
})

test('BASE 以 - 开头 → 退出码 2(不得被当 git 选项吞掉)', () => {
  const r = repo()
  const { code, output } = gate(r, '-z')
  assert.equal(code, 2)
  assert.match(output, /BASE/)
})

test('BASE 不可解析 → 退出码 2', () => {
  const r = repo()
  const { code, output } = gate(r, 'no-such-ref')
  assert.equal(code, 2)
  assert.match(output, /BASE/)
})

test('冒号开头的文件名不得因 pathspec 魔法被当空 diff 豁免', () => {
  const r = repo()
  write(r, ':weird.js', 'export const w = 1\n'.repeat(80))
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
})

test('revertigo 前缀不得蹭 revert 豁免', () => {
  const r = repo()
  write(r, 'base.js', `export const a = 1\n${'export const x = 1\n'.repeat(80)}`)
  g(r, 'add', '-A')
  g(r, 'commit', '-qm', 'revertigo: 蹭豁免')
  const { output } = gate(r, 'HEAD~1')
  assert.match(output, /closeout-gate: 快审/)
  assert.doesNotMatch(output, /全部为 revert 提交/)
})

test('.claude/ 与 .circleci/ 计入红线面', () => {
  const r = repo()
  write(r, '.claude/settings.json', '{"a":1}\n')
  write(r, '.circleci/config.yml', 'jobs: {}\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面/)
})

test('嵌套 .claude/ 也计入红线面(Claude Code 会读子目录 settings)', () => {
  const r = repo()
  write(r, 'packages/app/.claude/settings.json', '{"a":1}\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面/)
})

test('.gitlab-ci.yml 计入红线面', () => {
  const r = repo()
  write(r, '.gitlab-ci.yml', 'stages: []\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面/)
})

// ——— 语义红线面机器判别子集(wire/abi/schema/snapshot/ledger/budget/migration) ———

test('触碰 wire 路径的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'engine/wire/voxel-world.json', '{\n  "version": 2\n}\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 abi 路径的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'crates/abi/mod.rs', 'pub const ABI: u32 = 1;\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 *.schema.json 的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'config/player.schema.json', '{\n  "title": "Player"\n}\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 *snapshot* 文件的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'crates/world/src/snapshot_closure.rs', 'pub struct Snapshot;\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 *ledger* 文件的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'src/tx_ledger.ts', 'export const ledger = [];\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 *budget* 文件的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'src/resource-budget.rs', 'pub const BUDGET: usize = 64;\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('触碰 *migration* 文件的 3 行 diff 不得判为快速豁免 → 快审', () => {
  const r = repo()
  write(r, 'db/001_initial_migration.sql', 'CREATE TABLE test (id INT);\n')
  g(r, 'add', '-A')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /红线面被触碰/)
})

test('未跟踪的语义红线文件(如 wire/foo.json)一票阻断快速豁免', () => {
  const r = repo()
  write(r, 'engine/wire/delta.json', '{\n  "delta": true\n}\n')
  // 不 git add,保持未跟踪
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /未跟踪的非文档类或红线面文件/)
})

