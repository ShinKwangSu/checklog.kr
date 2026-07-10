import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  // bcrypt 72바이트 상한과 과대입력 방어를 위해 상한을 둔다(발급 비밀번호는 ≤72자).
  password: z.string().min(1, '비밀번호를 입력해주세요.').max(72),
})
