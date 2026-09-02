#!/usr/bin/env node
/**
 * closeout-gate —— 收口审查定级:输入 diff(相对 BASE),输出三态 + 命中理由。
 * 随 LumioAgentSpec 插件分发;主 loop 收口前调用,替代散文白名单的人工判读。
 * 用法:node tools/closeout-gate.mjs [BASE]
 *   BASE 省略时取 HEAD(定级未提交 + 已暂存改动);传提交号 / 分支名则定级 BASE..工作区。
 *
 * 三态与判定顺序(先命中先生效;本注释是判定规则的单一权威):
 *   0. 空 diff(无已跟踪改动且无未跟踪文件) → 快速豁免
 *   1. 红线面被触碰 → 有效行 ≥ 100 深审,否则快审;永不豁免(一票取消豁免)。
 *      红线名单:路径段 rules / hooks / .claude(嵌套的 .claude/ 同样算——Claude Code 会读子目录配置);
 *      路径前缀 .github/workflows/、.circleci/;文件名 hooks.json、.gitlab-ci.yml。
 *      鉴权 / 安全面机器判不了,不在本工具内——靠人工与 reviewer。
 *      package.json 等含脚本的配置不在红线名单,落在配置数据豁免面——需要更严时人工升级。
 *   2. BASE..HEAD 全部提交主题以 revert 开头(后接 : ( 或空格) → 快速豁免
 *   3. 存在未跟踪的**非文档/数据类**文件、或未跟踪的**红线面**文件(哪怕是文档)
 *      → 快审(内容不可定级,先 git add);
 *      非红线面的纯文档/数据类未跟踪文件不拦豁免,仅提示未计入定级。
 *   4. 含二进制文件改动 → 快审(不可豁免)
 *   5. 全部文件为纯文档(.md/.txt/.rst) / 纯配置数据(.json/.yaml/.yml/.toml/.csv) /
 *      纯注释或纯删除改动(已知注释语法的代码文件,新增行全为空行或以注释标记开头的行,
 *      含只删不增) → 快速豁免(不限行数)
 *   6. 有效行(新增行,去空行与以注释标记开头的行)合计 ≥ 500 → 深审
 *   7. 有效行(新增行,去空行与以注释标记开头的行) < 50 → 快速豁免
 *   8. 其余 → 快审
 *
 * 有效行只计新增(`+`)行,删除(`-`)行不计——快速模式取放宽定调:30 行重写按 30 算,
 * 纯删除按 0 算(与 revert 豁免同旨)。
 * 注释判定只看行首标记,不解析语法:块注释内的代码行、行尾注释均按字面处理。
 * 「机械套用既有模式」「生成物随源更新」机器判不了,已从豁免面移除(归快审)。
 * 同一有效行口径也是 rules/dispatch.md「编码约定 · 测试分级」的依据:纯文档 / 配置 / 注释 / 删除改动或有效行 < 50
 * = 小任务(免 TDD),其余 = 大任务;红线面抬级只影响审查级别,不影响测试分级。
 * 退出码:恒 0(定级是建议不是门禁);用法 / 环境错误 2。
 */
import { execFileSync } from 'node:child_process'
import { extname, basename } from 'node:path'

const BASE = process.argv[2] ?? 'HEAD'
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })

// BASE 前置校验:先分清「非 git 仓库」与「BASE 不可解析」,再放行到 diff。
if (BASE.startsWith('-')) {
  console.error(`closeout-gate: BASE 不可解析(${BASE})——不接受以 - 开头的参数,用法 node tools/closeout-gate.mjs [BASE]`)
  process.exit(2)
}
try {
  git('rev-parse', '--git-dir')
} catch (e) {
  console.error(`closeout-gate: 环境错误(${e.status ?? e.code ?? e.message})——需在 git 仓库内运行`)
  process.exit(2)
}
try {
  git('rev-parse', '--verify', '--quiet', `${BASE}^{commit}`)
} catch {
  console.error(`closeout-gate: BASE 不可解析(${BASE})——需为可解析的提交号 / 分支名`)
  process.exit(2)
}

let files, untracked
try {
  // --no-renames:改名必须同时报出源路径,否则红线文件改名移出即逃逸红线分支。
  files = git('diff', '--name-only', '--no-renames', '-z', BASE, '--').split('\0').filter(Boolean)
  // ':/' 定界到仓库根 + --full-name 归一路径:子目录内运行时不漏扫,且路径与 diff 同为根相对
  //(否则得到 ../x 形式,红线前缀判定会失效)。
  untracked = git('ls-files', '--others', '--exclude-standard', '--full-name', '-z', ':/').split('\0').filter(Boolean)
} catch (e) {
  console.error(`closeout-gate: 环境错误(${e.status ?? e.code ?? e.message})——git 列举改动失败`)
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

const RED_PREFIX = ['.github/workflows/', '.circleci/']
const RED_BASENAME = new Set(['hooks.json', '.gitlab-ci.yml'])
const isRed = (f) => {
  const segs = f.split('/')
  return segs.includes('rules') || segs.includes('hooks') || segs.includes('.claude') ||
    RED_BASENAME.has(basename(f)) || RED_PREFIX.some((p) => f.startsWith(p))
}

let totalEffective = 0
let hasBinary = false
let allWhitelistedType = files.length > 0
for (const f of files) {
  let d
  try {
    // :(literal) —— 文件名以 ':' 开头时会被当 pathspec 魔法前缀,静默返回空 diff 而被误判豁免。
    d = git('diff', '-U0', BASE, '--', `:(literal)${f}`)
  } catch (e) {
    console.error(`closeout-gate: 环境错误(${e.status ?? e.code ?? e.message})——读取 ${f} 的 diff 失败`)
    process.exit(2)
  }
  if (/^Binary files /m.test(d)) { hasBinary = true; allWhitelistedType = false; continue }
  const ext = extname(f)
  const markers = COMMENT_MARKERS.get(ext) ?? []
  const body = d.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
  // 已列入 files 却读不到任何 +/- 行(pathspec 失配、纯 mode 变更等):不可定级,不得走类型白名单豁免。
  if (body.length === 0) { allWhitelistedType = false; continue }
  const changed = body
    .filter((l) => /^\+/.test(l))
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
    isRevert = subjects.length > 0 && subjects.every((s) => /^revert[:( ]/i.test(s))
  } catch { /* BASE 可解析但无提交区间时不阻断 */ }
}

const redFiles = files.filter(isRed)
const untrackedBlocking = untracked.filter((f) => !isDocOrData(f) || isRed(f))
const untrackedDocs = untracked.filter((f) => isDocOrData(f) && !isRed(f))
const reasons = []
let level

if (files.length === 0 && untrackedBlocking.length === 0 && untrackedDocs.length === 0) {
  level = '快速豁免'
  reasons.push('空 diff——没有可定级的改动')
} else if (redFiles.length > 0) {
  level = totalEffective >= 100 ? '深审' : '快审'
  reasons.push(`红线面被触碰(${redFiles.join('、')})——一票取消豁免,永不快速`)
  reasons.push(level === '深审' ? `红线面 + 有效行 ${totalEffective} ≥ 100` : `红线面 + 有效行 ${totalEffective} < 100`)
} else if (isRevert) {
  level = '快速豁免'
  reasons.push('BASE..HEAD 全部为 revert 提交')
} else if (untrackedBlocking.length > 0) {
  level = '快审'
  reasons.push(`存在未跟踪的非文档类或红线面文件(${untrackedBlocking.join('、')})——内容不可定级,先 git add`)
} else if (hasBinary) {
  level = '快审'
  reasons.push('含二进制文件改动——不可豁免')
} else if (files.length > 0 && allWhitelistedType) {
  level = '快速豁免'
  reasons.push(`全部文件为纯文档 / 配置数据 / 纯注释或纯删除改动(有效行 ${totalEffective})`)
} else if (totalEffective >= 500) {
  level = '深审'
  reasons.push(`有效行 ${totalEffective} ≥ 500`)
} else if (totalEffective < 50) {
  level = '快速豁免'
  reasons.push(`有效行 ${totalEffective} < 50(新增行,去空行与注释)`)
} else {
  level = '快审'
  reasons.push(`默认——白名单未命中(有效行 ${totalEffective})`)
}

if (untrackedDocs.length > 0) {
  reasons.push(`提示:未跟踪的文档/数据文件未计入定级(${untrackedDocs.join('、')})`)
}

console.log(`closeout-gate: ${level}`)
for (const r of reasons) console.log(`  - ${r}`)
