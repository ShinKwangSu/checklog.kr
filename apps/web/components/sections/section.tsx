import { cn } from '@checklog/ui/lib/utils'

type SectionProps = {
  children: React.ReactNode
  className?: string
  /** 옅은 배경 강조 섹션 */
  muted?: boolean
}

/** 페이지 세로 리듬을 통일하는 공통 섹션 래퍼 */
export function Section({ children, className, muted }: SectionProps) {
  return (
    <section className={cn(muted && 'bg-muted/30', className)}>
      <div className="container py-16 md:py-24">{children}</div>
    </section>
  )
}

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
