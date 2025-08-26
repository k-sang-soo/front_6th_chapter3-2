# Technical Constraints and Integration Requirements

## Existing Technology Stack

**Languages**: TypeScript, JavaScript (ES6+)
**Frameworks**: React 18+, Vite (SWC plugin)
**Database**: JSON 파일 기반 저장소 (realEvents.json)
**Infrastructure**: Express.js 개발 서버 (server.js), pnpm 패키지 관리
**External Dependencies**: MSW (테스트 모킹), Vitest (테스트 프레임워크), ESLint + TypeScript (코드 품질)

## Integration Approach

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

## Code Organization and Standards

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

## Deployment and Operations

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

## Risk Assessment and Mitigation

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
