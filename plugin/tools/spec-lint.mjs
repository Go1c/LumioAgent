#!/usr/bin/env node
/**
 * spec-lint —— **项目侧** `.spec/` 结构一致性校验。随 LumioAgentSpec 插件分发,
 * 由 PreToolUse hook 在 git commit 前调用,也可用 /lumio:lint 手动跑。
 * 用法:node tools/spec-lint.mjs [项目根目录]   (省略参数时取 CLAUDE_PROJECT_DIR 或 cwd)
 *
 * 边界:本脚本**只管项目实例数据**(knowledge / decisions / tasks / AGENTS.md)。
 * 插件自身的结构(清单、skills、agents、hooks)由 tools/plugin-lint.mjs 校验——
 * 两者必须分开,否则装了插件的下游项目会被插件自身的校验项误伤。
 *
 * 校验项清单(本注释是项目侧「lint 能力清单」的单一权威):
 *  0. 项目没有 .spec/ 时静默通过——插件会装进任何项目,守卫不该卡住还没接入的仓库。
 *  1. knowledge 文档 frontmatter:name / description / metadata.type / metadata.status 齐全;
 *     status 只能取枚举(设计中 / 实施中 / 已交付 / 历史归档);description ≤ 120 字符,
 *     且必须单行明文(禁 YAML 多行标量 > / |,防止绕过长度校验)。
 *  2. 导航覆盖:features/ 与 standards/ 及 knowledge 根下的 .md 必须被 knowledge/README.md
 *     链接到(索引漂移 = 知识隐身);decisions/ 下每条 ADR 必须登记进 decisions/README.md 索引。
 *  3. 链接可达:.spec 下全部 .md 的相对链接必须指向存在的文件
 *     (剥围栏代码块与行内代码,避免代码里的 [T](x) 误判)。
 *  4. 任务卡 frontmatter:.spec/tasks/ 根目录每张卡(README 除外)必须有 frontmatter,
 *     且只允许 status 字段,枚举 pending / in_progress / completed;子目录不校验。
 *  5. 禁并行文档根:git 索引内不得出现 docs/specs/、docs/plans/,或仓根之外的
 *     第二个 .spec/(templates/.spec/ 模板骨架豁免);非 git 仓库或无 git 时跳过本项,
 *     其余 git 失败上报(不静默失效)。
 *  6. ADR 状态行:每条 ADR 必有「- 状态:」行,取值以「生效」开头,或
 *     「(部分)被 [NNNN](<file>) 取代」——被取代必须链接取代者。
 *  7. 计划 frontmatter:.spec/plans/ 根目录每份计划(README 除外)与任务卡同契约
 *     (仅 status,枚举 pending / in_progress / completed)。
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename, resolve, relative } from 'node:path'

const ROOT = resolve(process.argv[2] ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const SPEC = join(ROOT, '.spec')
const STATUS_ENUM = new Set(['设计中', '实施中', '已交付', '历史归档'])
const TASK_STATUS_ENUM = new Set(['pending', 'in_progress', 'completed'])
const errors = []
const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`)

// ── 0. 未接入的项目直接放行 ───────────────────────────────────────────────
if (!existsSync(SPEC)) {
  console.log('spec-lint: OK(本项目未接入 .spec/,跳过)')
  process.exit(0)
}

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
  let inMetadata = false
  for (const line of text.slice(4, end).split('\n')) {
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
    if (/^([a-zA-Z][a-zA-Z0-9+.-]*:|#)/.test(target)) continue // 带 scheme 的外部链接
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
    err(file, `status「${status}」不在枚举(${[...STATUS_ENUM].join(' / ')})——历史在 git,不进文档`)
  }
  if (fm.description && /^[>|]/.test(fm.description)) {
    err(file, 'description 必须单行明文——YAML 多行标量会绕过长度校验')
  } else if (fm.description && [...fm.description].length > 120) {
    err(file, `description 超过 120 字符(${[...fm.description].length})——一句话是什么+何时查`)
  }
}

// ── 2. 导航覆盖 + ADR 索引覆盖 ────────────────────────────────────────────
const navFile = join(knowledgeDir, 'README.md')
if (existsSync(navFile)) {
  const navLinkSet = new Set(mdLinks(navFile).map((l) => resolve(knowledgeDir, l)))
  const rootDocs = readdirSync(knowledgeDir)
    .filter((n) => n.endsWith('.md') && n !== 'README.md')
    .map((n) => join(knowledgeDir, n))
  for (const file of new Set([...featureDocs, ...standardDocs, ...rootDocs])) {
    if (!navLinkSet.has(file)) err(file, '未登记进 knowledge/README.md 导航(索引漂移 = 知识隐身)')
  }
} else if (existsSync(knowledgeDir)) {
  err(navFile, '缺知识导航 knowledge/README.md')
}

const decisionsDir = join(SPEC, 'decisions')
if (existsSync(decisionsDir)) {
  const adrIndex = join(decisionsDir, 'README.md')
  const adrLinks = existsSync(adrIndex)
    ? new Set(mdLinks(adrIndex).map((l) => resolve(decisionsDir, l)))
    : new Set()
  for (const file of walk(decisionsDir, (p) => p.endsWith('.md') && basename(p) !== 'README.md')) {
    if (!adrLinks.has(file)) err(file, '未登记进 decisions/README.md 索引')
    const adrBody = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
    const status = adrBody.match(/^-\s*状态[:：]\s*(.+)$/m)
    if (!status) { err(file, 'ADR 缺「- 状态:」行'); continue }
    const v = status[1].trim()
    if (!/^生效/.test(v) && !/^(部分)?被\s*\[\d{4}\]\([^)\s]+\)\s*取代/.test(v)) {
      err(file, `ADR 状态「${v}」不合法——只能以「生效」开头,或「被 [NNNN](<file>) 取代」(部分取代加前缀「部分」)`)
    }
  }
}

// ── 3. 链接可达 ───────────────────────────────────────────────────────────
for (const file of walk(SPEC, (p) => p.endsWith('.md'))) {
  for (const link of mdLinks(file)) {
    if (!existsSync(resolve(dirname(file), link))) err(file, `悬空链接:${link}`)
  }
}

// ── 4. 任务卡 / 计划 frontmatter(共享契约:仅 status,同一枚举) ──────────
function checkStatusCards(dir, label) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory() || !name.endsWith('.md') || name === 'README.md') continue
    const fm = parseFrontmatter(p)
    if (!fm) { err(p, `${label}缺少 frontmatter(格式契约见该目录 README.md)`); continue }
    const keys = fm.__keys.filter((k) => k !== '__keys')
    if (keys.join(',') !== 'status') err(p, `${label} frontmatter 只允许 status,实际:${keys.join(',')}`)
    if (!TASK_STATUS_ENUM.has(fm.status)) {
      err(p, `status「${fm.status ?? ''}」不在枚举(${[...TASK_STATUS_ENUM].join(' / ')})`)
    }
  }
}
checkStatusCards(join(SPEC, 'tasks'), '任务卡')
checkStatusCards(join(SPEC, 'plans'), '计划')

// ── 5. 禁并行文档根(遍历面 = git 索引;非 git 环境跳过) ───────────────
let indexedFiles = null
try {
  indexedFiles = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).split('\0').filter(Boolean)
} catch (e) {
  // 只吞 git 以 128 退出的失败(非仓库、dubious ownership 等——这些环境 git commit 同样不可用)
  // 与无 git(ENOENT)。其余 Node 层错误(ENOBUFS、权限)必须上报,否则本项校验会静默失效(fail open)。
  if (e.status !== 128 && e.code !== 'ENOENT') {
    err(join(ROOT, '.spec'), `git ls-files 失败,禁并行文档根校验未执行:${e.code ?? e.status ?? e.message}`)
  }
}
for (const rel of indexedFiles ?? []) {
  if (/(^|\/)docs\/(specs|plans)\//.test(rel)) {
    err(join(ROOT, rel), '并行文档根:框架产物(设计/计划)只落 .spec/,不落 docs/')
  }
  if (rel.includes('/.spec/') && !rel.includes('templates/.spec/')) {
    err(join(ROOT, rel), '仓根之外出现第二个 .spec/(模板骨架 templates/.spec/ 豁免)')
  }
}

// ── 汇总 ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`spec-lint: ${errors.length} 处不一致\n`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log('spec-lint: OK')
