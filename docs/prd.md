# 반복 일정 관리 시스템 Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Enhancement Complexity Assessment
이 PRD는 **반복 일정 관리 시스템**이라는 상당한 규모의 기능 추가를 위한 것입니다. 프로젝트 브리프 분석 결과:
- **5개 필수 요구사항**으로 구성된 복합 기능
- **TDD 방식**으로 개발하는 학습 중심 프로젝트  
- **아키텍처 확장** 필요 (Event 타입, 커스텀 훅들)
- **3개 스토리**로 구성될 예정

→ **풀 PRD 프로세스가 적절**합니다.

### Existing Project Overview

**Analysis Source**: 프로젝트 브리프 (docs/brief.md) + IDE 기반 분석

**Current Project State**:
- **목적**: React 기반 캘린더 애플리케이션 (기본 이벤트 CRUD 기능)
- **핵심 기능**: 이벤트 생성/수정/삭제, 월/주 뷰 전환, 검색, 알림
- **개발 철학**: TDD를 통한 학습과 품질 확보에 중점

### Available Documentation Analysis

**Available Documentation**:
- ✅ Tech Stack Documentation (프로젝트 브리프 + CLAUDE.md)
- ✅ Source Tree/Architecture (CLAUDE.md의 아키텍처 섹션)  
- ✅ Coding Standards (CLAUDE.md의 코딩 스타일 가이드)
- ✅ API Documentation (server.js, 기본 CRUD API)
- ❌ UX/UI Guidelines (현재 없음)
- ❌ Technical Debt Documentation (현재 없음)

### Enhancement Scope Definition

**Enhancement Type**: ✅ **New Feature Addition**

**Enhancement Description**: 
기존 캘린더 애플리케이션에 매일/매주/매월/매년 반복 일정 기능을 TDD 방식으로 추가. 클라이언트 사이드에서 복잡한 반복 로직을 처리하며, 기존 시스템과의 호환성을 유지하면서 5개 필수 요구사항을 구현.

**Impact Assessment**: ✅ **Moderate Impact** (기존 Event 타입 확장, 커스텀 훅 수정, UI 컴포넌트 추가)

### Goals and Background Context

**Goals**:
- 사용자가 반복 일정을 직관적으로 생성하고 관리할 수 있는 시스템 구축
- TDD 방식을 통한 안정적이고 테스트 가능한 코드 작성
- 복잡한 날짜 계산 로직의 엣지 케이스 완전 처리 (스킵 방식)
- 기존 캘린더 기능과의 완벽한 호환성 보장
- 개발자의 테스트 주도 개발 역량 향상

**Background Context**:
서버팀이 반복 일정 로직을 구현하지 않고 기본 CRUD API만 제공한 상황에서, 프론트엔드에서 모든 반복 로직을 처리해야 하는 도전적인 프로젝트입니다. 이는 실제 개발 환경에서 자주 발생하는 상황으로, TDD 방식을 통해 복잡한 비즈니스 로직을 안전하게 구현하는 경험을 제공합니다.

**Change Log**:
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-01-XX | 1.0 | 반복 일정 기능 초기 기획 | PM (John) |

## Requirements

### Functional Requirements

1. **FR1**: 사용자는 이벤트 생성 시 반복 유형(매일/매주/매월/매년)을 선택할 수 있어야 함
2. **FR2**: 시스템은 반복 종료 조건을 2025-10-30까지로 제한하여 설정할 수 있어야 함  
3. **FR3**: 캘린더 뷰에서 반복 일정은 시각적 아이콘으로 구분되어 표시되어야 함
4. **FR4**: 사용자는 반복 일정 중 특정 일정을 개별적으로 수정할 수 있어야 하며, 수정 시 해당 일정은 반복에서 제외되어야 함
5. **FR5**: 사용자는 반복 일정 중 특정 일정을 개별적으로 삭제할 수 있어야 하며, 나머지 반복 일정은 유지되어야 함
6. **FR6**: 시스템은 31일 매월 반복, 윤년 29일 매년 반복 시 해당 날짜가 없는 달/년에는 이벤트를 생성하지 않아야 함 (스킵 처리)

### Non Functional Requirements

1. **NFR1**: 반복 일정 생성 시 기존 이벤트 CRUD 기능의 성능에 영향을 주지 않아야 함 (응답시간 10% 이내 증가)
2. **NFR2**: 모든 반복 일정 관련 기능은 90% 이상의 테스트 커버리지를 유지해야 함
3. **NFR3**: 반복 일정 데이터는 기존 Event 구조와 호환되어야 하며, 기존 일정들이 정상 동작해야 함
4. **NFR4**: 반복 일정 생성/수정/삭제 작업은 원자적으로 처리되어 데이터 일관성을 보장해야 함
5. **NFR5**: UI 컴포넌트는 기존 캘린더 디자인 패턴을 따라야 하며 접근성 기준을 준수해야 함

### Compatibility Requirements

1. **CR1**: 기존 `/api/events` API 구조를 변경하지 않고 확장만 허용 (repeat 정보는 클라이언트에서 처리)
2. **CR2**: Event 타입의 기존 필드들은 그대로 유지하고 `repeat` 필드는 optional로 추가
3. **CR3**: 기존 캘린더 UI의 레이아웃과 스타일 가이드를 그대로 유지
4. **CR4**: 현재 커스텀 훅들(useEventOperations, useEventForm 등)의 기존 인터페이스 호환성 유지

## User Interface Enhancement Goals

### Integration with Existing UI

**기존 UI 패턴 활용**:
- **EventForm 확장**: 기존 이벤트 생성 폼에 반복 설정 섹션을 추가하되, 현재의 폼 레이아웃과 스타일을 유지
- **캘린더 그리드 시스템**: 현재 월/주 뷰의 그리드 구조를 그대로 사용하고 반복 아이콘만 추가
- **기존 컴포넌트 재사용**: 현재 사용 중인 버튼, 입력 필드, 드롭다운 스타일을 반복 설정에도 동일하게 적용
- **색상 시스템**: 기존 카테고리별 색상 체계를 유지하면서 반복 아이콘용 색상만 추가 정의

**스타일 가이드라인 준수**:
- CLAUDE.md의 **디자인 보존 정책** 엄격 준수
- 기존 CSS 클래스명과 스타일링 완전 유지
- 새 UI 요소는 기존 패턴에서 확장만 수행

### Modified/New Screens and Views

**수정될 화면들**:
1. **이벤트 생성/편집 폼** - 반복 설정 섹션 추가 (토글 방식으로 숨김/표시)
2. **캘린더 월 뷰** - 반복 일정 시각적 아이콘 표시  
3. **캘린더 주 뷰** - 반복 일정 시각적 아이콘 표시
4. **이벤트 상세 팝업/모달** - 반복 정보 표시 영역 추가

**새로 추가될 UI 요소들**:
- **반복 설정 토글 스위치** (EventForm 내)
- **반복 유형 선택 드롭다운** (매일/매주/매월/매년)
- **반복 종료 날짜 선택기** (최대 2025-10-30)
- **반복 일정 아이콘** (캘린더 뷰용 - 🔄)

### UI Consistency Requirements

**시각적 일관성**:
- 반복 설정 UI는 기존 이벤트 폼의 디자인 언어와 동일한 스타일 적용
- 반복 아이콘은 기존 UI의 아이콘 크기, 색상, 위치 규칙을 따름
- 새로운 입력 요소들은 기존 폼 요소들과 동일한 간격과 정렬 사용

**상호작용 일관성**:
- 반복 설정 토글 시 기존 폼의 애니메이션 패턴 유지
- 반복 일정 수정/삭제 시 기존 이벤트 조작과 동일한 UX 플로우 적용
- 오류 메시지와 검증 피드백은 기존 시스템의 스타일과 위치 규칙 준수

**접근성 일관성**:
- 반복 관련 모든 UI 요소는 기존 시스템의 키보드 네비게이션 패턴 따름
- 스크린 리더 지원을 위한 ARIA 라벨링은 기존 방식과 일관성 유지
- 색상에만 의존하지 않는 시각적 구분 (기존 원칙 유지)

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, JavaScript (ES6+)
**Frameworks**: React 18+, Vite (SWC plugin)
**Database**: JSON 파일 기반 저장소 (realEvents.json)
**Infrastructure**: Express.js 개발 서버 (server.js), pnpm 패키지 관리
**External Dependencies**: MSW (테스트 모킹), Vitest (테스트 프레임워크), ESLint + TypeScript (코드 품질)

### Integration Approach

**Database Integration Strategy**: 
- JSON 파일 구조 확장하여 Event 타입에 `repeat` 필드 추가
- 반복 일정들은 개별 이벤트로 저장되되 `repeat.id`로 그룹핑
- 기존 CRUD API (`/api/events`) 활용, 배치 처리용 `/api/events-list` 추가 활용

**API Integration Strategy**:
- 서버 측 변경 최소화: 기존 Express.js 라우트 유지
- 클라이언트에서 반복 로직 처리 후 개별 이벤트로 API 호출
- MSW 핸들러 확장하여 테스트 환경에서 반복 일정 지원

**Frontend Integration Strategy**:
- 기존 커스텀 훅 아키텍처 확장 (useEventOperations, useEventForm)
- **UI 컴포넌트 분리 허용**: 반복 기능의 복잡성과 TDD 개발 효율성을 위해 컴포넌트 분리 가능
  - EventForm, CalendarGrid, EventList, RepeatEventDialog 등으로 분리 가능
  - 기존 단일 App 컴포넌트 구조도 계속 지원
- 새로운 커스텀 훅 추가 (useRepeatLogic - 복잡한 반복 날짜 계산 로직)
- 유틸리티 함수 추가 (src/utils/repeatUtils.ts, src/utils/dateCalculations.ts)

**Testing Integration Strategy**:
- 기존 MSW + Vitest 환경 활용
- 날짜 계산 로직에 대한 광범위한 단위 테스트
- TDD 사이클 준수: Red-Green-Refactor

### Code Organization and Standards

**File Structure Approach**:
```
src/
  hooks/ - useEventOperations 확장, useRepeatLogic 추가
  utils/ - repeatUtils.ts, dateCalculations.ts 추가  
  types.ts - Event 타입에 repeat 필드 추가
  __tests__/ - 반복 로직 테스트 파일들 추가
```

**Naming Conventions**: CLAUDE.md의 네이밍 컨벤션 엄격 준수
- 폴더명: kebab-case 복수형
- 컴포넌트/타입: PascalCase  
- 함수/변수: camelCase
- 상수: SCREAMING_SNAKE_CASE

**Coding Standards**: 
- 화살표 함수 우선 사용
- ES6+ 기능 적극 활용 (구조분해, 전개연산자, 옵셔널체이닝)
- 타입스크립트 엄격 모드, 매개변수 명시적 타이핑
- 함수형 프로그래밍 패턴 선호

**Documentation Standards**: 
- 복잡한 날짜 계산 로직에 대한 JSDoc 주석
- README.md의 개발 명령어 섹션 업데이트
- TDD 프로세스 문서화

### Deployment and Operations

**Build Process Integration**: 
- 기존 Vite 빌드 프로세스 유지, 타입 체크 통과 필수
- `pnpm build` 명령어로 동일하게 빌드 가능

**Deployment Strategy**: 
- 기존 개발 환경 (`pnpm dev`) 그대로 사용
- API 서버와 Vite 개발 서버 동시 실행 유지

**Monitoring and Logging**: 
- 개발 환경 특성상 콘솔 로깅으로 디버깅
- 복잡한 반복 계산 과정에 대한 로깅 추가

**Configuration Management**: 
- 반복 일정 관련 상수들을 별도 config 파일로 관리
- 날짜 제한 등의 설정값 중앙화

### Risk Assessment and Mitigation

**Technical Risks**:
- 복잡한 날짜 계산으로 인한 엣지 케이스 버그 (윤년, 월말일 처리)
- 대량 반복 일정 생성 시 브라우저 성능 저하
- 기존 이벤트 데이터와의 호환성 문제

**Integration Risks**:
- 기존 커스텀 훅들의 상태 관리 복잡도 증가
- MSW 모킹 환경과 실제 API 동작 간 불일치
- Event 타입 확장으로 인한 기존 코드 영향

**Deployment Risks**:
- TDD 방식으로 인한 개발 일정 지연 가능성
- 테스트 커버리지 목표 (90%) 달성의 어려움

**Mitigation Strategies**:
- **TDD 엄격 준수**: 모든 엣지 케이스를 테스트로 먼저 정의
- **점진적 구현**: 필수 요구사항부터 단계별 구현
- **호환성 보장**: `repeat` 필드를 optional로 유지
- **성능 모니터링**: 반복 일정 생성 시 성능 측정 및 최적화
- **롤백 계획**: 기능별로 독립적 롤백 가능한 구조 설계

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: **단일 종합 Epic 접근법** - 반복 일정 기능의 모든 구성 요소들(Event 타입 확장, UI 통합, 복잡한 날짜 로직)이 상호 의존적이고 기존 캘린더 시스템과 통합되어야 하므로 분할하지 않고 하나의 Epic으로 관리하여 **기능 일관성과 통합 테스트 용이성을 보장**

### Epic 1: 반복 일정 관리 시스템

**Epic Goal**: 기존 캘린더 애플리케이션에 TDD 방식으로 반복 일정 기능을 추가하여, 사용자가 매일/매주/매월/매년 반복되는 일정을 효율적으로 관리할 수 있도록 하되, **31일 매월 반복, 윤년 29일 매년 반복 등 해당 날짜가 없는 경우 이벤트 생성을 스킵**한다.

**Integration Requirements**: 
- Event 타입 `repeat` 필드 확장 시 기존 이벤트 데이터 100% 호환성 보장
- useEventOperations 등 커스텀 훅 확장 시 기존 CRUD 성능 저하 10% 미만 유지  
- MSW 테스트 환경에서 모든 반복 시나리오 재현 가능하도록 핸들러 확장

#### Story 1.1: 반복 일정 기본 설정 및 생성

**의존성**: 없음 (시작점)
**후속 스토리에 제공**: Event 타입 확장, 반복 로직, 데이터 구조

As a 캘린더 사용자,
I want 이벤트 생성 시 반복 유형과 종료 조건을 설정할 수 있다,
so that 반복되는 일정을 매번 개별로 생성하지 않고 한 번에 관리할 수 있다.

**Acceptance Criteria**:
1. EventForm에 반복 설정 토글 스위치 추가 (기존 폼 레이아웃 유지)
2. 반복 유형 선택: 매일/매주/매월/매년 드롭다운
3. 반복 종료 날짜: 2025-10-30까지 제한된 날짜 선택기
4. **엣지 케이스 처리 (스킵 방식)**:
   - 31일 매월 반복: 31일이 없는 달에는 해당 월 이벤트 생성 스킵
   - 윤년 2월 29일 매년 반복: 평년에는 해당 연도 이벤트 생성 스킵
   - 날짜 유효성 검증: `isActualDateExists()` 함수로 실제 날짜 존재 여부 체크
5. 반복 일정들은 `repeat.id` UUID로 그룹핑하여 JSON 저장

**Integration Verification**:
- IV1: 기존 단일 이벤트 생성 응답시간 증가 10% 미만 확인
- IV2: 기존 Event 타입 사용 코드 컴파일 에러 0개 확인  
- IV3: useEventOperations 기존 인터페이스 100% 호환성 확인

#### Story 1.2: 반복 일정 시각적 구분 및 캘린더 통합

**의존성**: Story 1.1 (`repeat.id` 필드 존재 필요)
**후속 스토리에 제공**: 반복 일정 식별 UI, 사용자 인터랙션 기반

As a 캘린더 사용자,
I want 캘린더 뷰에서 반복 일정을 시각적으로 구분할 수 있다,
so that 어떤 일정이 반복 일정인지 한눈에 파악할 수 있다.

**Acceptance Criteria**:
1. 반복 일정 아이콘: 🔄 (우측 상단, 12px, opacity 0.7)
2. 월 뷰/주 뷰 일관된 아이콘 표시 위치와 크기
3. **반복 정보 표시 (스킵 정보 포함)**:
   - 기본: "매월 반복, 2025-10-30까지"
   - 스킵 있는 경우: "31일 매월 반복 (일부 월 제외), 2025-10-30까지"
   - 스킵 개수: "총 12개월 중 7개월에 생성됨"
4. 아이콘 색상: 중성 그레이 (#666) - 기존 카테고리 색상과 구분
5. 호버 시 반복 패턴별 툴팁: "매월 반복" 또는 "매월 반복 (31일 - 일부 월 제외)"

**Integration Verification**:  
- IV1: 기존 일반 이벤트 렌더링 성능 영향 5% 미만 확인
- IV2: 캘린더 그리드 레이아웃 왜곡 0건 확인
- IV3: 월/주 뷰 전환 시 아이콘 위치 일관성 100% 확인

#### Story 1.3: 반복 일정 개별 관리

**의존성**: Story 1.1 (반복 로직) + Story 1.2 (UI 식별)
**후속 스토리**: 없음 (완료)

As a 캘린더 사용자,
I want 반복 일정 중 특정 일정만 개별 수정/삭제할 수 있다,
so that 전체 반복을 해치지 않고 예외적인 상황을 처리할 수 있다.

**Acceptance Criteria**:
1. 반복 일정 수정 시 모달: "이 일정만 수정" vs "전체 반복 수정" 선택
2. 개별 수정: `repeat.id` 제거 + 독립 이벤트 전환 + 아이콘 제거
3. 반복 일정 삭제 시 모달 **스킵 정보 포함**: "전체 시리즈 12개 중 7개 일정이 삭제됩니다 (일부 월 제외로 5개는 존재하지 않음)"
4. 개별 삭제: 해당 이벤트만 제거, 나머지 반복 유지 (스킵된 날짜들도 스킵 상태 유지)
5. 데이터 일관성 보장: 모든 조작을 원자적 트랜잭션으로 처리

**Integration Verification**:
- IV1: 기존 일반 이벤트 수정/삭제 워크플로우 영향도 0% 확인
- IV2: 반복 일정 조작 후 useEventOperations 상태 일관성 100% 확인  
- IV3: MSW 테스트에서 모든 반복 시나리오 재현 가능성 확인