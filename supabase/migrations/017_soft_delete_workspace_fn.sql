-- =============================================================================
-- checklog.kr MVP — Migration 017
-- soft_delete_workspace(): 워크스페이스 + 자식 엔티티 cascade 소프트 딜리트 (단일 트랜잭션)
-- =============================================================================
-- 배경:
-- 워크스페이스 삭제도 하드 딜리트가 아니라 UPDATE(deleted_at)이므로 FK ON DELETE
-- CASCADE가 발동하지 않는다. 기존에는 앱(workspace.repository)에서 자식 5개
-- 테이블을 Promise.all 로 병렬 UPDATE 한 뒤 본체를 UPDATE 했는데, 각 문장이
-- 개별 커밋되어 중간 실패 시 "부분 삭제" 상태가 영구히 남는 문제가 있었다.
-- 016 soft_delete_account 와 동일한 문제였으므로 같은 해법을 적용한다.
--
-- 함수는 모든 UPDATE를 단일 트랜잭션(함수 본문)으로 원자 실행한다. 어느 한
-- 단계라도 실패하면 전체가 롤백되어 정합성이 보존된다.
--
-- 스코프:
-- workspace_id + account_id 이중 스코프(격리)되는 모든 소프트 딜리트 대상
-- 테이블 + 워크스페이스 본체를 처리한다. facility_checklists(조인 테이블,
-- deleted_at 없음)는 제외한다(하드 딜리트 유지 대상, CLAUDE.md 예외 규칙).
--
-- 호출: apps/app 은 service_role 키를 사용해 RLS 를 우회하므로(회원 격리는
-- 코드 레벨 account_id/workspace_id 필터가 실질 방어선), 함수 본문의 WHERE 절
-- 이중 스코프가 RPC 레벨의 유일한 방어선이다. 앱에서는
-- supabase.rpc('soft_delete_workspace', { p_workspace_id, p_account_id })
-- 로 호출한다. SECURITY INVOKER(기본)이므로 anon/authenticated 로는 실행 권한을
-- 회수한다.
-- =============================================================================

CREATE OR REPLACE FUNCTION soft_delete_workspace(
  p_workspace_id uuid,
  p_account_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  UPDATE checklist_items SET deleted_at = v_now
    WHERE workspace_id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
  UPDATE facilities SET deleted_at = v_now
    WHERE workspace_id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
  UPDATE facility_types SET deleted_at = v_now
    WHERE workspace_id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
  UPDATE inspectors SET deleted_at = v_now
    WHERE workspace_id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
  UPDATE checklists SET deleted_at = v_now
    WHERE workspace_id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
  UPDATE workspaces SET deleted_at = v_now
    WHERE id = p_workspace_id AND account_id = p_account_id AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION soft_delete_workspace(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION soft_delete_workspace(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION soft_delete_workspace(uuid, uuid) FROM authenticated;

-- =============================================================================
-- END OF MIGRATION 017
-- =============================================================================
