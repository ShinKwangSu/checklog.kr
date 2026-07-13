// =============================================================================
// checklog.kr MVP — NextAuth 인스턴스 (Node 런타임)
// =============================================================================
//
// Credentials Provider 의 authorize() 는 bcryptjs 와 Supabase 서버 클라이언트를
// 사용하므로 Node 런타임 전용이다. 따라서 Edge 호환 authConfig 에 이 파일에서
// providers 를 더해 최종 NextAuth 인스턴스를 만든다.
//
// export: handlers, auth, signIn, signOut
// =============================================================================

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { createClient } from '@/lib/supabase/server'
// domain/auth 배럴(index.ts)은 actions/auth.actions.ts를 재export하고 그 파일이
// signIn/signOut을 이 파일(@/auth)에서 import하므로, 배럴을 쓰면 순환 참조가 된다.
// repository는 '@/auth'에 의존하지 않으므로 deep import로 우회한다.
// eslint-disable-next-line no-restricted-imports
import { authRepository } from '@/domain/auth/repository/auth.repository'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // formData/JSON 어느 쪽으로 와도 처리 가능하도록 명시
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        // service_role 클라이언트로 accounts 조회(로그인 전이라 RLS-respecting 불가).
        const supabase = createClient()
        const account = await authRepository.findAccountByEmail(supabase, email)
        if (!account) return null

        const passwordMatch = await bcrypt.compare(password, account.password_hash)
        if (!passwordMatch) return null

        // 정지된 계정은 비밀번호가 맞아도 로그인을 차단한다(pending은 로그인 허용).
        if (account.status === 'suspended') return null

        // 여기서 반환되는 객체가 jwt() 콜백의 user 로 전달된다.
        // password_hash 는 절대 포함하지 않는다(세션/토큰 누출 방지).
        return {
          id: account.id,
          email: account.email,
          name: account.admin_name,
          accountId: account.id, // jwt 콜백에서 token.accountId 로 적재됨
        }
      },
    }),
  ],
})
