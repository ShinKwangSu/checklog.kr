# checklog.kr — 시설 관리 어드민 MVP

## 하네스: 아키텍처 리뷰 에이전트 풀

**목표:** 스택 무관 설계/코드 리뷰 원칙을 담은 독립 호출형 에이전트 7종(시스템/백엔드/DB/프론트/디자인시스템 아키텍처 + 백엔드/프론트 QA)으로 checklog.kr(`apps/app`, `apps/admin`, `apps/web`)의 설계·리뷰를 지원

**트리거:** 아키텍처 설계나 코드 리뷰가 필요하면 해당 영역의 에이전트(`.claude/agents/`)를 상황에 맞춰 개별 호출하라. 에이전트는 서로 통신하지 않으며, 여러 영역이 걸치면 필요한 에이전트를 순서대로 개별 호출한다. 단순 개념 질문은 직접 응답 가능.

## 코딩 컨벤션

### 소프트 딜리트 (필수)

삭제 기능이 있는 모든 엔티티는 하드 딜리트(`.delete()`) 대신 소프트 딜리트를 사용한다.

**규칙:**
- 새 엔티티 테이블 생성 시 `deleted_at TIMESTAMPTZ` 컬럼을 반드시 포함한다.
- 삭제 = `.update({ deleted_at: new Date().toISOString() })`
- 조회 = 모든 SELECT에 `.is('deleted_at', null)` 필터 필수
- 수정 = `.update(...).is('deleted_at', null)` — 삭제된 레코드가 수정되지 않도록 차단
- 부모 엔티티 삭제 시 자식 엔티티도 코드에서 cascade soft delete (DB CASCADE는 하드 딜리트 전용이므로 사용 불가)
- 예외: 조인 테이블(`facility_checklists` 등)은 독립 가치 없으므로 하드 딜리트 유지

**TypeScript 타입:** 새 엔티티의 Row 타입과 Insert 타입 모두에 `deleted_at?: string | null` 추가

**마이그레이션 패턴:**
```sql
ALTER TABLE new_table ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_new_table_active ON new_table (account_id) WHERE deleted_at IS NULL;
```

---

### 폼 다이얼로그 (필수)

입력 폼이 포함된 Dialog는 반드시 `FormDialogContent`를 사용한다.

**규칙:**
- `@checklog/ui/components/dialog`의 `DialogContent` 직접 사용 금지 (폼 다이얼로그에 한함)
- 대신 `@/components/form-dialog`에서 `FormDialogContent`를 import해 사용
- `FormDialogContent`는 바깥 영역 클릭 시 닫힘을 기본 차단한다 (입력 데이터 보호)
- 조회/확인용 다이얼로그(QR 코드, 삭제 확인 등)는 기존 `DialogContent` 그대로 사용

**패턴:**
```tsx
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormDialogContent as DialogContent,
} from '@/components/form-dialog'

// 이하 기존 Dialog 패턴과 동일하게 사용
```

---

## 변경 이력
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-16 | 초기 구성 | 전체 | STEP_1.md 기반 MVP 구현 하네스 신규 구축 |
| 2026-06-16 | 모노레포 전환 반영 | 전체 | apps/app + apps/admin 이중 파이프라인, @checklog/database/@checklog/ui 공유 패키지 도입 |
| 2026-06-19 | 소프트 딜리트 컨벤션 추가 | 전체 | 모든 삭제 기능에 deleted_at 방식 의무화 |
| 2026-06-22 | 폼 다이얼로그 컨벤션 추가 | apps/app | FormDialogContent 래퍼 도입, 바깥 클릭 닫힘 방지 정책 |
| 2026-07-08 | 5-에이전트 빌드 파이프라인 하네스 폐기, ai-guide 기반 7-에이전트 리뷰 풀로 전면 교체 | 전체 | MVP 빌드 완료로 파이프라인 역할 종료, 기존 기술 스킬(db-schema/auth-setup 등)이 스키마·구조 드리프트로 실효성 상실 — 스택 무관 아키텍처 리뷰 원칙 기반 독립 호출형 에이전트로 전환 |
