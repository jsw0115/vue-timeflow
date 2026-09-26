// 화면별로 고정된(재현 가능한) 목업 콘텐츠를 만들어내는 헬퍼.
// screen.id 문자열을 시드로 사용해 매 화면마다 다른 값이 나오되, 새로고침해도 값이 흔들리지 않는다.

const CATEGORIES = ['업무', '공부', '건강', '가족', '자기계발']
const COLORS = ['mint', 'purple', 'amber', 'blue']
const NAMES = ['지수', '태민', '유나', '하준', '서연', '민재', '수아']

function seed(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function pick(list, id, offset = 0) {
  const h = seed(id + offset)
  return list[h % list.length]
}

export function category(id, offset = 0) {
  return pick(CATEGORIES, id, offset)
}

export function color(id, offset = 0) {
  return pick(COLORS, id, offset)
}

export function personName(id, offset = 0) {
  return pick(NAMES, id, offset)
}

export function percent(id, offset = 0, min = 42, max = 96) {
  const h = seed(id + offset)
  return min + (h % (max - min))
}

// role 설명 문자열을 쪼개서 리스트/필드 라벨로 재사용한다.
export function roleParts(role) {
  return role
    .split(/[,/·+]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function items(screen, count = 5) {
  const parts = roleParts(screen.role)
  const base = parts.length ? parts : [screen.name]
  const out = []
  for (let i = 0; i < count; i++) {
    const label = base[i % base.length]
    out.push({
      id: i,
      title: `${label} ${i + 1}`,
      category: category(screen.id, i),
      color: color(screen.id, i),
      time: `${(9 + i * 2) % 24}:00`,
      done: seed(screen.id + i) % 3 === 0,
      percent: percent(screen.id, i),
      person: personName(screen.id, i),
    })
  }
  return out
}
