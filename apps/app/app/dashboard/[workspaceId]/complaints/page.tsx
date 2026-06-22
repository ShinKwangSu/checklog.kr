import { notFound } from 'next/navigation'
import { getWorkspace } from '@/app/actions/workspace'
import { getWorkspaceComplaints } from '@/app/actions/complaint'
import { ComplaintsManager } from '@/components/complaints-manager'

export default async function ComplaintsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const workspaceResult = await getWorkspace(workspaceId)
  if (!workspaceResult.success || !workspaceResult.data) notFound()
  const workspace = workspaceResult.data

  const items = await getWorkspaceComplaints(workspaceId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">민원 관리</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.workspace_name} · 전체 시설의 접수 민원을 확인하고 처리합니다.
        </p>
      </div>
      <ComplaintsManager workspaceName={workspace.workspace_name} initialItems={items} />
    </div>
  )
}
