#!/usr/bin/env node
/**
 * closeout-gate —— 收口审查定级:输入 diff(相对 BASE),输出三态 + 命中理由。
 * 随 LumioAgent 插件分发;主 loop 收口前调用,替代散文白名单的人工判读。
 * 用法:node tools/closeout-gate.mjs [BASE]
 *   BASE 省略时取 HEAD(定级未提交 + 已暂存改动);传提交号 / 分支名则定级 BASE..工作区。
 *
 * 三态与判定顺序(先命中先生效;本注释是判定规则的单一权威):
 *   1. 红线面(路径段 rules / hooks、文件 hooks.json、.github/workflows/)被触碰
 *      → 有效行 ≥ 100 深审,否则快审;永不豁免(一票取消豁免)。
 *      鉴权 / 安全面机器判不了,不在本工具内——靠人工与 reviewer。
 *   2. BASE..HEAD 全部提交主题以 revert 开头 → 快速豁免
 *   3. 存在未跟踪的**非文档/数据类**文件 → 快审(内容不可定级,先 git add);
 *      纯文档/数据类的未跟踪文件不拦豁免,仅提示未计入定级。
 *   4. 含二进制文件改动 → 快审(不可豁免)
 *   5. 全部文件为纯文档(.md/.txt/.rst) / 纯配置数据(.json/.yaml/.yml/.toml/.csv) /
 *      纯注释改动(已知注释语法的代码文件,改动行全为注释或空行) → 快速豁免(不限行数)
 *   6. 有效行(去空行与注释行)合计 ≥ 500 → 深审
 *   7. 有效行 < 50 → 快速豁免
 *   8. 其余 → 快审
 *
 * 「机械套用既有模式」「生成物随源更新」机器判不了,已从豁免面移除(归快审)。
 * 退出码:恒 0(定级是建议不是门禁);用法 / 环境错误 2。
 */
import { execFileSync } from 'node:child_process'
import { extname, basename } from 'node:path'

const BASE = process.argv[2] ?? 'HEAD'
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })

let files, untracked
try {
  files = git('diff', '--name-only', '-z', BASE).split('\0').filter(Boolean)
  untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
} catch (e) {
  console.error(`closeout-gate: git 失败(${e.status ?? e.code ?? e.message})——需在 git 仓库内运行且 BASE 可解析`)
  process.exit(2)
}

const DOC_EXT = new Set(['.md', '.txt', '.rst'])
const DATA_EXT = new Set(['.json', '.yaml', '.yml', '.toml', '.csv'])
const COMMENT_MARKERS = new Map(Object.entries({
  '.js': ['//', '/*', '*', '*/'], '.mjs': ['//', '/*', '*', '*/'], '.cjs': ['//', '/*', '*', '*/'],
  '.ts': ['//', '/*', '*', '*/'], '.tsx': ['//', '/*', '*', '*/'], '.jsx': ['//', '/*', '*', '*/'],
  '.css': ['/*', '*', '*/'], '.sh': ['#'], '.py': ['#'], '.rb': ['#'],
  '.yml': ['#'], '.yaml': ['#'], '.toml': ['#'], '.html': ['<!--', '-->'],
}))
const isDocOrData = (f) => DOC_EXT.has(extname(f)) || DATA_EXT.has(extname(f))

const isRed = (f) => {
  const segs = f.split('/')
  return segs.includes('rules') || segs.includes('hooks') ||
    basename(f) === 'hooks.json' || f.startsWith('.github/workflows/')
}

let totalEffective = 0
let hasBinary = false
let allWhitelistedType = files.length > 0
for (const f of files) {
  const d = git('diff', '-U0', BASE, '--', f)
  if (/^Binary files /m.test(d)) { hasBinary = true; allWhitelistedType = false; continue }
  const ext = extname(f)
  const markers = COMMENT_MARKERS.get(ext) ?? []
  const changed = d.split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .map((l) => l.slice(1).trim())
  const effective = changed.filter((l) => l && !markers.some((m) => l.startsWith(m)))
  totalEffective += effective.length
  const whitelisted = isDocOrData(f) || (COMMENT_MARKERS.has(ext) && effective.length === 0)
  if (!whitelisted) allWhitelistedType = false
}

let isRevert = false
if (BASE !== 'HEAD') {
  try {
    const subjects = git('log', '--format=%s', `${BASE}..HEAD`).split('\n').filter(Boolean)
    isRevert = subjects.length > 0 && subjects.every((s) => /^revert/i.test(s))
  } catch { /* BASE 可解析但无提交区间时不阻断 */ }
}

const redFiles = files.filter(isRed)
const untrackedBlocking = untracked.filter((f) => !isDocOrData(f))
const untrackedDocs = untracked.filter(isDocOrData)
const reasons = []
let level

if (files.length === 0 && untrackedBlocking.length === 0 && untrackedDocs.length === 0) {
  level = '快速豁免'
  reasons.push('空 diff——没有可定级的改动')
} else if (redFiles.length > 0) {
  level = totalEffective >= 100 ? '深审' : '快审'
  reasons.push(`红线面被触碰(${redFiles.join('、')})——一票取消豁免,永不快速`)
  if (level === '深审') reasons.push(`红线面 + 有效行 ${totalEffective} ≥ 100`)
} else if (isRevert) {
  level = '快速豁免'
  reasons.push('BASE..HEAD 全部为 revert 提交')
} else if (untrackedBlocking.length > 0) {
  level = '快审'
  reasons.push(`存在未跟踪的非文档类文件(${untrackedBlocking.join('、')})——内容不可定级,先 git add`)
} else if (hasBinary) {
  level = '快审'
  reasons.push('含二进制文件改动——不可豁免')
} else if (files.length > 0 && allWhitelistedType) {
  level = '快速豁免'
  reasons.push('全部文件为纯文档 / 配置数据 / 纯注释改动')
} else if (totalEffective >= 500) {
  level = '深审'
  reasons.push(`有效行 ${totalEffective} ≥ 500`)
} else if (totalEffective < 50) {
  level = '快速豁免'
  reasons.push(`有效行 ${totalEffective} < 50(去空行与注释)`)
} else {
  level = '快审'
  reasons.push(`默认——白名单未命中(有效行 ${totalEffective})`)
}

if (untrackedDocs.length > 0) {
  reasons.push(`提示:未跟踪的文档/数据文件未计入定级(${untrackedDocs.join('、')})`)
}

console.log(`closeout-gate: ${level}`)
for (const r of reasons) console.log(`  - ${r}`)
