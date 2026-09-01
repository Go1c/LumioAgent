// Agent Plugins 1.0.0 合规:仓库根即插件根。
//
// 存在的理由:规范的 plugin.json 是**封闭 schema**——多一个顶层字段就是违规,而客户端
// 不会在加载时去拉 schema 校验,只会静默拒载或忽略。这层测试把「复制 package.json 时
// 带进来一个 main 字段」这类错误挡在提交之前。
//
// 规范全文:https://agent-plugins.org/specification

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
// 插件根是仓库的子目录:发布物只包含 plugin/,开发过程文件留在仓库根不下发。
const PLUGIN_DIR = 'plugin'
const pluginRoot = join(repoRoot, PLUGIN_DIR)

const PLUGIN_SCHEMA_ID = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const MCP_SCHEMA_ID = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

/** §5.2:清单的顶层字段白名单,多一个都算违规。 */
const ALLOWED_TOP_LEVEL = new Set([
  '$schema', 'name', 'version', 'description', 'author',
  'homepage', 'repository', 'license', 'keywords', 'extensions',
])

/** §5.4:author 对象只允许这三个键。 */
const ALLOWED_AUTHOR_KEYS = new Set(['name', 'email', 'url'])

function readJson(base, relativePath) {
  const absolute = join(base, relativePath)
  assert.ok(existsSync(absolute), `缺少 ${relativePath}`)
  return JSON.parse(readFileSync(absolute, 'utf8'))
}

const manifest = readJson(pluginRoot, 'plugin.json')

describe('Agent Plugins 1.0.0 清单', () => {
  test('$schema 是 1.0.0 的规范标识符原文', () => {
    // 客户端靠这个字符串选本地校验规则,写错等于整个插件被拒载。
    assert.equal(manifest.$schema, PLUGIN_SCHEMA_ID)
  })

  test('name 满足 §5.5 的全部命名约束', () => {
    const { name } = manifest
    assert.equal(typeof name, 'string')
    assert.ok(name.length >= 1 && name.length <= 64, `name 长度 ${name.length} 不在 1–64`)
    assert.match(name, /^[a-z0-9.-]+$/, 'name 只允许小写字母、数字、连字符与句点')
    assert.match(name[0], /[a-z0-9]/, 'name 首字符必须是字母或数字')
    assert.match(name[name.length - 1], /[a-z0-9]/, 'name 末字符必须是字母或数字')
    assert.doesNotMatch(name, /--/, 'name 不得含连续连字符')
    assert.doesNotMatch(name, /\.\./, 'name 不得含连续句点')
  })

  test('顶层字段封闭:不得出现规范之外的键', () => {
    const unknown = Object.keys(manifest).filter((key) => !ALLOWED_TOP_LEVEL.has(key))
    assert.deepEqual(unknown, [], `plugin.json 出现规范外顶层字段:${unknown.join(', ')}`)
  })

  test('author 对象只含 name / email / url', () => {
    if (manifest.author === undefined) return
    assert.equal(typeof manifest.author, 'object')
    const unknown = Object.keys(manifest.author).filter((key) => !ALLOWED_AUTHOR_KEYS.has(key))
    assert.deepEqual(unknown, [], `author 出现规范外字段:${unknown.join(', ')}`)
    for (const [key, value] of Object.entries(manifest.author)) {
      assert.equal(typeof value, 'string', `author.${key} 必须是字符串`)
    }
  })

  test('元数据字段类型正确,且 license 有对应文件', () => {
    for (const [field, expected] of [
      ['version', 'string'], ['description', 'string'], ['homepage', 'string'],
      ['repository', 'string'], ['license', 'string'],
    ]) {
      if (manifest[field] !== undefined) {
        assert.equal(typeof manifest[field], expected, `${field} 类型应为 ${expected}`)
      }
    }
    assert.ok(Array.isArray(manifest.keywords ?? []), 'keywords 必须是数组')
    if (manifest.license) {
      assert.ok(existsSync(join(pluginRoot, 'LICENSE')), '声明了 license 却没有 LICENSE 文件')
    }
  })

  test('mcp.json 若存在则必须与 plugin.json 同版本(§10.1)', () => {
    const mcpPath = join(pluginRoot, 'mcp.json')
    if (!existsSync(mcpPath)) return
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
    assert.equal(mcp.$schema, MCP_SCHEMA_ID)
    assert.deepEqual(Object.keys(mcp).sort(), ['$schema', 'mcpServers'],
      'mcp.json 顶层只允许 $schema 与 mcpServers')
  })
})

describe('组件发现(§6.1 固定位置)', () => {
  const skillsRoot = join(pluginRoot, 'skills')

  test('skills/ 在插件根,且每个直接子目录都有 SKILL.md', () => {
    assert.ok(existsSync(skillsRoot) && statSync(skillsRoot).isDirectory(), 'skills 必须是目录')
    const entries = readdirSync(skillsRoot, { withFileTypes: true })
    assert.ok(entries.length > 0, 'skills/ 是空的')
    for (const entry of entries) {
      assert.ok(entry.isDirectory(), `skills/${entry.name} 不是目录——技能必须是直接子目录`)
      const skillFile = join(skillsRoot, entry.name, 'SKILL.md')
      assert.ok(existsSync(skillFile), `skills/${entry.name} 缺少 SKILL.md`)
      assert.ok(statSync(skillFile).isFile(), `skills/${entry.name}/SKILL.md 不是普通文件`)
    }
  })

  test('每个 SKILL.md 的 frontmatter name 与目录名一致,且有非空 description', () => {
    // 客户端不会递归找更深的 SKILL.md(§7.1),名字对不上就是加载不到。
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      const text = readFileSync(join(skillsRoot, entry.name, 'SKILL.md'), 'utf8')
      const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)
      assert.ok(frontmatter, `skills/${entry.name}/SKILL.md 缺少 frontmatter`)

      const name = /^name:\s*(\S+)\s*$/m.exec(frontmatter[1])?.[1]
      assert.equal(name, entry.name, `skills/${entry.name} 的 frontmatter name 与目录名不一致`)

      const description = /^description:\s*(.+)$/m.exec(frontmatter[1])?.[1]
      assert.ok(description?.trim().length > 20, `skills/${entry.name} 的 description 过短或缺失`)
    }
  })

  test('agents/ 下每个 .md 的 frontmatter name 与文件名一致', () => {
    const agentsRoot = join(pluginRoot, 'agents')
    assert.ok(existsSync(agentsRoot), '缺少 agents/ 目录')
    const files = readdirSync(agentsRoot).filter((n) => n.endsWith('.md'))
    assert.ok(files.length > 0, 'agents/ 是空的')
    for (const file of files) {
      const text = readFileSync(join(agentsRoot, file), 'utf8')
      const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)
      assert.ok(frontmatter, `agents/${file} 缺少 frontmatter`)
      const name = /^name:\s*(\S+)\s*$/m.exec(frontmatter[1])?.[1]
      assert.equal(name, file.replace(/\.md$/, ''), `agents/${file} 的 name 与文件名不一致`)
    }
  })
})

describe('双格式共存', () => {
  test('Claude Code 的清单仍在 .claude-plugin/,且与规范清单同名同版本', () => {
    const claude = readJson(pluginRoot, '.claude-plugin/plugin.json')
    assert.equal(claude.name, manifest.name, '两份清单的 name 必须一致')
    assert.equal(claude.version, manifest.version, '两份清单的 version 必须一致')
  })

  test('Claude 清单不得声明组件字段——声明即屏蔽同名默认目录', () => {
    // folder-shadowed-by-manifest:清单一旦显式声明,skills/ agents/ commands/ hooks/
    // 就不再被自动发现。这类错误不报错,只让组件凭空消失。
    const claude = readJson(pluginRoot, '.claude-plugin/plugin.json')
    const shadowing = ['commands', 'agents', 'skills', 'hooks'].filter((k) => k in claude)
    assert.deepEqual(shadowing, [], `声明了会屏蔽默认目录的字段:${shadowing.join(', ')}`)
  })

  // marketplace.json 留在仓库根(claude plugin marketplace add <repo> 从这里发现),
  // 但插件本体在子目录 —— source 必须用 git-subdir 指准,否则用户会装到整个仓库。
  test('marketplace 用 git-subdir 指向插件子目录', () => {
    const marketplace = readJson(repoRoot, '.claude-plugin/marketplace.json')
    const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name)
    assert.ok(entry, `marketplace.json 里找不到名为 ${manifest.name} 的条目`)
    assert.equal(entry.source?.source, 'git-subdir', 'source 应为 git-subdir')
    assert.equal(entry.source?.path, PLUGIN_DIR, `git-subdir 的 path 应为 ${PLUGIN_DIR}`)
    assert.ok(entry.source?.url, 'git-subdir 必须给 url')
  })

  // 发布面不得混入开发过程文件 —— 它们会被原样装进用户机器。
  test('插件目录不含开发过程文件', () => {
    for (const leaked of ['tests', '.spec', 'package.json', '.gitignore', '.claude']) {
      assert.ok(!existsSync(join(pluginRoot, leaked)), `plugin/ 混入了开发过程文件:${leaked}`)
    }
  })

  test('版本号四方一致:plugin.json / .claude-plugin / package.json / CHANGELOG', () => {
    const version = manifest.version
    assert.equal(readJson(repoRoot, 'package.json').version, version, 'package.json 版本不一致')
    const changelog = readFileSync(join(repoRoot, 'CHANGELOG.md'), 'utf8')
    assert.ok(changelog.includes(`## [${version}]`), `CHANGELOG.md 缺少 ${version} 的条目`)
  })
})
