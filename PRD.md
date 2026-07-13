# checklog.kr — 시설 관리 시스템 PRD

> 멀티 고객(Multi-account) 시설 관리 플랫폼. 여러 업체가 독립적으로 건물·시설을 등록·관리하고, 방문자 민원을 접수·처리하며, 내부 운영진이 슈퍼어드민으로 전체를 관리한다.
>
> 이 문서는 Phase 1(고객 어드민) → Phase 2(슈퍼어드민) → Phase 3(민원 관리)의 단계별 기획안을 통합한 단일 제품 요구사항 정의서(PRD)이다.

---

## 1. 제품 개요

### 1.1 목적

여러 업체가 가입하여 독립적으로 건물과 시설 정보를 등록·관리할 수 있는 멀티 고객 시설 관리 어드민을 제공한다. 각 업체는 자신의 워크스페이스(건물/장소) 단위로 시설·점검표·점검자를 관리하고, 시설 방문자는 QR로 진입해 민원을 접수할 수 있으며, 서비스 운영진은 슈퍼어드민 포털로 전체 고객과 어드민 계정을 통합 관리한다.

### 1.2 핵심 아키텍처 원칙

- 하나의 업체(마스터 계정)는 여러 개의 워크스페이스(건물/장소)를 관리할 수 있다.
- 모든 데이터(시설 타입, 시설 정보, 점검자, 점검표 등)는 **워크스페이스 단위로 철저히 격리**되며, 타 워크스페이스나 타 업체에 공유·노출되지 않는다.
- 모든 테이블의 PK는 순수 랜덤 고유 ID(UUID)를 사용해 상호 유연성과 확장성을 보장한다.

### 1.3 사용자군 (3종)

| 사용자군 | 정의 | 진입점 | 인증 |
|---------|------|--------|------|
| **고객** | 시스템에 가입한 관리 업체의 마스터 계정 | 고객 어드민(`apps/app`) | 로그인 필요 |
| **방문자** | 시설 QR을 스캔해 민원을 접수하는 일반 방문객 | 고객 어드민의 `/inspect/[facilityId]` | 비로그인(공개) |
| **슈퍼어드민** | checklog.kr 서비스를 운영·관리하는 내부 운영진 | 슈퍼어드민(`apps/admin`) | 로그인 필요 |

### 1.4 앱 구성 (모노레포, 2개 배포 앱)

| 앱 | 명칭 | 대상 사용자군 | 역할 |
|----|------|-------------|------|
| `apps/app` | **고객 어드민** | 고객 · 방문자 | 워크스페이스·시설·점검표·점검자 관리 + 방문자 민원 접수/확인 |
| `apps/admin` | **슈퍼어드민** | 슈퍼어드민 | 어드민 계정·고객 통합 관리 |
| `apps/web` | (공개 페이지) | — | 랜딩/공개 페이지 |

**공유 패키지:** `@checklog/database`(타입/클라이언트), `@checklog/ui`(shadcn 컴포넌트)

---

## 2. 기술 스택

- **Framework:** Next.js (App Router 기반 풀스택)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Auth.js v5 (구 NextAuth.js, Credentials Provider)
- **Styling:** Tailwind CSS (유틸리티 퍼스트)
- **UI Components:** shadcn/ui (Radix Primitives 기반)
- **상태 관리:** React Query (TanStack Query) + nuqs (URL 상태)
- **파일 저장:** Supabase Storage (점검 사진, 민원 첨부 사진)

---

## 3. 도메인 및 데이터 모델

### 3.1 계정 및 인증 (Account / Auth)

#### 고객 회원가입 (`apps/app`)

시스템을 사용하는 관리 업체의 마스터 계정을 생성한다.

- **기본 정보:** 업체명(회사명), 관리자 이름, 전화번호, 이메일, 비밀번호
- **전화번호 입력 규칙:** 숫자 입력 시 자동 하이픈 삽입. 서울 지역번호(`02-XXXX-XXXX`)와 그 외(`0XX-XXXX-XXXX`) 형식 구분 적용. 내부 저장은 하이픈 없는 숫자만(`01012345678`).
- **인증 인프라:** Auth.js를 이용한 로그인 세션 관리 및 보안 적용.

#### 슈퍼어드민 계정 (`apps/admin`)

```sql
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- **회원가입 없음** — 어드민 계정은 슈퍼어드민이 내부에서 직접 생성한다.
- 초기 계정: 이메일 `admin@checklog.kr` / 비밀번호 `1q2w#E$R` / 이름 `관리자` (bcrypt 해싱 저장)
- 신규 어드민 생성 시 임시 비밀번호: `12341234` (bcrypt 해싱 후 저장)
- 세션 JWT에 `adminId` 포함.

### 3.2 워크스페이스 (Workspace)

업체가 관리하는 독립적인 '건물' 또는 '장소'의 단위 (예: 샘플타워).

- `workspace_name` (VARCHAR): 워크스페이스 이름
- `max_floor` (INT): 지상 최고 층수 (지상 10층 → `10`, 지상 층 없으면 `0`)
- `min_floor` (INT): 지하 최저 층수 (지하 2층 → `-2`, 지하 층 없으면 `0`)

**층수 데이터 처리 및 치환 규칙 (중요):**
- DB 용량 최적화 및 정렬을 위해 층수는 내부적으로 **정수(Integer)**로만 관리한다.
- 프론트엔드 노출 시에만 아래 규칙으로 문자열 치환하여 드롭다운을 자동 생성한다.
  - 양수(`3`) ➡️ 뒤에 'F' 결합 (`3F`)
  - 음수(`-1`) ➡️ '-'를 'B'로 치환 (`B1`)
  - 예시: `max_floor: 3`, `min_floor: -1` → `['3F', '2F', '1F', 'B1']`

### 3.3 시설 타입 (Facility Type)

관리자가 해당 워크스페이스 내에서 사용할 공간 카테고리 메뉴 (예: 화장실, 회의실, 관리사무소, 헬스장).

- **필수 매핑:** `워크스페이스 ID`와 FK 연결.

### 3.4 시설 정보 (Facility Info)

실제 관리 대상이 되는 공간의 구체적 정보.

- **필수 매핑:** `워크스페이스 ID` + `시설 타입 ID` FK 연결.
- **보유 필드:**
  - **시설명:** 프리 텍스트. 현장 별칭/세부 구분 자유 입력 (예: 타투인(대회의실), 3층 남자 화장실, 방제센터).
  - **층 수 (INT):** 워크스페이스 범위 내 선택 층수의 정수 값 (3층 → `3`, 지하 1층 → `-1`).
  - **시설 타입:** 기등록 타입 중 선택.
  - **위치 설명:** (예: 엘리베이터 좌측 복도 끝, 탕비실 안쪽).
  - **비고:** 특이사항 기록.

**💥 데이터 격리 조건:** A 워크스페이스의 시설 타입·층수 범위·시설 정보는 B 워크스페이스에 절대 노출·공유되지 않는다.

### 3.5 점검자 (Inspector)

시설 점검을 수행하는 담당자. 워크스페이스 단위로 관리되며, 동일 고객이라도 워크스페이스별 목록이 독립 구성된다.

- **필수 매핑:** `워크스페이스 ID` + `고객 ID` 이중 FK.
- **보유 필드:**
  - `name` (VARCHAR 100): 이름 (필수)
  - `phone` (VARCHAR 11): 전화번호, 숫자만 저장 (필수). 화면 출력 시 하이픈 포맷.
  - `email` (VARCHAR 255): 이메일 (선택)
- **데이터 격리:** 워크스페이스 레벨 RLS (account_id + workspace_id 이중 필터).

### 3.6 점검표 (Checklist)

시설 점검 시 사용하는 체크리스트 템플릿. 워크스페이스 단위 관리.

- **필수 매핑:** `워크스페이스 ID` + `고객 ID` 이중 FK.
- **보유 필드:**
  - `checklist_name` (VARCHAR 255): 점검표명 (필수)
  - `description` (TEXT): 설명 (선택)
  - `repeat_cycle` (ENUM): `daily`(매일) / `weekly`(매주) / `monthly`(매월)
  - `count` (INT): 주기당 점검 횟수 (최소 1)
  - `days` (INT[]): 요일 배열 (0=일~6=토). `repeat_cycle = 'weekly'`일 때만 사용.

### 3.7 점검 항목 (Checklist Item)

점검표를 구성하는 개별 항목. 점검표에 종속(CASCADE 삭제).

- **필수 매핑:** `checklist_id` FK.
- **보유 필드:**
  - `item_name` (VARCHAR 255): 항목명 (필수)
  - `response_type` (ENUM): 응답 방식 — 현재 `checklist`만 지원
  - `is_required` (BOOLEAN): 필수 응답 여부. 기본값 `FALSE`.
  - `sort_order` (INT): 표시 순서 (0부터, 등록 순서대로 자동 부여)
- **UI 정책:** 항목 추가/삭제는 점검표 폼 내 인라인 처리. 저장 시 기존 항목 전체 삭제 후 재삽입(MVP 단순화).

### 3.8 시설-점검표 연결 (Facility Checklist)

시설(Facility)과 점검표(Checklist)의 M:N 관계.

- **연결 테이블:** `facility_checklists`
  - `facility_id` FK → `facilities(id)` CASCADE
  - `checklist_id` FK → `checklists(id)` CASCADE
  - `workspace_id`, `account_id`: 데이터 격리 보장용
  - UNIQUE `(facility_id, checklist_id)`: 중복 연결 방지
- **저장 정책:** 시설 등록/수정 시 점검표 연결 목록 전체 교체(삭제 후 재삽입).

### 3.9 민원 (Complaint)

시설 방문자가 QR로 진입해 로그인 없이 제출하는 불편 사항·의견.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `facility_id` | UUID FK | facilities.id |
| `workspace_id` | UUID FK | workspaces.id (격리 키 이중화) |
| `account_id` | UUID FK | accounts.id (격리 키) |
| `complaint_type` | VARCHAR(100) | 민원 유형 문자열 (고정값 또는 직접입력 텍스트) |
| `content` | TEXT NOT NULL | 민원 내용 (필수) |
| `photo_urls` | TEXT[] | 첨부 사진 URL 배열 (기본값 `{}`) |
| `status` | ENUM | `received`(접수) / `in_progress`(처리중) / `resolved`(완료) |
| `created_at` | TIMESTAMPTZ | 접수 시각 |
| `resolved_at` | TIMESTAMPTZ NULL | 처리 완료 시각 |
| `deleted_at` | TIMESTAMPTZ | 소프트 딜리트, NULL = 활성 |

> `complaint_type`을 ENUM이 아닌 VARCHAR로 저장하는 이유: "직접 입력" 선택 시 사용자가 타이핑한 임의 문자열을 그대로 저장해야 하기 때문. 유형값 유효성 검사는 앱 레이어(Server Action)에서 처리한다.

**민원 유형 고정값** — 관리자가 설정하지 않는 서비스 전체 고정값. 별도 DB 테이블 없이 앱 레이어 상수로 관리.

| 값 | 표시 라벨 |
|----|----------|
| `시설_고장` | 시설 고장 |
| `청소_요청` | 청소 요청 |
| `안전_문제` | 안전 문제 |
| `직접입력` | 직접 입력 |

**RLS:**
- `INSERT`: anon 역할 허용 (비로그인 방문자 제출)
- `SELECT`, `UPDATE`: 인증된 고객(`app_current_account_id()`)만 허용, `account_id` 격리

---

## 4. 기능 요구사항 — 고객 어드민 (`apps/app`)

### 4.1 워크스페이스 생성 및 층수 정의

- [워크스페이스 추가] 버튼 → Dialog(모달) 또는 전용 폼 활성화.
- '워크스페이스 이름' + '지상 층수(0~최대)' + '지하 층수(0~최대)'를 숫자 입력.
  - 화면 예시: "지상 [ 10 ] 층 / 지하 [ 2 ] 층"
  - 저장 시 지상은 `10`, 지하는 음수 `-2`로 계산되어 인서트.

### 4.2 시설 타입 관리 (독립 메뉴)

- 워크스페이스 대시보드 내 별도 메뉴로 분리.
- 공간 카테고리 추가/수정/삭제(CRUD).

### 4.3 시설 정보 등록 및 관리

- **등록:**
  - [시설 등록] 버튼 → 입력 폼 활성화.
  - **층 수·시설 타입 필드**는 백엔드 데이터를 읽어 치환 규칙(`3F`, `B1`) 적용 후 `Select` 드롭다운으로 노출 → 오입력 차단.
  - 입력 항목: 시설명(자유 입력), 층 수(선택), 시설 타입(선택), 위치 설명, 비고.
  - **점검표 연결 (선택):** 워크스페이스에 등록된 점검표를 체크박스로 복수 선택 가능. 선택하지 않아도 등록 가능.
  - **사전 조건 검사:** 등록 가능한 시설 타입이 없으면 [시설 등록] 버튼 비활성화 및 안내 메시지.
- **조회:**
  - `Table` + Tailwind 그리드로 웹/태블릿 최적화 표 출력.
  - 층수가 정수 저장되어 있어 **정렬·필터('3층 시설만 보기')를 SQL 쿼리만으로 지원**.
  - 연결된 점검표 수(N개) 표시.

### 4.4 점검자 관리

- **위치:** `/dashboard/[workspaceId]/inspectors`
- **기능:** 추가/수정/삭제(CRUD). 삭제 시 재확인 다이얼로그.
- **입력:** 이름(필수), 전화번호(필수 — 하이픈 자동 포맷), 이메일(선택).
- **전화번호 유효성:** 숫자만 최대 11자리. 화면은 하이픈 표시, 저장은 숫자만.
- **데이터 범위:** 현재 워크스페이스 소속 점검자만 조회/관리.

### 4.5 점검표 관리

- **위치:** `/dashboard/[workspaceId]/checklists`
- **기능:** 추가/수정/삭제(CRUD). 삭제 시 재확인 다이얼로그(하위 항목 CASCADE 삭제 안내).
- **입력:**
  - 점검표명(필수), 설명(선택)
  - 반복 주기: 매일/매주/매월
  - 횟수: 주기당 점검 횟수 (최소 1)
  - 요일: `반복 주기 = 매주`일 때만 표시 (일~토 체크박스)
  - 점검 항목: 항목명 + 응답 방식(체크리스트 고정) 행을 동적 추가/삭제. 최소 1개 필수.
- **항목 저장 방식:** 저장 시 기존 항목 전체 삭제 후 순서대로 재삽입(MVP 단순화).

### 4.6 시설별 민원 이력 확인

- **위치:** `/dashboard/[workspaceId]/facilities` (기존 시설 관리 페이지)
- 기존 `FacilityInspectionHistory`(점검이력 Sheet) 패턴으로 `FacilityComplaintHistory` 컴포넌트 추가.
- 시설 목록 각 행 액션 영역에 "민원이력" 버튼 → 클릭 시 Sheet 사이드바 열림.
- **Sheet 목록:** 접수일, 유형, 내용 미리보기, 상태 Badge.
- **Sheet 상세:** 전체 내용, 첨부 사진(라이트박스), 상태 변경(접수 → 처리중 → 완료).

---

## 5. 기능 요구사항 — 민원 접수 (방문자용, 비로그인)

방문자는 기존 QR 코드로 `/inspect/[facilityId]` 페이지에 진입한다. **별도 민원 전용 URL 없이**, 기존 점검 상태 페이지 하단에 민원 접수 진입점을 추가한다.

### 5.1 페이지 배치 (`/inspect/[facilityId]`)

```
[시설명 + 점검하기 버튼]
[점검 통계 (오늘/이번주/이번달)]
[마지막 점검]
[점검 항목 목록]
─────────────────────────  ← 구분선 추가
[민원 접수 버튼]            ← 신규 추가
```

### 5.2 접수 흐름

```
"민원 접수" 버튼 클릭
  └─ 민원 접수 모달(Dialog)
       ├─ ① 민원 유형 선택 (Select, 필수)
       ├─ ② 내용 입력 (Textarea, 필수)
       ├─ ③ 사진 첨부 (선택, 최대 3장)
       └─ ④ 접수 버튼 → 완료 안내 후 모달 닫힘
```

| 항목 | 필수 | 비고 |
|------|------|------|
| 민원 유형 | 필수 | 고정 4종 Select, 미선택 시 접수 불가 |
| 내용 | 필수 | Textarea, 빈 값 접수 불가 |
| 사진 | 선택 | 최대 3장, Supabase Storage 업로드 |

- **"직접 입력" 선택 시:** 유형명을 직접 작성하는 텍스트 필드가 노출된다. 이 필드도 빈 값이면 접수 불가.
- **접근 정책:** `/inspect/[facilityId]`는 비로그인 공개 접근 유지. 민원 접수는 기존 점검 흐름과 독립적으로 동작.

---

## 6. 기능 요구사항 — 슈퍼어드민 (`apps/admin`)

### 6.1 접근 권한 및 구조

- 슈퍼어드민 계정만 접근. 고객 회원가입 경로 없음.
- `apps/app`과 동일하게 사이드바 포함 Dashboard 레이아웃.

### 6.2 인증

- **로그인:** `/login` — Auth.js Credentials Provider + `admins` 테이블 검증. 회원가입 링크 없음. 성공 시 `/dashboard` 리다이렉트.
- **미들웨어:** `/dashboard/**` 전체 보호(미인증 시 `/login` 리다이렉트). `/login` 공개 허용.

### 6.3 라우트 구조

```
apps/admin/app/
├── (auth)/login/page.tsx          — 슈퍼어드민 로그인
└── dashboard/
    ├── layout.tsx                 — 사이드바 포함 레이아웃
    ├── page.tsx                   — 홈 (통계 카드)
    ├── admins/
    │   ├── page.tsx               — 어드민 목록
    │   ├── [adminId]/page.tsx     — 어드민 상세/수정
    │   └── password/page.tsx      — 내 비밀번호 변경
    └── accounts/
        ├── page.tsx               — 고객 목록
        └── [accountId]/page.tsx   — 고객 상세/수정
```

**사이드바 메뉴:**

| 메뉴 | 경로 | 아이콘 |
|------|------|--------|
| 대시보드 | `/dashboard` | LayoutDashboard |
| 어드민 관리 | `/dashboard/admins` | ShieldUser |
| 고객 관리 | `/dashboard/accounts` | Building2 |

### 6.4 어드민 관리

- **목록:** `Table`(이름, 이메일, 생성일, 액션). 페이지네이션 20건, `?page=` (nuqs). [어드민 추가] → Dialog 생성 폼.
- **생성:** 이름·이메일 입력. 임시 비밀번호 `12341234` 고정(서버 bcrypt 해싱). 생성 후 목록 자동 갱신(React Query invalidation).
- **수정:** `/dashboard/admins/[adminId]` — 이름·이메일 수정. 비밀번호는 이 페이지에서 수정 불가.
- **삭제:** `AlertDialog` 확인 후 삭제. 로그인 중인 본인 계정은 삭제 불가.
- **비밀번호 변경:** `/dashboard/admins/password` — 현재/새/새 확인 입력. 세션 `adminId` 기준 본인만 변경. 성공 시 로그아웃(재로그인 유도).

### 6.5 고객 관리

- **목록:** `Table`(업체명, 관리자명, 이메일, 전화번호, 가입일, 액션). 검색(업체명/이메일, `?search=`). 페이지네이션 20건, `?page=` (nuqs).
- **상세:** `/dashboard/accounts/[accountId]` — 기본 정보 표시, 수정 가능 필드(업체명·관리자명·전화번호). 하단에 워크스페이스 목록(이름·지상/지하 층수·생성일) 읽기 전용.
- **삭제:** `AlertDialog` 확인 후 삭제. 연관 워크스페이스·시설 타입·시설 정보 CASCADE 삭제.

### 6.6 대시보드 홈

- 운영 통계 카드 3종(`Card` 3열 그리드):
  - 총 어드민 수 (admins count)
  - 총 고객 수 (accounts count)
  - 총 시설 수 (facilities count)
- (추후) 총 민원 수 카드 추가 고려.

### 6.7 데이터 접근 규칙

- **슈퍼어드민 전체 접근:** `account_id` 필터 없음 — 모든 고객 데이터 접근.
- **비밀번호 노출 금지:** `password_hash`는 mapper에서 반드시 제외.
- **모든 Server Action:** `requireAdmin()` 헬퍼로 세션 검증 후 실행.

---

## 7. 코딩 컨벤션 (필수)

### 7.1 소프트 딜리트

삭제 기능이 있는 모든 엔티티는 하드 딜리트(`.delete()`) 대신 소프트 딜리트를 사용한다.

- 새 엔티티 테이블 생성 시 `deleted_at TIMESTAMPTZ` 컬럼 필수 포함.
- 삭제 = `.update({ deleted_at: new Date().toISOString() })`
- 조회 = 모든 SELECT에 `.is('deleted_at', null)` 필터 필수
- 수정 = `.update(...).is('deleted_at', null)` — 삭제된 레코드 수정 차단
- 부모 삭제 시 자식도 코드에서 cascade soft delete (DB CASCADE는 하드 딜리트 전용이므로 사용 불가)
- 예외: 조인 테이블(`facility_checklists` 등)은 독립 가치 없으므로 하드 딜리트 유지
- **TypeScript 타입:** 새 엔티티의 Row·Insert 타입 모두에 `deleted_at?: string | null` 추가

```sql
ALTER TABLE new_table ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_new_table_active ON new_table (account_id) WHERE deleted_at IS NULL;
```

### 7.2 폼 다이얼로그

입력 폼이 포함된 Dialog는 반드시 `FormDialogContent`를 사용한다.

- `@checklog/ui/components/dialog`의 `DialogContent` 직접 사용 금지(폼 다이얼로그에 한함).
- `@/components/form-dialog`의 `FormDialogContent`를 import해 사용.
- `FormDialogContent`는 바깥 영역 클릭 시 닫힘을 기본 차단한다(입력 데이터 보호).
- 조회/확인용 다이얼로그(QR 코드, 삭제 확인 등)는 기존 `DialogContent` 그대로 사용.

```tsx
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormDialogContent as DialogContent,
} from '@/components/form-dialog'
```

---

## 8. 비기능 요구사항 및 데이터 접근 정책

- **데이터 격리:** 워크스페이스 레벨 RLS를 기본으로 하며, 격리가 필요한 테이블은 `account_id` + `workspace_id` 이중 필터를 적용한다.
- **민원 접수 보안:** `complaints`는 `INSERT`만 anon 허용, `SELECT`/`UPDATE`는 인증 고객(`account_id` 격리)만 허용.
- **비밀번호 보안:** 모든 비밀번호는 bcrypt 해싱 저장. `password_hash`는 응답 mapper에서 제외.
- **전화번호 저장 정책:** 화면은 하이픈 포함 표시, 저장은 숫자만.
- **첨부 사진:** Supabase Storage 사용(점검 사진과 동일 버킷 정책). 민원 첨부 최대 3장.

---

## 부록 A. 개발 단계(Phase) 이력

이 PRD는 아래 세 단계 기획안을 통합한 것이다.

| Phase | 범위 | 대상 앱 |
|-------|------|---------|
| Phase 1 | 시설 관리 어드민 MVP (워크스페이스·시설 타입·시설·점검자·점검표) | `apps/app` |
| Phase 2 | 슈퍼어드민 포털 (어드민·고객 통합 관리) | `apps/admin` |
| Phase 3 | 민원 관리 (방문자 접수 + 시설별 이력 확인) | `apps/app` |
