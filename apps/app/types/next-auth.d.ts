// =============================================================================
// checklog.kr MVP — Auth.js 타입 확장
// =============================================================================
//
// Auth.js 의 Session / User / JWT 에 멀티고객 격리 키인 accountId 를 추가한다.
// 이 선언 덕분에 Server Action 에서 session.user.accountId 를 any 캐스팅 없이
// 타입 안전하게 사용할 수 있다.
// =============================================================================

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      accountId: string
    } & DefaultSession['user']
  }

  // authorize() 가 반환하는 user 객체 형태
  interface User {
    accountId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountId?: string
  }
}
