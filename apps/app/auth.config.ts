// =============================================================================
// checklog.kr MVP — Auth.js v5 설정 (Edge 호환)
// =============================================================================
//
// 이 파일은 middleware(Edge 런타임)에서 그대로 사용된다.
// 따라서 Node 전용 모듈(bcryptjs, @supabase/supabase-js 서버 클라이언트)을
// 직접 import 하지 않는다. Credentials Provider 의 실제 검증 로직(bcrypt 비교,
// Supabase 쿼리)은 Node 런타임에서 동작하는 auth.ts 에서 주입한다.
//
// - pages: 로그인 페이지 경로
// - callbacks.authorized: 미들웨어 경로 보호 (/dashboard 이하 인증 필요)
// - callbacks.jwt: JWT 토큰에 accountId 포함 (Server Action 에서 고객 컨텍스트 확보)
// - callbacks.session: 세션에 accountId 노출
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
      name: 'checklog-app.session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
    },
  },
  // providers 는 auth.ts 에서 Credentials Provider 를 더해 완성한다.
  // (Edge 호환을 위해 이 파일에는 Node 전용 의존성을 두지 않는다.)
  providers: [],
  callbacks: {
    // 미들웨어 경로 보호.
    // /dashboard 이하는 인증 필요, 그 외(/login, /signup, 공개 페이지)는 허용.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isDashboard) {
        // 비로그인 → 차단(Auth.js 가 자동으로 /login 으로 리다이렉트)
        return isLoggedIn
      }

      // 로그인 상태에서 /login·/signup·/forgot-password·/reset-password 접근 시 대시보드로 보냄.
      // /verify-email 은 제외한다 — pending 상태는 로그인이 허용되므로, 로그인한 채로
      // 인증 메일 링크를 열어도 인증 버튼을 누를 수 있어야 한다.
      if (isLoggedIn) {
        const isAuthPage =
          nextUrl.pathname === '/login' ||
          nextUrl.pathname === '/signup' ||
          nextUrl.pathname === '/forgot-password' ||
          nextUrl.pathname === '/reset-password'
        if (isAuthPage) {
          return Response.redirect(new URL('/dashboard/workspaces', nextUrl))
        }
      }

      return true
    },

    // 로그인(authorize 반환값)이 user 로 전달될 때 JWT 에 accountId 적재.
    // 이후 모든 요청에서 token 으로 유지된다.
    jwt({ token, user }) {
      if (user) {
        token.accountId = (user as { accountId?: string }).accountId
      }
      return token
    },

    // JWT 의 accountId 를 세션(session.user.accountId)으로 노출.
    // Server Action 에서 const session = await auth() 로 접근한다.
    session({ session, token }) {
      if (token.accountId && session.user) {
        session.user.accountId = token.accountId as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
