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
// - callbacks.jwt: JWT 토큰에 tenantId 포함 (Server Action 에서 테넌트 컨텍스트 확보)
// - callbacks.session: 세션에 tenantId 노출
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

      // 로그인 상태에서 /login·/signup 접근 시 대시보드로 보냄
      if (isLoggedIn) {
        const isAuthPage =
          nextUrl.pathname === '/login' || nextUrl.pathname === '/signup'
        if (isAuthPage) {
          return Response.redirect(new URL('/dashboard/workspaces', nextUrl))
        }
      }

      return true
    },

    // 로그인(authorize 반환값)이 user 로 전달될 때 JWT 에 tenantId 적재.
    // 이후 모든 요청에서 token 으로 유지된다.
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as { tenantId?: string }).tenantId
      }
      return token
    },

    // JWT 의 tenantId 를 세션(session.user.tenantId)으로 노출.
    // Server Action 에서 const session = await auth() 로 접근한다.
    session({ session, token }) {
      if (token.tenantId && session.user) {
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
