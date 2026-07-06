'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Button } from '@spotcare/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@spotcare/ui/components/sheet'

import { siteConfig } from '@/config/site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {siteConfig.name}
        </Link>

        {/* 데스크톱 내비 */}
        <nav className="hidden items-center gap-6 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 데스크톱 CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <a href={siteConfig.app.login}>로그인</a>
          </Button>
          <Button asChild>
            <a href={siteConfig.app.signup}>무료로 시작하기</a>
          </Button>
        </div>

        {/* 모바일 메뉴 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="메뉴 열기">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="text-left text-lg font-bold">
              {siteConfig.name}
            </SheetTitle>
            <nav className="mt-6 flex flex-col gap-1">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" asChild>
                <a href={siteConfig.app.login}>로그인</a>
              </Button>
              <Button asChild>
                <a href={siteConfig.app.signup}>무료로 시작하기</a>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
