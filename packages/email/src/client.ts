// =============================================================================
// checklog.kr — Resend 클라이언트
// =============================================================================
// 'server-only' 로 보호한다. RESEND_API_KEY 는 절대 클라이언트 번들에 포함되어선
// 안 된다.
// =============================================================================

import 'server-only'
import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  throw new Error('환경변수 RESEND_API_KEY 가 설정되지 않았습니다.')
}

export const resend = new Resend(apiKey)
