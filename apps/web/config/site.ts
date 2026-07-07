/**
 * 사이트 전역 설정 — 메타데이터, 내비게이션, 외부 링크, 회사 정보.
 * 마케팅 카피/링크는 여기와 content/* 에 모아 JSX에서 분리한다.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "checklog",
  description:
    "건물·시설 점검부터 민원 관리까지, 현장 운영을 한 곳에서. 멀티테넌트 시설 관리 SaaS.",
  url: "https://checklog.kr",

  /** 헤더/푸터 공용 내비게이션 */
  nav: [
    { label: "기능소개", href: "/features" },
    { label: "요금안내", href: "/pricing" },
    { label: "회사소개", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "도입문의", href: "/contact" },
  ],

  /** 제품 앱(app) 외부 링크 — 마케팅 사이트에는 인증 화면을 두지 않는다 */
  app: {
    url: appUrl,
    login: `${appUrl}/login`,
    signup: `${appUrl}/signup`,
  },

  company: {
    name: "체크로그",
    email: "contact@checklog.kr",
    tel: "02-0000-0000",
    address: "서울특별시",
  },
} as const;

export type SiteConfig = typeof siteConfig;
