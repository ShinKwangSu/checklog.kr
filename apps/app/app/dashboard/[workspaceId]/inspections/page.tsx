import { notFound } from 'next/navigation'
import { getWorkspace } from '@/domain/workspace'
import { getWorkspaceInspectionHistory } from '@/domain/inspection'
import { InspectionsManager } from '@/components/inspections-manager'

export default async function InspectionsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const workspaceResult = await getWorkspace(workspaceId)
  if (!workspaceResult.success || !workspaceResult.data) notFound()
  const workspace = workspaceResult.data

  const items = await getWorkspaceInspectionHistory(workspaceId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">점검 관리</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.workspace_name} · 전체 시설의 점검 이력을 확인합니다.
        </p>
      </div>
      <InspectionsManager workspaceName={workspace.workspace_name} items={items} />
    </div>
  )
}
