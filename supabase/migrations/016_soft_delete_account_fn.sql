-- =============================================================================
-- checklog.kr MVP — Migration 016
-- soft_delete_account(): 계정 + 자식 엔티티 cascade 소프트 딜리트 (단일 트랜잭션)
-- =============================================================================
-- 배경:
--   계정 삭제는 하드 딜리트가 아니라 UPDATE(deleted_at)이므로 FK ON DELETE CASCADE가
--   발동하지 않는다. 기존에는 앱(account.repository)에서 자식 테이블을 순차 UPDATE 후
--   계정을 UPDATE 했는데, 각 문장이 개별 커밋되어 중간 실패 시 "부분 삭제" 상태가
--   영구히 남는 문제가 있었다.
--
--   이 함수는 모든 UPDATE를 단일 트랜잭션(함수 본문)으로 원자 실행한다. 어느 한
--   단계라도 실패하면 전체가 롤백되어 정합성이 보존된다.
--
-- 스코프:
--   account_id 로 스코프되는 모든 소프트 딜리트 대상 테이블을 처리한다.
--   facility_checklists(조인 테이블, deleted_at 없음)는 제외한다(하드 딜리트 대상).
--
-- 호출:
--   service_role 클라이언트에서 .rpc('soft_delete_account', { p_account_id }) 로 호출.
--   SECURITY INVOKER(기본) 이므로 anon/authenticated 로는 실행 권한을 회수한다.
-- =============================================================================

CREATE OR REPLACE FUNCTION soft_delete_account(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  UPDATE workspaces      SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE facility_types  SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE facilities      SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE inspectors      SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE checklists      SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE checklist_items SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE complaints      SET deleted_at = v_now WHERE account_id = p_account_id AND deleted_at IS NULL;
  UPDATE accounts        SET deleted_at = v_now WHERE id = p_account_id AND deleted_at IS NULL;
END;
$$;

-- 이 함수는 슈퍼어드민(service_role) 전용이다. 일반 롤의 실행 권한을 회수한다.
REVOKE ALL ON FUNCTION soft_delete_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION soft_delete_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION soft_delete_account(uuid) FROM authenticated;

-- =============================================================================
-- END OF MIGRATION 016
-- =============================================================================
