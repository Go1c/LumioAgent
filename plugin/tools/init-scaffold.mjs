#!/usr/bin/env node
/**
 * /lumio:init 的执行体 —— 把插件 templates/.spec/ 释放到目标项目,并写入宿主入口指针。
 *
 * 确定性优先于灵活:默认**不覆盖**任何已存在的文件,指针追加是幂等的。
 * init 是用户会反复跑的命令(升级插件后再跑一次),损毁已有内容的代价远高于少写一个文件。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 指针段的识别标记,用于幂等判断。 */
export const POINTER_MARKER = '<!-- lumio:init -->'

const POINTER = `${POINTER_MARKER}
## LumioAgent

本项目使用 LumioAgent 插件的调度与编码规程。项目自身的定位、收口门槛与知识导航见:

- [\`.spec/AGENTS.md\`](.spec/AGENTS.md) —— 项目中心文档(先读)
- [\`.spec/knowledge/README.md\`](.spec/knowledge/README.md) —— 知识导航
- [\`.spec/decisions/\`](.spec/decisions/README.md) —— 决策唯一落点(ADR)

> 通用规程与硬红线由插件在每次会话注入(Claude Code);无此机制的宿主请主动读取上述文件。
`

function walkFiles(dir, base = dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walkFiles(p, base))
    else out.push(relative(base, p))
  }
  return out
}

/**
 * @param {{pluginRoot: string, target: string, force?: boolean}} options
 * @returns {{created: string[], skipped: string[], entries: string[]}}
 */
export function initScaffold({ pluginRoot, target, force = false }) {
  const templateRoot = join(pluginRoot, 'templates')
  const created = []
  const skipped = []

  for (const rel of walkFiles(templateRoot)) {
    const dest = join(target, rel)
    if (existsSync(dest) && !force) { skipped.push(rel); continue }
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, readFileSync(join(templateRoot, rel), 'utf8'))
    created.push(rel)
  }

  // 宿主入口指针:Claude Code 读 CLAUDE.md,遵循 AGENTS.md 开放标准的客户端读 AGENTS.md。
  const entries = []
  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    const file = join(target, name)
    const existing = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (existing.includes(POINTER_MARKER)) continue // 幂等:已写过就不再追加
    const body = existing ? `${existing.trimEnd()}\n\n${POINTER}` : POINTER
    writeFileSync(file, body)
    entries.push(name)
  }

  return { created, skipped, entries }
}

function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const targetFlagIndex = args.indexOf('--target')
  const target =
    (targetFlagIndex !== -1 ? args[targetFlagIndex + 1] : undefined) ??
    process.env.CLAUDE_PROJECT_DIR ??
    process.cwd()
  const pluginRoot =
    process.env.CLAUDE_PLUGIN_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)))

  const { created, skipped, entries } = initScaffold({ pluginRoot, target, force })
  console.log(`目标:${target}`)
  console.log(`新建 ${created.length} 个文件${created.length ? ':\n  ' + created.join('\n  ') : ''}`)
  if (skipped.length) console.log(`跳过 ${skipped.length} 个已存在文件(用 --force 覆盖):\n  ${skipped.join('\n  ')}`)
  if (entries.length) console.log(`已写入宿主入口指针:${entries.join('、')}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
