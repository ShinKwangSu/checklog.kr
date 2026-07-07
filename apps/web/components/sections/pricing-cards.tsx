import { Check } from 'lucide-react'

import { Button } from '@checklog/ui/components/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@checklog/ui/components/card'
import { cn } from '@checklog/ui/lib/utils'

import { pricingPlans } from '@/content/pricing'
import { siteConfig } from '@/config/site'

export function PricingCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {pricingPlans.map((plan) => (
        <Card
          key={plan.name}
          className={cn(
            'flex h-full flex-col',
            plan.featured && 'border-primary shadow-lg'
          )}
        >
          <CardHeader>
            {plan.featured && (
              <span className="mb-2 w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                추천
              </span>
            )}
            <CardTitle>{plan.name}</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              )}
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={plan.featured ? 'default' : 'outline'}
              asChild
            >
              {plan.name === 'Enterprise' ? (
                <a href="/contact">{plan.cta}</a>
              ) : (
                <a href={siteConfig.app.signup}>{plan.cta}</a>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
