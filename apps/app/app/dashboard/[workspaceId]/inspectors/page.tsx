import { notFound } from 'next/navigation'

import { getWorkspace } from '@/app/actions/workspace'
import { getInspectors } from '@/app/actions/inspector'
import { InspectorManager } from '@/components/inspector-manager'

export default async function InspectorsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const workspaceResult = await getWorkspace(workspaceId)
  if (!workspaceResult.success || !workspaceResult.data) notFound()
  const workspace = workspaceResult.data

  const inspectors = await getInspectors(workspaceId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">점검자 관리</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.workspace_name} · 점검 담당자를 관리하세요.
        </p>
      </div>

      <InspectorManager workspaceId={workspaceId} inspectors={inspectors} />
    </div>
  )
}
