import Link from 'next/link'

import { siteConfig } from '@/config/site'

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col gap-8 py-12 md:flex-row md:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-bold tracking-tight">{siteConfig.name}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">바로가기</p>
          <ul className="space-y-2">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">문의</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{siteConfig.company.name}</li>
            <li>
              <a
                href={`mailto:${siteConfig.company.email}`}
                className="transition-colors hover:text-foreground"
              >
                {siteConfig.company.email}
              </a>
            </li>
            <li>{siteConfig.company.tel}</li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container py-6">
          <p className="text-xs text-muted-foreground">
            © {siteConfig.company.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
