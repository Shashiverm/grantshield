import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [sourceArg = 'contracts/grantshield.compact', targetArg = 'managed'] = process.argv.slice(2)
const root = process.cwd()
const source = path.resolve(root, sourceArg)
const target = path.resolve(root, targetArg)

if (!fs.existsSync(source)) {
  console.error(`Compact source not found: ${source}`)
  process.exit(1)
}

function wslPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/')
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/)
  return match ? `/mnt/${match[1].toLowerCase()}/${match[2]}` : normalized
}

function runCompiler() {
  if (process.platform === 'win32') {
    const command = `~/.local/bin/compact compile "${wslPath(source)}" "${wslPath(target)}"`
    return spawnSync('wsl', ['-d', 'Ubuntu', '-e', 'bash', '-lc', command], { stdio: 'inherit' })
  }

  return spawnSync('compact', ['compile', source, target], { stdio: 'inherit' })
}

console.log(`Compiling ${sourceArg} into ${targetArg}...`)
const result = runCompiler()
if (result.error) {
  console.error('Unable to start Compact. Install Compact 0.5.2 and ensure it is available in WSL or PATH.')
  console.error(result.error.message)
  process.exit(1)
}
if (result.status !== 0) {
  console.error(`Compact compilation failed with exit code ${result.status ?? 1}.`)
  process.exit(result.status ?? 1)
}

console.log(`Compact compilation complete. Generated artifacts are in ${targetArg}/.`)
