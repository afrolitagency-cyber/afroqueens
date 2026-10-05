// scripts/check-authz.mjs — fails the build when admin server code skips the role check.
//
// - Every exported function in a 'use server' file under app/(admin) must call `requireStaff(`.
// - Every exported handler in app/api/admin/** (and the routes listed below) must call `requireStaffApi(`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const STAFF_ONLY_ROUTES = ['app/api/newsletter/send/route.ts']

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(path)
  }
  return out
}

/** Split source into one chunk per top-level export so each can be checked on its own. */
function exportChunks(source) {
  const starts = [...source.matchAll(/^export\s+(async\s+function|function|const|let)\s+(\w+)/gm)]
  return starts.map((m, i) => ({
    kind: m[1],
    name: m[2],
    body: source.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : source.length),
  }))
}

const failures = []

for (const file of walk(join(root, 'app', '(admin)'))) {
  const source = readFileSync(file, 'utf8')
  if (!/^\s*(\/\/.*\n\s*)*['"]use server['"]/.test(source)) continue
  for (const chunk of exportChunks(source)) {
    if (chunk.kind !== 'async function') {
      failures.push(`${relative(root, file)}: export "${chunk.name}" must be an \`export async function\``)
    } else if (!chunk.body.includes('await requireStaff(')) {
      failures.push(`${relative(root, file)}: ${chunk.name}() does not call requireStaff()`)
    }
  }
}

const routeFiles = [
  ...walk(join(root, 'app', 'api', 'admin')).filter(f => f.endsWith('route.ts')),
  ...STAFF_ONLY_ROUTES.map(p => join(root, p)),
]
for (const file of routeFiles) {
  const source = readFileSync(file, 'utf8')
  for (const chunk of exportChunks(source)) {
    if (!/^(GET|POST|PUT|PATCH|DELETE)$/.test(chunk.name)) continue
    if (!chunk.body.includes('requireStaffApi(')) {
      failures.push(`${relative(root, file)}: ${chunk.name} handler does not call requireStaffApi()`)
    }
  }
}

if (failures.length) {
  console.error('Authorisation check failed:\n' + failures.map(f => `  - ${f}`).join('\n'))
  process.exit(1)
}
console.log('Authorisation check passed.')
