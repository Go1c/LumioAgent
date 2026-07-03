#!/usr/bin/env node
/**
 * spec-lint — .spec/ 结构一致性机械校验。改完 .spec/ 必须跑一次;有验证命令 / CI 的项目把它挂进去。
 *
 * 校验项:
 *  1. knowledge 文档 frontmatter:name / description / metadata.type / metadata.status 齐全,
 *     status 只能取枚举(设计中 / 实施中 / 已交付 / 历史归档),description ≤ 120 字符。
 *  2. 导航覆盖:features/ 与 standards/ 及 knowledge 根下的 .md 必须被
 *     knowledge/README.md 链接到(索引漂移 = 知识隐身)。
 *  3. 链接可达:knowledge/README.md 与 AGENTS.md 里的相对链接必须指向存在的文件。
 *  4. 强制载入完整性:rules/ 下每个 .md、AGENTS.md、knowledge/README.md 都必须有
 *     根 CLAUDE.md 的对应 @import 行(漏一行 = init 静默失效)。
 *  5. agents / skills frontmatter:只允许 name + description,且 name 与文件 / 目录名一致。
 *  6. 名册一致:agents/ 下每个角色都出现在 AGENTS.md 名册里。
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC = join(ROOT, '.spec')
const STATUS_ENUM = new Set(['设计中', '实施中', '已交付', '历史归档'])
const errors = []
const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`)

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
  const body = text.slice(4, end)
  const fm = { __keys: [] }
  let inMetadata = false
  for (const line of body.split('\n')) {
    if (!line.trim()) continue
    const m = line.match(/^(\s*)([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, indent, key, rawValue] = m
    const value = rawValue.replace(/\s+#.*$/, '').trim()
    if (indent === '') {
      inMetadata = key === 'metadata'
      fm.__keys.push(key)
      if (!inMetadata) fm[key] = value
    } else if (inMetadata) {
      fm[`metadata.${key}`] = value
    }
  }
  return fm
}

function mdLinks(file) {
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '') // 剥围栏代码块,避免代码里的 [T](x) 误判为链接
    .replace(/`[^`\n]*`/g, '')
  const links = []
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1]
    if (/^([a-zA-Z][a-zA-Z0-9+.-]*:|#)/.test(target)) continue // 任何带 scheme 的外部链接
    links.push(decodeURIComponent(target.split('#')[0]))
  }
  return links
}

// ── 1. knowledge frontmatter ──────────────────────────────────────────────
const knowledgeDir = join(SPEC, 'knowledge')
const featureDocs = walk(join(knowledgeDir, 'features'), (p) => p.endsWith('.md'))
const standardDocs = walk(join(knowledgeDir, 'standards'), (p) => p.endsWith('.md'))
for (const file of [...featureDocs, ...standardDocs]) {
  const fm = parseFrontmatter(file)
  if (!fm) { err(file, '缺少 frontmatter'); continue }
  for (const key of ['name', 'description']) if (!fm[key]) err(file, `frontmatter 缺 ${key}`)
  for (const key of ['metadata.type', 'metadata.status']) if (!fm[key]) err(file, `frontmatter 缺 ${key}`)
  const status = fm['metadata.status']
  if (status && !STATUS_ENUM.has(status)) {
    err(file, `status「${status}」不在枚举(${[...STATUS_ENUM].join(' / ')})——历史写进「变更记录」节`)
  }
  if (fm.description && [...fm.description].length > 120) {
    err(file, `description 超过 120 字符(${[...fm.description].length})——一句话是什么+何时查,历史下沉`)
  }
}

// ── 2. 导航覆盖 ───────────────────────────────────────────────────────────
const navFile = join(knowledgeDir, 'README.md')
const navLinkSet = new Set(mdLinks(navFile).map((l) => resolve(knowledgeDir, l)))
const rootDocs = readdirSync(knowledgeDir)
  .filter((n) => n.endsWith('.md') && n !== 'README.md')
  .map((n) => join(knowledgeDir, n))
for (const file of new Set([...featureDocs, ...standardDocs, ...rootDocs])) {
  if (!navLinkSet.has(file)) err(file, '未登记进 knowledge/README.md 导航(索引漂移 = 知识隐身)')
}

// ── 2b. decisions 索引覆盖 ────────────────────────────────────────────────
const decisionsDir = join(SPEC, 'decisions')
if (existsSync(decisionsDir)) {
  const adrIndex = join(decisionsDir, 'README.md')
  const adrLinks = new Set(mdLinks(adrIndex).map((l) => resolve(decisionsDir, l)))
  for (const file of walk(decisionsDir, (p) => p.endsWith('.md') && !p.endsWith('/README.md'))) {
    if (!adrLinks.has(file)) err(file, '未登记进 decisions/README.md 索引')
  }
}

// ── 3. 链接可达(.spec 下全部 .md + 根入口) ──────────────────────────────
const linkScanFiles = [
  ...walk(SPEC, (p) => p.endsWith('.md')),
  join(ROOT, 'README.md'),
  join(ROOT, 'AGENTS.md'),
].filter(existsSync)
for (const file of linkScanFiles) {
  for (const link of mdLinks(file)) {
    const target = resolve(dirname(file), link)
    if (!existsSync(target)) err(file, `悬空链接:${link}`)
  }
}

// ── 4. 强制载入完整性(CLAUDE.md @import) ────────────────────────────────
const claudeMd = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')
const imports = new Set([...claudeMd.matchAll(/^@(\.spec\/\S+)$/gm)].map((m) => m[1]))
const mustImport = [
  '.spec/AGENTS.md',
  '.spec/knowledge/README.md',
  ...readdirSync(join(SPEC, 'rules'))
    .filter((n) => n.endsWith('.md') && n !== 'README.md')
    .map((n) => `.spec/rules/${n}`),
]
for (const path of mustImport) {
  if (!imports.has(path)) err(join(ROOT, 'CLAUDE.md'), `缺 @import 行:@${path}(漏了 = init 静默不加载)`)
}

// ── 5. agents / skills frontmatter ────────────────────────────────────────
const agentsMd = readFileSync(join(SPEC, 'AGENTS.md'), 'utf8')
for (const file of walk(join(SPEC, 'agents'), (p) => p.endsWith('.agent.md'))) {
  const fm = parseFrontmatter(file)
  const base = file.split('/').pop().replace('.agent.md', '')
  if (!fm) { err(file, '缺少 frontmatter'); continue }
  const keys = fm.__keys.filter((k) => k !== '__keys').sort()
  if (keys.join(',') !== 'description,name') err(file, `frontmatter 只允许 name+description,实际:${keys.join(',')}`)
  if (fm.name !== base) err(file, `frontmatter name「${fm.name}」与文件名「${base}」不一致`)
  // ── 6. 名册一致(必须是名册表的一行,不是正文顺带提及) ──
  if (!new RegExp(`^\\|\\s*\`${base}\``, 'm').test(agentsMd)) err(file, `角色未登记进 AGENTS.md 名册表`)
}
for (const file of walk(join(SPEC, 'skills'), (p) => p.endsWith('/SKILL.md'))) {
  const fm = parseFrontmatter(file)
  const dir = file.split('/').at(-2)
  if (!fm) { err(file, '缺少 frontmatter'); continue }
  const keys = fm.__keys.filter((k) => k !== '__keys').sort()
  if (keys.join(',') !== 'description,name') err(file, `frontmatter 只允许 name+description,实际:${keys.join(',')}`)
  if (fm.name !== dir) err(file, `frontmatter name「${fm.name}」与目录名「${dir}」不一致`)
}

// ── 汇总 ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`spec-lint: ${errors.length} 处不一致\n`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log('spec-lint: OK')
