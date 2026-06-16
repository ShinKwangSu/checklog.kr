'use client'

// =============================================================================
// spotcare.kr MVP — 워크스페이스 행 액션 (수정 Dialog + 삭제 확인)
// =============================================================================

import { deleteWorkspace } from '@/app/actions/workspace'
import type { Workspace } from '@/types/database'
import { Button } from '@spotcare/ui/components/button'
import { Pencil } from 'lucide-react'
import { WorkspaceFormDialog } from '@/components/workspace-form-dialog'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'

export function WorkspaceRowActions({ workspace }: { workspace: Workspace }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <WorkspaceFormDialog
        workspace={workspace}
        trigger={
          <Button variant="ghost" size="icon" aria-label="수정">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <ConfirmDeleteButton
        onConfirm={() => deleteWorkspace(workspace.id)}
        title="워크스페이스를 삭제하시겠습니까?"
        description="하위 시설 타입과 시설 정보가 모두 함께 삭제됩니다. 되돌릴 수 없습니다."
        successMessage="워크스페이스를 삭제했습니다."
      />
    </div>
  )
}
