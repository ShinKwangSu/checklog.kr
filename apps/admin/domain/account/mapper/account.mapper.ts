// =============================================================================
// account 도메인 — mapper (DB Row → 도메인 DTO)
// =============================================================================
//
// password_hash 노출 금지: Account Row 에 password_hash 가 흘러들어와도 매핑
// 결과에 포함하지 않는다(명시적 필드 분해).
// =============================================================================

import type { Account, Workspace } from '@checklog/database'
import type {
  AccountDto,
  AccountDetailDto,
  WorkspaceSummaryDto,
} from '../types'

/** Account Row(password_hash 가 섞여 있어도) → AccountDto */
export function toAccountDto(row: Account): AccountDto {
  return {
    id: row.id,
    companyName: row.company_name,
    adminName: row.admin_name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    // password_hash 절대 포함하지 않음
  }
}

/** Workspace Row → WorkspaceSummaryDto */
export function toWorkspaceSummaryDto(row: Workspace): WorkspaceSummaryDto {
  return {
    id: row.id,
    workspaceName: row.workspace_name,
    maxFloor: row.max_floor,
    minFloor: row.min_floor,
    createdAt: row.created_at,
  }
}

/** workspaces 가 조인된 Account Row → AccountDetailDto */
export function toAccountDetailDto(
  row: Account & { workspaces?: Workspace[] | null }
): AccountDetailDto {
  return {
    ...toAccountDto(row),
    workspaces: (row.workspaces ?? []).map(toWorkspaceSummaryDto),
  }
}
