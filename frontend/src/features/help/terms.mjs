// 화면 약어·전문용어의 짧은 설명 모음. TermHint가 이 사전만 읽는다(PR-19 UF-135, CF-003). 표시 문구만 담고 내부 값·내보내기 키는 바꾸지 않는다.

/** 약어 → 짧은 설명. 설명은 각 화면의 사용법(HelpPopover) 용어 설명과 같은 뜻으로 쓴다. */
export const TERMS = {
  WBS: { full: 'Work Breakdown Structure', desc: '큰 일을 작은 작업으로 나눠 공수와 진척을 위로 합산해 보는 표예요.' },
  공수: { full: '', desc: '일에 들어간 작업량이에요. 이 서비스는 MD(한 사람의 하루 작업량) 단위로 세요.' },
  MD: { full: 'Man-Day', desc: '한 사람이 하루 온전히 투입했을 때의 작업량이에요.' },
  MM: { full: 'Man-Month', desc: '한 사람이 한 달 투입한 작업량이에요. 월 평균 근무일 20일 기준으로 MD ÷ 20으로 계산해요.' },
}

/** 모르는 용어는 null. 호출한 화면이 설명 없이 글자만 보이게 한다. */
export function termOf(term) {
  return Object.hasOwn(TERMS, term) ? TERMS[term] : null
}
