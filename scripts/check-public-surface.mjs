import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root,
  encoding: 'utf8',
})

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const files = result.stdout.split('\0').filter(Boolean)
const failures = []
const required = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'docs/README.md',
  'docs/GETTING-STARTED.md',
  'docs/ARCHITECTURE.md',
  'docs/evidence/README.md',
]

for (const file of required) {
  if (!existsSync(resolve(root, file))) failures.push(`${file}: required public file is missing`)
}

const portableExtensions = new Set(['.md', '.json', '.txt', '.yml', '.yaml'])

for (const file of files) {
  if (!portableExtensions.has(extname(file))) continue
  const path = resolve(root, file)
  const content = readFileSync(path, 'utf8')
  const lines = content.split('\n')

  for (const [index, line] of lines.entries()) {
    if (/\/Users\/[^/\s]+\//.test(line)) {
      failures.push(`${file}:${index + 1}: contains a contributor-specific home path`)
    }
  }

  if (extname(file) !== '.md') continue

  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g

  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(linkPattern)) {
      let target = match[1].trim()
      if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1)
      target = target.split(/\s+['"]/)[0]

      if (
        target === '' ||
        target.startsWith('#') ||
        target.startsWith('/') ||
        /^[a-z][a-z0-9+.-]*:/i.test(target)
      ) {
        continue
      }

      const withoutFragment = target.split('#')[0].split('?')[0]
      let decoded
      try {
        decoded = decodeURIComponent(withoutFragment)
      } catch {
        failures.push(`${file}:${index + 1}: link is not valid URI text: ${target}`)
        continue
      }

      const destination = resolve(dirname(path), decoded)
      const exists =
        existsSync(destination) &&
        (statSync(destination).isFile() ||
          (statSync(destination).isDirectory() && existsSync(resolve(destination, 'README.md'))))

      if (!exists) failures.push(`${file}:${index + 1}: broken relative link: ${target}`)
    }
  }
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
const security = readFileSync(resolve(root, 'SECURITY.md'), 'utf8')

if (!/pre-alpha/i.test(readme)) failures.push('README.md: must state the pre-alpha status')
if (!/no supported public npm installation/i.test(readme)) {
  failures.push('README.md: must state that public npm installation is not supported')
}
if (/no framework-specific transform yet/i.test(readme)) {
  failures.push('README.md: contains the superseded transform claim')
}
if (/nothing is published yet/i.test(security)) {
  failures.push('SECURITY.md: contains the superseded publication claim')
}

if (failures.length > 0) {
  process.stderr.write(
    `Public surface check failed:\n${failures.map((item) => `- ${item}`).join('\n')}\n`,
  )
  process.exit(1)
}

process.stdout.write(`Public surface check passed for ${files.length} tracked or new files.\n`)
