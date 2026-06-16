import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'spotcare Admin',
  description: 'spotcare.kr 서비스 관리자 포털',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
