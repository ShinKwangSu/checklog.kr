// =============================================================================
// checklog.kr MVP — 시설 타입 관리 페이지
// =============================================================================
// 서버 컴포넌트: 워크스페이스 소유권 확인 + 타입 목록 조회 후
// 클라이언트 매니저(FacilityTypeManager)로 CRUD UI 렌더.
// =============================================================================

import { notFound } from 'next/navigation'

import { getWorkspace } from '@/app/actions/workspace'
import { getFacilityTypes } from '@/app/actions/facility-type'
import { FacilityTypeManager } from '@/components/facility-type-manager'

export default async function FacilityTypesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const workspaceResult = await getWorkspace(workspaceId)
  if (!workspaceResult.success || !workspaceResult.data) notFound()
  const workspace = workspaceResult.data

  const facilityTypes = await getFacilityTypes(workspaceId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">시설 타입 관리</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.workspace_name} · 시설을 분류할 타입을
          관리하세요.
        </p>
      </div>

      <FacilityTypeManager
        workspaceId={workspaceId}
        facilityTypes={facilityTypes}
      />
    </div>
  )
}
