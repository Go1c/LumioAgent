// spec-lint 自测(项目侧):在临时目录搭 fixture 仓库,断言各类违规被抓、合法仓库全绿。
// 运行:node --test tools/spec-lint.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const LINT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'plugin', 'tools', 'spec-lint.mjs')

/** 生成一个最小合法项目,返回根路径;overrides 可改写/追加文件(值为 null 表示删除该默认文件)。 */
function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'spec-lint-fixture-'))
  const files = {
    '.spec/AGENTS.md': '# 项目中心文档\n\n## 收口门槛\n\n`npm test`\n',
    '.spec/decisions/README.md': '# 决策索引\n',
    '.spec/tasks/README.md': '# 任务卡格式\n',
    '.spec/knowledge/README.md': [
      '---', 'name: knowledge', 'description: 导航', 'metadata:', '  type: index', '---', '',
      '# 导航', '', '| 文档 | 一句话 |', '|------|--------|',
      '| [`standards/workflow.md`](standards/workflow.md) | 工作流 |',
      '| [`features/_TEMPLATE.md`](features/_TEMPLATE.md) | 模板 |', '',
    ].join('\n'),
    '.spec/knowledge/standards/workflow.md':
      '---\nname: workflow\ndescription: 工作流\nmetadata:\n  type: doc\n  status: 已交付\n---\n\n# 工作流\n',
    '.spec/knowledge/features/_TEMPLATE.md':
      '---\nname: template\ndescription: 模板\nmetadata:\n  type: doc\n  status: 设计中\n---\n\n# 模板\n',
    ...overrides,
  }
  for (const [rel, content] of Object.entries(files)) {
    if (content === null) continue
    const p = join(root, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content)
  }
  return root
}

/** 跑 lint,返回 { code, output }。 */
function lint(root) {
  try {
    const out = execFileSync(process.execPath, [LINT, root], { encoding: 'utf8' })
    return { code: 0, output: out }
  } catch (e) {
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('最小合法项目全绿', () => {
  const { code, output } = lint(fixture())
  assert.equal(code, 0, output)
  assert.match(output, /OK/)
})

// 插件会装进任何项目,包括从没跑过 /lumio:init 的。守卫不该反过来卡住它们。
test('没有 .spec/ 的项目静默通过', () => {
  const root = mkdtempSync(join(tmpdir(), 'spec-lint-bare-'))
  writeFileSync(join(root, 'README.md'), '# 一个还没接入 LumioAgent 的项目\n')
  const { code, output } = lint(root)
  assert.equal(code, 0, output)
})

test('knowledge 文档未登记导航被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/knowledge/standards/orphan.md':
      '---\nname: orphan\ndescription: 没人登记\nmetadata:\n  type: doc\n  status: 已交付\n---\n\n# 孤儿\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /未登记进 knowledge\/README\.md/)
})

test('ADR 未登记进 decisions 索引被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/decisions/0001-choose-db.md': '# 0001 选型\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /未登记进 decisions\/README\.md/)
})

test('悬空链接被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/AGENTS.md': '# 中心文档\n\n见 [没有的文件](nope/missing.md)。\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /悬空链接/)
})

test('status 非枚举被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/knowledge/standards/workflow.md':
      '---\nname: workflow\ndescription: 工作流\nmetadata:\n  type: doc\n  status: 进行中\n---\n\n# 工作流\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /不在枚举/)
})

test('description 多行标量被抓(不再绕过长度校验)', () => {
  const { code, output } = lint(fixture({
    '.spec/knowledge/standards/workflow.md':
      '---\nname: workflow\ndescription: >\n  很长很长\nmetadata:\n  type: doc\n  status: 已交付\n---\n\n# 工作流\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /必须单行明文/)
})

test('任务卡 status 非枚举被抓', () => {
  const { code, output } = lint(fixture({ '.spec/tasks/t1.md': '---\nstatus: 做完了\n---\n\n# 卡\n' }))
  assert.equal(code, 1)
  assert.match(output, /不在枚举/)
})

test('任务卡缺 frontmatter 被抓', () => {
  const { code, output } = lint(fixture({ '.spec/tasks/t1.md': '# 卡\n' }))
  assert.equal(code, 1)
  assert.match(output, /缺少 frontmatter/)
})

test('任务卡多余 frontmatter 字段被抓', () => {
  const { code, output } = lint(fixture({
    '.spec/tasks/t1.md': '---\nstatus: pending\nowner: me\n---\n\n# 卡\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /只允许 status/)
})

test('合法任务卡通过,子目录与 README 不校验', () => {
  const { code, output } = lint(fixture({
    '.spec/tasks/t1.md': '---\nstatus: in_progress\n---\n\n# 卡\n',
    '.spec/tasks/done/t0.md': '# 归档卡,不校验\n',
  }))
  assert.equal(code, 0, output)
})

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
