import type { Metadata } from 'next'

import { Button } from '@spotcare/ui/components/button'
import { Input } from '@spotcare/ui/components/input'
import { Label } from '@spotcare/ui/components/label'
import { Textarea } from '@spotcare/ui/components/textarea'

import { Section, SectionHeading } from '@/components/sections/section'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '도입문의',
  description: 'spotcare 도입을 검토 중이신가요? 문의를 남겨 주시면 담당자가 연락드립니다.',
}

export default function ContactPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="도입문의"
        title="도입을 검토하고 계신가요?"
        description="아래 폼을 작성해 주시면 담당자가 확인 후 연락드립니다."
      />

      <div className="mx-auto mt-12 max-w-xl">
        {/* 제출 미연동 안내 — 폼은 UI만 제공 */}
        <p className="mb-6 rounded-md border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          문의 폼은 준비 중입니다. 지금은{' '}
          <a
            href={`mailto:${siteConfig.company.email}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {siteConfig.company.email}
          </a>{' '}
          로 문의해 주세요.
        </p>

        <form className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="company">회사명</Label>
            <Input id="company" name="company" placeholder="회사명을 입력하세요" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">담당자명</Label>
            <Input id="name" name="name" placeholder="이름을 입력하세요" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              disabled
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">문의 내용</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              placeholder="도입 규모, 궁금한 점 등을 자유롭게 남겨 주세요."
              disabled
            />
          </div>
          <Button type="submit" className="w-full" disabled>
            문의 보내기 (준비 중)
          </Button>
        </form>
      </div>
    </Section>
  )
}
