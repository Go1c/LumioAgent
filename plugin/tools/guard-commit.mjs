#!/usr/bin/env node
/**
 * PreToolUse(Bash) hook —— git commit 前跑项目侧 spec-lint,不通过就阻断提交。
 *
 * 判定要点:先剥掉引号与 heredoc 正文再匹配。旧版内联脚本直接在原始命令文本上
 * 跑正则,导致「写一个正文含 git commit 字样的文件」这类操作被误拦。
 * 已知取舍:`bash -c "git commit"` 这类把真命令藏在引号里的写法会漏判——
 * 相比每天都会踩到的误报,这个边角更可接受。
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 命令里是否存在一段真正要执行的 git commit。 */
export function isGitCommit(command) {
  if (typeof command !== 'string' || !command.trim()) return false
  const stripped = command
    .replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?^\s*\2\s*$/gm, ' ') // heredoc 正文
    .replace(/'[^']*'/g, ' ')
    .replace(/"[^"]*"/g, ' ')
  return stripped
    .split(/[;&|\n]+/)
    .some((segment) =>
      // 允许 env 前缀与 git 自身的选项(如 -C <path>),但 commit 必须是独立的子命令词,
      // 以免 commit-tree 之类被误判。
      /^\s*(?:\w+=\S+\s+)*git\b(?:\s+-C\s+\S+|\s+-[-\w]+(?:=\S+)?)*\s+commit(?![\w-])/.test(segment),
    )
}

/** 项目接入了自定义 lint 时优先使用项目侧实现,否则回退插件默认实现。 */
export function resolveLintPath(projectDir, pluginRoot) {
  const projectLint = join(projectDir, '.spec', 'tools', 'spec-lint.mjs')
  return existsSync(projectLint) ? projectLint : join(pluginRoot, 'tools', 'spec-lint.mjs')
}

function main() {
  let raw = ''
  process.stdin.on('data', (chunk) => (raw += chunk))
  process.stdin.on('end', () => {
    let command = ''
    try {
      command = (JSON.parse(raw).tool_input ?? {}).command ?? ''
    } catch {
      process.exit(0) // 读不懂输入就放行,守卫不该反过来卡住正常工作
    }
    if (!isGitCommit(command)) process.exit(0)

    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
    const pluginRoot =
      process.env.CLAUDE_PLUGIN_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)))
    const lint = resolveLintPath(projectDir, pluginRoot)
    if (!existsSync(lint)) process.exit(0)

    try {
      execFileSync(process.execPath, [lint, projectDir], { stdio: 'pipe' })
      process.exit(0)
    } catch (error) {
      process.stderr.write(
        'spec-lint 未通过,git commit 已被阻断(先修复再提交):\n' +
          String(error.stdout ?? '') +
          String(error.stderr ?? ''),
      )
      process.exit(2)
    }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
