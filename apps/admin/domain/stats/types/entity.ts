// =============================================================================
// stats 도메인 — 대시보드 통계 DTO
// =============================================================================

/**
 * 대시보드 운영 통계.
 * - adminCount: 슈퍼어드민 계정 수
 * - accountCount: 전체 고객(업체) 수
 * - facilityCount: 전체 시설 수
 */
export type DashboardStatsDto = {
  adminCount: number
  accountCount: number
  facilityCount: number
}
