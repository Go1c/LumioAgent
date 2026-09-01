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

test('未跟踪的红线面文档不豁免 → 快审', () => {
  const r = repo()
  write(r, 'rules/new-rule.md', '新红线\n')
  const { output } = gate(r)
  assert.match(output, /closeout-gate: 快审/)
  assert.match(output, /未跟踪/)
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
