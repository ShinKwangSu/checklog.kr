import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@spotcare/ui/components/card'

import { features, type Feature } from '@/content/features'

/** 홈: 요약 그리드(설명만) / 기능소개: 상세 불릿까지 */
export function FeatureGrid({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} detailed={detailed} />
      ))}
    </div>
  )
}

function FeatureCard({
  feature,
  detailed,
}: {
  feature: Feature
  detailed: boolean
}) {
  const Icon = feature.icon
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{feature.title}</CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      {detailed && (
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {feature.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
