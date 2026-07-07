// =============================================================================
// checklog.kr Admin — Auth.js v5 설정 (Edge 호환)
// =============================================================================
//
// 이 파일은 middleware(Edge 런타임)에서 그대로 사용된다.
// 따라서 Node 전용 모듈(bcryptjs, @supabase/supabase-js 서버 클라이언트)을
// 직접 import 하지 않는다. Credentials Provider 의 실제 검증 로직(bcrypt 비교,
// Supabase 쿼리)은 Node 런타임에서 동작하는 auth.ts 에서 주입한다.
//
// - pages: 로그인 페이지 경로
// - callbacks.authorized: 미들웨어 경로 보호 (/dashboard 이하 인증 필요)
// - callbacks.jwt: JWT 토큰에 adminId 포함 (Server Action 에서 운영자 식별)
// - callbacks.session: 세션에 adminId 노출
//
// 슈퍼어드민은 회원가입 플로우가 없다(/signup 미존재). 계정은 시딩으로 발급한다.
// =============================================================================

import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: 'checklog-admin.session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
    },
  },
  // providers 는 auth.ts 에서 Credentials Provider 를 더해 완성한다.
  // (Edge 호환을 위해 이 파일에는 Node 전용 의존성을 두지 않는다.)
  providers: [],
  callbacks: {
    // 미들웨어 경로 보호.
    // /dashboard 이하는 인증 필요, 그 외(/login 등)는 허용.
    authorized({ auth, request: { nextUrl } }) {
      // adminId 가 JWT에 없으면 유효한 세션으로 취급하지 않는다.
      // (adminId 없는 스테일 JWT가 루프를 유발하는 것을 방지)
      const isAdmin = !!(auth?.user as { adminId?: string } | undefined)?.adminId
      const isDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isDashboard) {
        return isAdmin
      }

      // 정상 인증된 상태에서 /login 접근 시 대시보드로 보냄
      if (isAdmin && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },

    // 로그인(authorize 반환값)이 user 로 전달될 때 JWT 에 adminId 적재.
    // 이후 모든 요청에서 token 으로 유지된다.
    jwt({ token, user }) {
      if (user) {
        token.adminId = (user as { adminId?: string }).adminId
      }
      return token
    },

    // JWT 의 adminId 를 세션(session.user.adminId)으로 노출.
    // Server Action 에서 const session = await auth() 로 접근한다.
    session({ session, token }) {
      if (token.adminId && session.user) {
        session.user.adminId = token.adminId as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
