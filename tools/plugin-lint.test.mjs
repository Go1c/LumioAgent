// plugin-lint 自测:在临时目录搭最小合法插件,断言各类违规被抓、合法插件全绿。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const LINT = join(dirname(fileURLToPath(import.meta.url)), 'plugin-lint.mjs')

function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'plugin-lint-fixture-'))
  const files = {
    'plugin.json': JSON.stringify({
      $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
      name: 'demo', version: '1.0.0',
    }),
    '.claude-plugin/plugin.json': JSON.stringify({ name: 'demo', version: '1.0.0' }),
    '.claude-plugin/marketplace.json': JSON.stringify({
      name: 'demo-mp', description: '演示', owner: { name: 'x' },
      plugins: [{ name: 'demo', source: './' }],
    }),
    'hooks/hooks.json': JSON.stringify({
      hooks: { SessionStart: [{ matcher: 'startup', hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/tools/inject-rules.mjs"' }] }] },
    }),
    'tools/inject-rules.mjs': '// stub\n',
    'rules/system.md': '# 红线\n',
    'skills/demo/SKILL.md': '---\nname: demo\ndescription: 演示技能,描述要够长以便被识别\n---\n\n# Demo\n',
    'agents/reviewer.md': '---\nname: reviewer\ndescription: 审查\n---\n\n# Reviewer\n',
    'rules/dispatch.md': '# 调度\n\n| 名称 | 职责 |\n|------|------|\n| `reviewer` | 审查 |\n',
    'templates/.spec/AGENTS.md': '# 项目中心文档\n',
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

function lint(root) {
  try {
    return { code: 0, output: execFileSync(process.execPath, [LINT, root], { encoding: 'utf8' }) }
  } catch (e) {
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('最小合法插件全绿', () => {
  const { code, output } = lint(fixture())
  assert.equal(code, 0, output)
  assert.match(output, /OK/)
})

test('缺根 plugin.json 被抓', () => {
  const { code, output } = lint(fixture({ 'plugin.json': null }))
  assert.equal(code, 1)
  assert.match(output, /plugin\.json/)
})

test('agent frontmatter 多余字段被抓', () => {
  const { code, output } = lint(fixture({
    'agents/reviewer.md': '---\nname: reviewer\ndescription: 审查\ntools: "*"\n---\n\n# R\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /只允许 name\+description/)
})

test('agent name 与文件名不一致被抓', () => {
  const { code, output } = lint(fixture({
    'agents/reviewer.md': '---\nname: auditor\ndescription: 审查\n---\n\n# R\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /与文件名/)
})

test('名册幽灵行被抓(名册有、文件无)', () => {
  const { code, output } = lint(fixture({
    'rules/dispatch.md': '# 调度\n\n| 名称 | 职责 |\n|------|------|\n| `reviewer` | 审查 |\n| `ghost` | 不存在 |\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /名册幽灵行/)
})

test('agent 未登记进名册被抓', () => {
  const { code, output } = lint(fixture({ 'rules/dispatch.md': '# 调度\n\n没有名册表。\n' }))
  assert.equal(code, 1)
  assert.match(output, /未登记进/)
})

test('skill name 与目录名不一致被抓', () => {
  const { code, output } = lint(fixture({
    'skills/demo/SKILL.md': '---\nname: other\ndescription: 演示技能,描述要够长以便被识别\n---\n\n# D\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /与目录名/)
})

// 插件化后技能要跨客户端可移植,frontmatter 白名单必须容纳 Agent Skills 标准的可选字段。
test('skill 带 Agent Skills 标准可选字段仍然通过', () => {
  const { code, output } = lint(fixture({
    'skills/demo/SKILL.md':
      '---\nname: demo\ndescription: 演示技能,描述要够长以便被识别\nlicense: MIT\nallowed-tools: Read, Bash\n---\n\n# D\n',
  }))
  assert.equal(code, 0, output)
})

test('skill 带规范外字段被抓', () => {
  const { code, output } = lint(fixture({
    'skills/demo/SKILL.md': '---\nname: demo\ndescription: 演示技能,描述要够长以便被识别\nbogus: x\n---\n\n# D\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /规范外字段/)
})

// 规则常驻的机制保证:hook 必须真的存在并指向注入脚本,否则红线静默不加载。
test('SessionStart hook 缺失被抓', () => {
  const { code, output } = lint(fixture({
    'hooks/hooks.json': JSON.stringify({ hooks: { PreToolUse: [] } }),
  }))
  assert.equal(code, 1)
  assert.match(output, /SessionStart/)
})

test('注入脚本不存在被抓', () => {
  const { code, output } = lint(fixture({ 'tools/inject-rules.mjs': null }))
  assert.equal(code, 1)
  assert.match(output, /inject-rules/)
})

test('悬空链接被抓', () => {
  const { code, output } = lint(fixture({
    'rules/system.md': '# 红线\n\n见 [没有的](nope.md)。\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /悬空链接/)
})

// 模板会被复制进用户项目,一旦引用插件内路径就会在那边变成悬空链接。
test('模板引用插件资产路径被抓', () => {
  const { code, output } = lint(fixture({
    'templates/.spec/AGENTS.md': '# 项目\n\n见 [红线](../../rules/system.md)。\n',
  }))
  assert.equal(code, 1)
  assert.match(output, /模板不得引用插件资产/)
})
