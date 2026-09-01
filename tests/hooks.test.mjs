// hook 脚本的行为契约。这两个脚本原本内联在 settings.json 的字符串里(一行 node,
// 转义层层嵌套、无法测试);拆成文件后由本测试锁住关键行为。

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildRulesContext } from '../plugin/tools/inject-rules.mjs'
import { isGitCommit } from '../plugin/tools/guard-commit.mjs'

function fixture(rules) {
  const root = mkdtempSync(join(tmpdir(), 'lumio-hooks-'))
  if (rules) {
    mkdirSync(join(root, 'rules'), { recursive: true })
    for (const [name, body] of Object.entries(rules)) {
      writeFileSync(join(root, 'rules', name), body)
    }
  }
  return root
}

const withFixture = (rules, fn) => {
  const root = fixture(rules)
  try { fn(root) } finally { rmSync(root, { recursive: true, force: true }) }
}

describe('inject-rules:红线常驻注入', () => {
  test('把 rules/ 下每个 .md 全量拼进上下文', () => {
    withFixture({ 'system.md': '# 红线\n不得外发密钥。', 'dispatch.md': '# 调度\n主 loop 派活。' }, (root) => {
      const ctx = buildRulesContext(root)
      assert.ok(ctx.includes('不得外发密钥'), '缺 system.md 内容')
      assert.ok(ctx.includes('主 loop 派活'), '缺 dispatch.md 内容')
    })
  })

  test('新增规则文件无需登记即自动生效(glob 而非登记表)', () => {
    withFixture({ 'system.md': 'A', 'brand-new-rule.md': '这条从未在任何索引登记' }, (root) => {
      assert.ok(buildRulesContext(root).includes('这条从未在任何索引登记'))
    })
  })

  test('README.md 是目录说明不是规则,不注入', () => {
    withFixture({ 'system.md': 'A', 'README.md': '这是目录说明不是规则' }, (root) => {
      assert.ok(!buildRulesContext(root).includes('这是目录说明不是规则'))
    })
  })

  test('顺序稳定:按文件名排序,避免每次会话上下文抖动', () => {
    withFixture({ 'z.md': 'ZZZ', 'a.md': 'AAA' }, (root) => {
      const ctx = buildRulesContext(root)
      assert.ok(ctx.indexOf('AAA') < ctx.indexOf('ZZZ'), 'a.md 应排在 z.md 之前')
    })
  })

  test('没有 rules/ 目录时返回空串而非抛错', () => {
    withFixture(null, (root) => assert.equal(buildRulesContext(root), ''))
  })
})

describe('guard-commit:提交前拦截的命中判定', () => {
  const HITS = [
    'git commit -m "x"',
    'git commit',
    '  git   commit  --amend',
    'cd /tmp && git commit -m "x"',
    'git -C /repo commit -m x',
    'git add -A; git commit -m x',
  ]
  for (const cmd of HITS) {
    test(`命中:${cmd}`, () => assert.equal(isGitCommit(cmd), true))
  }

  // 误报会挡住无关操作——旧的内联 hook 就因为按原始文本匹配,把正文含该字样的
  // heredoc 写入也拦了下来。
  const MISSES = [
    'git status',
    'git log --oneline',
    'echo "git commit"',
    "echo 'git commit -m x'",
    'git commit-tree abc',
    'grep -r "git commit" .',
    '',
  ]
  for (const cmd of MISSES) {
    test(`不命中:${JSON.stringify(cmd)}`, () => assert.equal(isGitCommit(cmd), false))
  }
})
