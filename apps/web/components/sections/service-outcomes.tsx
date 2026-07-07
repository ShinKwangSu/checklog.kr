import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@checklog/ui/components/card'

import { outcomes } from '@/content/outcomes'

/** 랜딩 Services 섹션 — 서비스 3가지 + 각각의 효과 수치 */
export function ServiceOutcomes() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {outcomes.map((outcome) => {
        const Icon = outcome.icon
        return (
          <Card key={outcome.title} className="flex h-full flex-col">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{outcome.title}</CardTitle>
              <CardDescription>{outcome.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xl font-bold tracking-tight text-primary">
                  {outcome.metric}
                </p>
                <p className="text-xs text-muted-foreground">{outcome.metricLabel}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
