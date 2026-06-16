'use client'

import { LogOut } from 'lucide-react'

import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

/**
 * 로그아웃 버튼. form action 으로 logoutAction 을 호출하면
 * 액션 내부에서 signOut 후 /login 으로 redirect 된다.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>
    </form>
  )
}
