/**
 * 휴대폰 번호(010) 포매터.
 * 입력값에서 숫자만 추출(최대 11자리)한 뒤 010-XXX(X)-XXXX 형태로 하이픈을 붙인다.
 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (!d) return ''

  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** 하이픈을 제거한 숫자만 반환 (서버 제출용) */
export function rawPhone(formatted: string): string {
  return formatted.replace(/-/g, '')
}
