import { Button } from '@checklog/ui/components/button'

import { siteConfig } from '@/config/site'

export function CtaBanner() {
  return (
    <section className="border-t bg-primary text-primary-foreground">
      <div className="container flex flex-col items-center gap-6 py-16 text-center md:py-20">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
          지금 바로 시설 관리를 시작하세요
        </h2>
        <p className="max-w-xl text-primary-foreground/80">
          무료 플랜으로 부담 없이 시작하고, 필요할 때 확장하세요.
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
            <a href="/contact">도입 문의하기</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
