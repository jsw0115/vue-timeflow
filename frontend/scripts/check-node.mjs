// 지금 쓰는 Node·npm이 package.json engines(Node >=22.12.0, npm >=10)를 만족하는지 확인한다(PR-06, TS-09). 전역 설정은 바꾸지 않는다.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const parse = (version) => String(version).replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10) || 0)

/** ">=22.12.0" 형식의 최소 버전만 다룬다. 다른 형식이면 null을 돌려 확인하지 못했다고 알린다. */
export function minimumOf(range) {
  const match = /^>=\s*(\d+(?:\.\d+){0,2})$/.exec(String(range ?? '').trim())
  return match ? match[1] : null
}

export function satisfies(version, minimum) {
  const have = parse(version), need = parse(minimum)
  for (let index = 0; index < 3; index += 1) {
    if ((have[index] ?? 0) !== (need[index] ?? 0)) return (have[index] ?? 0) > (need[index] ?? 0)
  }
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const engines = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).engines ?? {}
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
  let ok = true
  for (const [name, version] of [['node', process.versions.node], ['npm', npmVersion]]) {
    const minimum = minimumOf(engines[name])
    if (!minimum) { console.log(`${name}: package.json engines 형식을 확인하지 못했어요(${engines[name]}).`); ok = false; continue }
    const pass = satisfies(version, minimum)
    console.log(`${name} ${version} — 필요 ${minimum} 이상 — ${pass ? '충족' : '부족'}`)
    ok &&= pass
  }
  if (!ok) {
    console.log('지원 버전이 아니에요. frontend/.nvmrc의 Node 22를 설치해 쓴 뒤 터미널을 다시 열고 확인하세요.')
    process.exitCode = 1
  }
}
