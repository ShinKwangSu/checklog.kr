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
        // password_hash 는 서버에서만 SELECT — 클라이언트로 절대 반환하지 않는다.
        const supabase = createClient()
        const { data: account, error } = await supabase
          .from('accounts')
          .select('id, email, password_hash, admin_name, company_name')
          .eq('email', email)
          .single()

        if (error || !account) return null

        const passwordMatch = await bcrypt.compare(password, account.password_hash)
        if (!passwordMatch) return null

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
