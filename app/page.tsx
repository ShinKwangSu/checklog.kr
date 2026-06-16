import { redirect } from 'next/navigation'

/**
 * 루트 진입점. 로그인 페이지로 보낸다.
 * (인증 상태면 미들웨어가 /login 접근을 /dashboard/workspaces 로 리다이렉트한다.)
 */
export default function HomePage() {
  redirect('/login')
}
