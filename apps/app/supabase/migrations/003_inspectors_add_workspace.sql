-- =============================================================================
-- spotcare.kr MVP — Migration 003
-- inspectors 테이블에 workspace_id 추가 (테넌트 레벨 → 워크스페이스 레벨 전환)
-- =============================================================================
-- 기존 테이블이 비어 있는 경우에만 안전하게 실행됩니다.
-- 데이터가 있다면 workspace_id 값을 먼저 채운 뒤 NOT NULL 제약을 걸어야 합니다.
-- =============================================================================

ALTER TABLE inspectors
  ADD COLUMN workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_inspectors_workspace_id ON inspectors(workspace_id);

COMMENT ON COLUMN inspectors.workspace_id IS '소속 워크스페이스. 워크스페이스 삭제 시 CASCADE.';
COMMENT ON COLUMN inspectors.tenant_id    IS 'RLS 격리용 비정규화 FK.';

-- =============================================================================
-- END OF MIGRATION 003
-- =============================================================================
