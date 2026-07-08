---
name: auth-setup
description: checklog.kr apps/app 고객 인증 가이드. Auth.js v5 + Supabase 통합, Credentials Provider, 회원가입 Server Action, 미들웨어 경로 보호, 세션 JWT에 accountId 포함 처리. Auth Engineer 에이전트가 apps/app 인증 구현 시 반드시 이 스킬을 사용한다. '인증', '로그인', '회원가입', 'Auth.js', 'session' 관련 작업 시 트리거.
---

# Auth Setup — apps/app 고객 인증

## 대상 앱 및 파일 경로

**타겟 앱:** `apps/app`

```
apps/app/
├── auth.config.ts        — Auth.js 설정 (providers, callbacks, pages)
├── auth.ts               — NextAuth 인스턴스 export
├── middleware.ts         — 경로 보호
└── app/
    └── actions/
        └── auth.ts       — 회원가입/로그인/로그아웃 Server Action
```

## auth.config.ts 패턴

```typescript
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createClient } from '@checklog/database'  // @/lib/supabase/server 대신 사용

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isDashboard && !isLoggedIn) return false
      return true
    },
    jwt({ token, user }) {
      // 세션 JWT에 accountId 포함 — Server Action에서 auth()로 접근 가능
      if (user) {
        token.accountId = (user as any).accountId
      }
      return token
    },
    session({ session, token }) {
      if (token.accountId) {
        (session.user as any).accountId = token.accountId
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const supabase = createClient()
        const { data: account } = await supabase
          .from('accounts')
          .select('id, email, password_hash, admin_name, company_name')
          .eq('email', parsed.data.email)
          .single()

        if (!account) return null
        const passwordMatch = await bcrypt.compare(parsed.data.password, account.password_hash)
        if (!passwordMatch) return null

        return {
          id: account.id,
          email: account.email,
          name: account.admin_name,
          accountId: account.id,  // JWT callback에서 token에 추가됨
        }
      },
    }),
  ],
}
```

## auth.ts

```typescript
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
```

## middleware.ts

```typescript
import { auth } from '@/auth'

export default auth

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)'],
}
```

## 회원가입 Server Action (`app/actions/auth.ts`)

```typescript
'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createClient } from '@checklog/database'
import { signIn } from '@/auth'

const signUpSchema = z.object({
  company_name: z.string().min(1),
  admin_name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: '입력값을 확인해주세요.' }
  }

  const { company_name, admin_name, phone, email, password } = parsed.data
  const password_hash = await bcrypt.hash(password, 10)

  const supabase = createClient()
  const { error } = await supabase
    .from('accounts')
    .insert({ company_name, admin_name, phone, email, password_hash })

  if (error) {
    if (error.code === '23505') return { success: false, error: '이미 사용 중인 이메일입니다.' }
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
  }

  // 가입 후 자동 로그인
  await signIn('credentials', { email, password, redirectTo: '/dashboard/workspaces' })
  return { success: true }
}
```

## Server Action에서 accountId 접근

```typescript
import { auth } from '@/auth'

export async function someAction() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const accountId = (session.user as any).accountId
  // 모든 쿼리에 accountId 필터 적용
}
```

## 체크리스트

- [ ] `bcryptjs`로 비밀번호 해싱 (평문 저장 금지)
- [ ] JWT callback에서 `accountId` 추가
- [ ] session callback에서 `accountId` 노출
- [ ] middleware가 `/dashboard` 경로 보호
- [ ] `/login`, `/signup`은 공개 접근 가능
- [ ] 회원가입 Server Action에서 중복 이메일 처리
- [ ] Supabase 클라이언트를 `@checklog/database`에서 import
