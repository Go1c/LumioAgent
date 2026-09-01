// /lumio:init 的行为契约。脚手架释放必须是确定性的:不覆盖用户已有文件、
// 指针不重复追加——否则反复跑 init 会破坏项目内容。

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { initScaffold, POINTER_MARKER } from '../plugin/tools/init-scaffold.mjs'

const pluginRoot = join(dirname(dirname(fileURLToPath(import.meta.url))), 'plugin')

const withTarget = (fn) => {
  const target = mkdtempSync(join(tmpdir(), 'lumio-init-'))
  try { fn(target) } finally { rmSync(target, { recursive: true, force: true }) }
}

describe('init-scaffold:脚手架释放', () => {
  test('空目录:模板全量落地', () => {
    withTarget((target) => {
      const result = initScaffold({ pluginRoot, target })
      assert.ok(result.created.length > 0, '没有创建任何文件')
      assert.ok(existsSync(join(target, '.spec/AGENTS.md')))
      assert.ok(existsSync(join(target, '.spec/knowledge/README.md')))
      assert.ok(existsSync(join(target, '.spec/decisions/README.md')))
      assert.ok(existsSync(join(target, '.spec/tasks/README.md')))
      assert.ok(existsSync(join(target, '.spec/plans/README.md')))
      assert.deepEqual(result.skipped, [], '空目录不应有跳过项')
    })
  })

  test('已有同名文件:跳过而非覆盖(用户内容不可损毁)', () => {
    withTarget((target) => {
      mkdirSync(join(target, '.spec'), { recursive: true })
      writeFileSync(join(target, '.spec/AGENTS.md'), '我自己写的内容')
      const result = initScaffold({ pluginRoot, target })
      assert.equal(readFileSync(join(target, '.spec/AGENTS.md'), 'utf8'), '我自己写的内容')
      assert.ok(result.skipped.includes('.spec/AGENTS.md'), '应记录跳过')
      assert.ok(existsSync(join(target, '.spec/knowledge/README.md')), '其余文件仍应创建')
    })
  })

  test('--force:显式要求时才覆盖', () => {
    withTarget((target) => {
      mkdirSync(join(target, '.spec'), { recursive: true })
      writeFileSync(join(target, '.spec/AGENTS.md'), '旧内容')
      initScaffold({ pluginRoot, target, force: true })
      assert.notEqual(readFileSync(join(target, '.spec/AGENTS.md'), 'utf8'), '旧内容')
    })
  })

  test('宿主入口不存在时创建,并写入指针', () => {
    withTarget((target) => {
      initScaffold({ pluginRoot, target })
      for (const entry of ['CLAUDE.md', 'AGENTS.md']) {
        const text = readFileSync(join(target, entry), 'utf8')
        assert.ok(text.includes(POINTER_MARKER), `${entry} 缺指针标记`)
        assert.ok(text.includes('.spec/AGENTS.md'), `${entry} 未指向项目中心文档`)
      }
    })
  })

  test('宿主入口已存在:追加指针且保留原内容', () => {
    withTarget((target) => {
      writeFileSync(join(target, 'CLAUDE.md'), '# 我的项目\n\n原有说明。\n')
      initScaffold({ pluginRoot, target })
      const text = readFileSync(join(target, 'CLAUDE.md'), 'utf8')
      assert.ok(text.includes('原有说明。'), '原内容被破坏')
      assert.ok(text.includes(POINTER_MARKER), '未追加指针')
    })
  })

  test('重复跑 init:指针只出现一次(幂等)', () => {
    withTarget((target) => {
      initScaffold({ pluginRoot, target })
      initScaffold({ pluginRoot, target })
      const text = readFileSync(join(target, 'CLAUDE.md'), 'utf8')
      assert.equal(text.split(POINTER_MARKER).length - 1, 1, '指针被重复追加')
    })
  })
})
