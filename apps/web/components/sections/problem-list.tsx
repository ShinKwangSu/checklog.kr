import { Card, CardHeader, CardTitle, CardDescription } from '@checklog/ui/components/card'

import { problems } from '@/content/problems'

/** 랜딩 Problem 섹션 — 고객이 겪는 3가지 문제(수치 강조) */
export function ProblemList() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {problems.map((problem) => (
        <Card key={problem.title} className="h-full">
          <CardHeader>
            <p className="text-3xl font-bold tracking-tight text-primary">
              {problem.stat}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">{problem.statLabel}</p>
            <CardTitle className="text-lg">{problem.title}</CardTitle>
            <CardDescription>{problem.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
