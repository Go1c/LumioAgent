#!/usr/bin/env node
/**
 * SessionStart hook —— 把插件 rules/ 下的规则全量注入会话上下文。
 *
 * 为什么用 glob 而不是登记表:插件化之前,规则靠 CLAUDE.md 的 @import 逐行登记,
 * 漏一行就是 init 静默不加载(旧 spec-lint 专门有一项校验它)。改成遍历目录后,
 * 没有登记表就没有漂移——新增规则文件放进 rules/ 即生效,无处可漏。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 读 <pluginRoot>/rules/*.md,按文件名排序拼接。无规则时返回空串。 */
export function buildRulesContext(pluginRoot) {
  const rulesDir = join(pluginRoot, 'rules')
  if (!existsSync(rulesDir)) return ''
  const files = readdirSync(rulesDir)
    .filter((n) => n.endsWith('.md') && n !== 'README.md')
    .sort() // 顺序稳定,避免同样的规则每次会话产生不同的上下文
  if (files.length === 0) return ''
  return files.map((n) => readFileSync(join(rulesDir, n), 'utf8').trim()).join('\n\n---\n\n')
}

function main() {
  const pluginRoot =
    process.env.CLAUDE_PLUGIN_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)))
  const rules = buildRulesContext(pluginRoot)
  if (!rules) process.exit(0)

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext:
          `<lumio-rules>\n以下是 LumioAgent 框架的常驻规则,每次会话强制在场,优先级高于默认行为。\n` +
          // 规则正文里的 agents/ references/ 等路径相对插件根;给出绝对路径它们才可解析。
          `插件根目录:${pluginRoot}(下文出现的 agents/、references/、skills/ 等路径均相对于它)\n\n` +
          `${rules}\n</lumio-rules>`,
      },
    }),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
