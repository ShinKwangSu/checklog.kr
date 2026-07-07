import { Button } from '@checklog/ui/components/button'

import { siteConfig } from '@/config/site'

export function CtaBanner() {
  return (
    <section className="border-t bg-primary text-primary-foreground">
      <div className="container flex flex-col items-center gap-6 py-16 text-center md:py-20">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
          오늘 관리하는 현장부터, 바로 시작해 보세요
        </h2>
        <p className="max-w-xl text-primary-foreground/80">
          카드 등록 없이 무료로 시작(현장 1곳 · 시설 30개). 현장 하나에 QR을 붙이는 데
          5분이면 충분합니다. 여러 건물로 늘면 그때 Pro로 확장하세요.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <a href={siteConfig.app.signup}>무료로 시작하기</a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            asChild
          >
            <a href="/#contact">도입 문의하기</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
