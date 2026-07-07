/**
 * 사이트 전역 설정 — 메타데이터, 내비게이션, 외부 링크, 회사 정보.
 * 마케팅 카피/링크는 여기와 content/* 에 모아 JSX에서 분리한다.
 */

/** 제품 앱은 항상 외부 서비스(app.checklog.kr)로 연계한다 — 환경 무관 고정 */
const appUrl = "https://app.checklog.kr";

export const siteConfig = {
  name: "CheckLog",
  description:
    "종이 점검표를 QR 하나로. 현장 점검부터 방문자 민원까지, 여러 현장을 한 곳에서 관리하는 현장 운영 도구.",
  url: "https://checklog.kr",

  /** 헤더/푸터 공용 내비게이션 — 원페이지 앵커 링크 */
  nav: [
    { label: "기능소개", href: "/#features" },
    { label: "요금안내", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "도입문의", href: "/#contact" },
  ],

  /** 제품 앱(app) 외부 링크 — 마케팅 사이트에는 인증 화면을 두지 않는다 */
  app: {
    url: appUrl,
    login: `${appUrl}/login`,
    signup: `${appUrl}/signup`,
  },

  company: {
    name: "CheckLog",
    koreanName: "체크로그",
    email: "contact@checklog.kr",
    tel: "02-0000-0000",
    address: "서울특별시",
  },
} as const;

export type SiteConfig = typeof siteConfig;
