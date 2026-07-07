import { Button } from '@checklog/ui/components/button'

import { siteConfig } from '@/config/site'

export function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-muted/40 to-background">
      <div className="container flex flex-col items-center py-20 text-center md:py-28">
        <span className="mb-4 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
          현장 점검 · 민원 관리 SaaS
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          종이 점검표, 이제
          <br />
          QR 하나로 끝냅니다
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          현장에선 QR 스캔 한 번으로 점검 완료, 본사에선 여러 현장의 점검 현황을
          실시간으로. 점검부터 민원까지 한 곳에서 관리하는 현장 운영 도구.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <a href={siteConfig.app.signup}>무료로 시작하기</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="/#features">기능 살펴보기</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
