import { Button } from '@checklog/ui/components/button'

import { siteConfig } from '@/config/site'

export function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-muted/40 to-background">
      <div className="container flex flex-col items-center py-20 text-center md:py-28">
        <span className="mb-4 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
          멀티테넌트 시설 관리 SaaS
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          현장 점검부터 민원 관리까지,
          <br />
          한 곳에서
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <a href={siteConfig.app.signup}>무료로 시작하기</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="/features">기능 살펴보기</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
