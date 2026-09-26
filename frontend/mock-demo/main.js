import { demo } from './data/demo-data.js'

const typeClass = { '일정': 'event', '할 일': 'task', '루틴': 'routine' }
const root = document.querySelector('#app')
root.innerHTML = `
  <main class="shell">
    <header><div><p class="eyebrow">TIMEFLOW · MOCK DEMO</p><h1>${demo.profile.name}의 오늘</h1><p>${demo.date} · ${demo.profile.mode} 모드</p></div><button id="refresh">시연 데이터 다시 보기</button></header>
    <section class="summary">${demo.summary.map((item) => `<article><p>${item.label}</p><strong>${item.value}</strong><small>${item.detail}</small></article>`).join('')}</section>
    <section class="grid"><article class="panel"><div class="title"><h2>오늘의 타임바</h2><span>Actual</span></div><ol>${demo.timeline.map((item) => `<li><time>${item.time}</time><span class="dot ${typeClass[item.kind]}"></span><div><b>${item.title}</b><small>${item.kind}</small></div></li>`).join('')}</ol></article><article class="panel"><div class="title"><h2>오늘의 루틴</h2><span>${demo.routines.filter((r) => r.done).length}/${demo.routines.length}</span></div><ul>${demo.routines.map((item) => `<li><button class="check ${item.done ? 'done' : ''}" aria-label="${item.name}">${item.done ? '✓' : ''}</button>${item.name}</li>`).join('')}</ul><p class="hint">체크를 눌러 시연 상태를 바꿔 보세요.</p></article></section>
    <footer>이 화면은 API나 DB를 사용하지 않는 정적 목업 시연입니다.</footer>
  </main>`

document.querySelectorAll('.check').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('done'); button.textContent = button.classList.contains('done') ? '✓' : ''
}))
document.querySelector('#refresh').addEventListener('click', () => location.reload())
