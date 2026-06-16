---
name: mvp-orchestrator
description: spotcare.kr MVP 전체 구현 오케스트레이터. DB 스키마 → 인증 → 백엔드 → UI → QA 순서로 5명의 전문 에이전트를 파이프라인으로 조율한다. '구현해줘', '만들어줘', '개발 시작', '다음 단계', '다시 실행', '재실행', '업데이트', '수정', '보완', '이어서', 'STEP_1', 'MVP', '시설 관리', '어드민' 등 spotcare.kr 개발 관련 모든 요청 시 반드시 이 스킬을 사용한다.
---

# MVP Orchestrator — spotcare.kr

## 실행 모드

**서브 에이전트 파이프라인** — 각 에이전트가 이전 에이전트의 파일 산출물을 입력으로 받아 순차 실행. 에이전트 간 직접 통신 없이 `_workspace/` 파일로 데이터 전달.

```
db-architect → auth-engineer → backend-engineer → ui-engineer → qa-engineer
```

---

## Phase 0: 컨텍스트 확인

시작 전 `_workspace/` 디렉토리 존재 여부를 확인하여 실행 모드를 결정한다.

- **`_workspace/` 없음** → 초기 실행: Phase 1부터 전체 실행
- **`_workspace/` 있음 + 사용자가 전체 재실행 요청** → `_workspace/`를 `_workspace_prev/`로 이동 후 초기 실행
- **`_workspace/` 있음 + 사용자가 특정 부분 수정 요청** → 해당 에이전트만 재실행 (부분 재실행)
  - "스키마 수정" → db-architect만
  - "UI 수정" → ui-engineer만
  - "QA 다시" → qa-engineer만

---

## Phase 1: DB 스키마 (db-architect)

**에이전트:** `db-architect` (model: opus)

**프롬프트 구성:**
```
db-schema 스킬과 STEP_1.md를 읽고 spotcare.kr MVP Supabase 스키마를 구현하라.

산출물:
1. supabase/migrations/001_initial_schema.sql — DDL + RLS 정책
2. types/database.ts — TypeScript 타입
3. _workspace/01_db_schema.md — 다음 에이전트를 위한 스키마 요약
   (테이블 구조, 컬럼 타입, FK 관계, tenant_id 접근 방법 포함)

이전 산출물이 있으면 먼저 읽고 개선을 반영한다.
```

---

## Phase 2: 인증 (auth-engineer)

**에이전트:** `auth-engineer` (model: opus)

**선행 조건:** `_workspace/01_db_schema.md` 존재 확인

**프롬프트 구성:**
```
auth-setup 스킬과 _workspace/01_db_schema.md를 읽고 spotcare.kr MVP 인증 시스템을 구현하라.

산출물:
1. auth.ts, auth.config.ts — Auth.js v5 설정
2. middleware.ts — 경로 보호
3. app/actions/auth.ts — 회원가입/로그인 Server Action
4. _workspace/02_auth_session.md — 세션 구조, tenant_id 접근 방법 요약

이전 산출물이 있으면 먼저 읽고 개선을 반영한다.
```

---

## Phase 3: 백엔드 (backend-engineer)

**에이전트:** `backend-engineer` (model: opus)

**선행 조건:** `_workspace/01_db_schema.md`, `_workspace/02_auth_session.md` 존재 확인

**프롬프트 구성:**
```
facility-backend 스킬과 _workspace/01_db_schema.md, _workspace/02_auth_session.md를 읽고
spotcare.kr MVP Server Actions와 유틸리티를 구현하라.

산출물:
1. lib/supabase/client.ts, server.ts
2. lib/utils/floor.ts — floorToDisplay, generateFloorOptions
3. lib/validations/ — Zod 스키마
4. app/actions/workspace.ts, facility-type.ts, facility.ts
5. _workspace/03_backend_api.md — Server Action 시그니처, 반환 타입 목록

이전 산출물이 있으면 먼저 읽고 개선을 반영한다.
```

---

## Phase 4: UI (ui-engineer)

**에이전트:** `ui-engineer` (model: opus)

**선행 조건:** `_workspace/03_backend_api.md` 존재 확인

**프롬프트 구성:**
```
facility-ui 스킬과 _workspace/03_backend_api.md를 읽고
spotcare.kr MVP 어드민 UI를 구현하라.

산출물:
1. app/(auth)/login/page.tsx, signup/page.tsx
2. app/dashboard/layout.tsx (사이드바 네비게이션)
3. app/dashboard/workspaces/page.tsx (목록 + 생성 Dialog)
4. app/dashboard/[workspaceId]/facility-types/page.tsx (CRUD)
5. app/dashboard/[workspaceId]/facilities/page.tsx (Table + Form)
6. _workspace/04_ui_components.md — 주요 컴포넌트 경로 요약

이전 산출물이 있으면 먼저 읽고 개선을 반영한다.
```

---

## Phase 5: QA (qa-engineer)

**에이전트:** `qa-engineer` (model: opus)

**선행 조건:** 모든 `_workspace/*.md` 존재 확인

**프롬프트 구성:**
```
_workspace/ 내 모든 산출물 요약을 읽고 실제 생성된 소스 파일들을 교차 검증하라.

검증 항목:
1. 데이터 격리: Server Action의 tenant_id 필터 + RLS 정책 교차 확인
2. 층수 변환: floorToDisplay/generateFloorOptions 엣지케이스 (0층, 경계값)
3. 인증 흐름: middleware.ts의 보호 경로 설정 검증
4. 경계면: Server Action 반환 타입 vs UI 컴포넌트 사용 타입 일치 여부

산출물: _workspace/05_qa_report.md (심각도별 이슈 목록)

이전 QA 리포트가 있으면 기존 이슈 수정 여부도 함께 확인한다.
```

---

## Phase 6: 결과 보고

모든 에이전트 실행 완료 후 사용자에게 요약 보고:
- 생성된 파일 목록 (Phase별)
- QA 리포트 핵심 요약 (`_workspace/05_qa_report.md` 읽기)
- Critical 이슈가 있으면 수정 방향 제시
- 다음 단계 제안 (Next.js 프로젝트 초기화, 패키지 설치 명령 등)

---

## 에러 핸들링

| 상황 | 처리 방법 |
|------|----------|
| 에이전트 실패 | 1회 재시도 후 실패 내용을 보고서에 기록하고 다음 Phase 진행 |
| 선행 파일 없음 | 해당 Phase 건너뛰고 사용자에게 알림 |
| Critical QA 이슈 | QA 리포트에 명시 후 사용자에게 수정 권고 |

---

## 테스트 시나리오

### 정상 흐름
1. 사용자: "STEP_1.md 기반으로 MVP 구현 시작해줘"
2. Phase 0: `_workspace/` 없음 → 초기 실행
3. Phase 1~5 순차 실행
4. Phase 6: 결과 보고

### 부분 재실행
1. 사용자: "층수 변환 로직 수정해줘"
2. Phase 0: `_workspace/` 있음 → 부분 재실행 판단
3. backend-engineer만 재실행 (facility-backend 스킬 참조)
4. qa-engineer 재실행 (변경 영향 검증)

### 에러 흐름
1. auth-engineer 실패 → 재시도 1회
2. 재실패 시 `_workspace/02_auth_session.md`에 이슈 기록
3. backend-engineer 실행 시 이슈 파일 인지 후 대안 접근
