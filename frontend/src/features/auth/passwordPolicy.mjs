// 비밀번호 정책 화면 검사. 서버 kr.timebar.diary.auth.PasswordPolicy와 같은 기준(8~72자, 공백 불가, 영문·숫자·특수문자 중 2종 이상)이다.
// 화면에서 먼저 알려 줄 뿐이고 최종 판단은 서버가 한다.
export function passwordProblem(value = '') {
  if (value.length < 8 || value.length > 72) return '비밀번호는 8~72자여야 해요.'
  if (/\s/.test(value)) return '비밀번호에 공백을 넣을 수 없어요.'
  const kinds = [/[A-Za-z]/, /[0-9]/, /[^A-Za-z0-9\s]/].filter((pattern) => pattern.test(value)).length
  if (kinds < 2) return '영문·숫자·특수문자 중 2가지 이상을 섞어 주세요.'
  return ''
}
