#!/usr/bin/env node
/**
 * plugin-lint —— **插件自身**的结构一致性校验。只在 LumioAgent 插件仓内跑(CI + /lumio:lint)。
 * 用法:node tools/plugin-lint.mjs [插件根目录]   (省略参数时取本脚本上级目录)
 *
 * 边界:项目实例数据(knowledge / decisions / tasks)由 tools/spec-lint.mjs 校验。
 * 两者分开,是为了让装了插件的下游项目不被插件自身的结构校验项误伤。
 * Agent Plugins 1.0.0 的清单合规由 tests/agent-plugins-conformance.test.mjs 负责,本脚本不重复。
 *
 * 校验项清单(本注释是插件侧「lint 能力清单」的单一权威):
 *  1. 核心文件存在:插件根的 plugin.json、.claude-plugin/plugin.json、hooks/hooks.json;
 *     marketplace.json 在插件根或其父目录(插件位于子目录时,清单留在仓库根)。
 *  1b. 发布面隔离:插件目录不得混入开发过程文件——它们会被原样装进用户机器。
 *  2. agents frontmatter:只允许 name + description,name 与文件名一致。
 *  3. skills frontmatter:必含 name + description,name 与目录名一致;
 *     其余键限于 Agent Skills 标准的可选字段(跨客户端可移植性所需)。
 *  4. 名册双向一致:agents/ 下每个角色必须出现在 rules/dispatch.md 名册表,反之亦然(幽灵行)。
 *  5. 规则常驻可用:hooks.json 必须注册 SessionStart,且其命令指向存在的注入脚本——
 *     漏了 = 红线静默不加载(取代插件化前的「@import 完整性」校验)。
 *  6. 链接可达:插件树下全部 .md 的相对链接必须指向存在的文件。
 *  7. 模板隔离:templates/ 内不得引用插件资产路径(rules/ skills/ agents/ tools/ references/)——
 *     模板会被复制进用户项目,那些路径在那边不存在。
 *  8. 落点禁名:插件树下 .md 正文不得出现 docs/specs/、docs/plans/ ——
 *     技能指定的落点必须在项目 .spec/ 校验面内(防规则与技能互相打架)。
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, basename, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'))
const errors = []
const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`)

/** Agent Skills 标准里 SKILL.md 允许出现的键;本框架必填 name + description。 */
const SKILL_ALLOWED_KEYS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'version'])

function walk(dir, filter) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p, filter))
    else if (filter(p)) out.push(p)
  }
  return out
}

function parseFrontmatter(file) {
  const text = readFileSync(file, 'utf8')
  if (!text.startsWith('---\n')) return null
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return null
  const fm = { __keys: [] }
  for (const line of text.slice(4, end).split('\n')) {
    if (!line.trim()) continue
    const m = line.match(/^(\s*)([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, indent, key, rawValue] = m
    if (indent !== '') continue
    fm.__keys.push(key)
    fm[key] = rawValue.replace(/\s+#.*$/, '').trim()
  }
  return fm
}

function mdLinks(file) {
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '')
  const links = []
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1]
    if (/^([a-zA-Z][a-zA-Z0-9+.-]*:|#)/.test(target)) continue
    links.push(decodeURIComponent(target.split('#')[0]))
  }
  return links
}

// ── 1. 核心文件存在 ───────────────────────────────────────────────────────
for (const rel of ['plugin.json', '.claude-plugin/plugin.json', 'hooks/hooks.json']) {
  if (!existsSync(join(ROOT, rel))) err(join(ROOT, rel), `缺核心文件:${rel}`)
}
// 插件在子目录时,marketplace.json 留在仓库根(marketplace add <repo> 从那里发现)。
const marketplaceCandidates = [
  join(ROOT, '.claude-plugin', 'marketplace.json'),
  join(ROOT, '..', '.claude-plugin', 'marketplace.json'),
]
if (!marketplaceCandidates.some(existsSync)) {
  err(marketplaceCandidates[0], '缺核心文件:.claude-plugin/marketplace.json(插件根或其父目录)')
}

// ── 1b. 发布面隔离 ────────────────────────────────────────────────────────
// 装进用户机器的就是这个目录的全部内容;开发过程文件混进来 = 每个用户都拿一份。
for (const leaked of ['tests', '.spec', 'package.json', '.gitignore', '.claude']) {
  if (existsSync(join(ROOT, leaked))) {
    err(join(ROOT, leaked), `发布面混入开发过程文件:${leaked}(会被原样装进用户机器)`)
  }
}

// ── 2. agents frontmatter ─────────────────────────────────────────────────
const agentsDir = join(ROOT, 'agents')
const agentFiles = existsSync(agentsDir)
  ? readdirSync(agentsDir).filter((n) => n.endsWith('.md')).map((n) => join(agentsDir, n))
  : []
for (const file of agentFiles) {
  const fm = parseFrontmatter(file)
  const base = basename(file, '.md')
  if (!fm) { err(file, '缺少 frontmatter'); continue }
  const keys = fm.__keys.filter((k) => k !== '__keys').sort()
  if (keys.join(',') !== 'description,name') {
    err(file, `frontmatter 只允许 name+description,实际:${keys.join(',')}`)
  }
  if (fm.name !== base) err(file, `frontmatter name「${fm.name}」与文件名「${base}」不一致`)
}

// ── 3. skills frontmatter ─────────────────────────────────────────────────
for (const file of walk(join(ROOT, 'skills'), (p) => basename(p) === 'SKILL.md')) {
  const fm = parseFrontmatter(file)
  const dir = basename(dirname(file))
  if (!fm) { err(file, '缺少 frontmatter'); continue }
  for (const key of ['name', 'description']) if (!fm[key]) err(file, `frontmatter 缺 ${key}`)
  const unknown = fm.__keys.filter((k) => k !== '__keys' && !SKILL_ALLOWED_KEYS.has(k))
  if (unknown.length) err(file, `frontmatter 含规范外字段:${unknown.join(', ')}`)
  if (fm.name && fm.name !== dir) err(file, `frontmatter name「${fm.name}」与目录名「${dir}」不一致`)
}

// ── 4. 名册双向一致(名册在 rules/dispatch.md) ───────────────────────────
const rosterFile = join(ROOT, 'rules', 'dispatch.md')
const roster = existsSync(rosterFile) ? readFileSync(rosterFile, 'utf8') : ''
for (const file of agentFiles) {
  const base = basename(file, '.md')
  if (roster && !new RegExp(`^\\|\\s*\`${base}\``, 'm').test(roster)) {
    err(file, '角色未登记进 rules/dispatch.md 名册表')
  }
}
if (roster) {
  for (const [, name] of roster.matchAll(/^\|\s*`([\w-]+)`/gm)) {
    if (!existsSync(join(agentsDir, `${name}.md`))) {
      err(rosterFile, `名册幽灵行:「${name}」没有对应的 agents/${name}.md`)
    }
  }
}

// ── 5. 规则常驻可用 ───────────────────────────────────────────────────────
const hooksFile = join(ROOT, 'hooks', 'hooks.json')
if (existsSync(hooksFile)) {
  let hooks = null
  try {
    hooks = JSON.parse(readFileSync(hooksFile, 'utf8')).hooks
  } catch {
    err(hooksFile, 'hooks.json 不是合法 JSON')
  }
  const sessionStart = hooks?.SessionStart
  if (!Array.isArray(sessionStart) || sessionStart.length === 0) {
    err(hooksFile, '未注册 SessionStart —— 红线规则将不会常驻注入')
  } else {
    // 注入脚本必须真实存在:命令写错不会报错,只会让规则静默缺席。
    const commands = sessionStart.flatMap((entry) => (entry.hooks ?? []).map((h) => h.command ?? ''))
    for (const command of commands) {
      const m = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(\S+?)["'\s]|\$\{CLAUDE_PLUGIN_ROOT\}\/(\S+)$/)
      const scriptRel = m?.[1] ?? m?.[2]
      if (scriptRel && !existsSync(join(ROOT, scriptRel))) {
        err(hooksFile, `SessionStart 指向的脚本不存在:${scriptRel}`)
      }
    }
  }
}

// ── 6. 链接可达 ───────────────────────────────────────────────────────────
const linkRoots = ['rules', 'references', 'agents', 'commands', 'templates', 'skills']
const linkFiles = [
  ...linkRoots.flatMap((d) => walk(join(ROOT, d), (p) => p.endsWith('.md'))),
  ...['README.md', 'CLAUDE.md', 'AGENTS.md', 'CHANGELOG.md'].map((n) => join(ROOT, n)),
].filter(existsSync)
for (const file of linkFiles) {
  for (const link of mdLinks(file)) {
    if (!existsSync(resolve(dirname(file), link))) err(file, `悬空链接:${link}`)
  }
}

// ── 7. 模板隔离 ───────────────────────────────────────────────────────────
for (const file of walk(join(ROOT, 'templates'), (p) => p.endsWith('.md'))) {
  for (const link of mdLinks(file)) {
    if (/(^|\/)(rules|skills|agents|tools|references)\//.test(link)) {
      err(file, `模板不得引用插件资产路径(复制进用户项目后会悬空):${link}`)
    }
  }
}

// ── 8. 落点禁名:插件资产正文不得指定旧文档根落点(防规则-技能自伤) ────────
const BANNED_LANDING_PATHS = ['docs/specs/', 'docs/plans/']
for (const file of walk(ROOT, (p) => p.endsWith('.md'))) {
  const text = readFileSync(file, 'utf8')
  for (const banned of BANNED_LANDING_PATHS) {
    if (text.includes(banned)) err(file, `正文出现旧文档根落点「${banned}」——框架产物只落 .spec/`)
  }
}

// ── 汇总 ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`plugin-lint: ${errors.length} 处不一致\n`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log('plugin-lint: OK')
