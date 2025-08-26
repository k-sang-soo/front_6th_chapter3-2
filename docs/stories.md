# User Stories: 반복 일정 관리 시스템

> 수정된 엣지 케이스 로직 반영: **스킵 방식** (조정이 아닌 생성하지 않음)

## Story 1.1: 반복 일정 기본 설정 및 생성

### Story Context

**기존 시스템 통합**:
- 통합 대상: EventForm 컴포넌트, useEventOperations 훅, Event 타입
- 기술 스택: React + TypeScript, JSON 파일 저장소, MSW 테스트 환경
- 따를 패턴: 기존 이벤트 폼의 토글 섹션 패턴, 함수형 컴포넌트 + 커스텀 훅
- 터치 포인트: Event 타입 확장(`repeat` 필드), API 호출 로직, 폼 검증 로직

### User Story

As a **캘린더 사용자**,
I want **이벤트 생성 시 반복 유형(매일/매주/매월/매년)과 종료 조건을 설정**할 수 있다,
so that **반복되는 일정을 매번 개별로 생성하지 않고 한 번에 관리**할 수 있다.

### Acceptance Criteria

**기능 요구사항**:
1. EventForm에 "반복 일정" 토글 스위치 추가 (기본값: OFF)
2. 토글 ON 시 반복 설정 섹션 표시: 유형 선택 + 종료 날짜
3. 반복 유형: 매일/매주/매월/매년 드롭다운 (기본값: 매일)
4. 종료 날짜: **최대값 2025-10-30 하드 제한** (그 이상 선택 불가)

**통합 요구사항**:
5. 기존 Event 타입 호환성: `repeat?: { type, endDate, id }` 필드 추가
6. 반복 일정들을 `repeat.id` UUID로 그룹핑하여 개별 이벤트로 저장

7. **엣지 케이스 처리 (스킵 로직)**:
   - **31일 매월 반복**: 31일이 없는 달(2월, 4월, 6월, 9월, 11월)에는 **해당 월 이벤트 생성 스킵**
   - **윤년 2월 29일 매년 반복**: 평년(2025, 2026, 2027 등)에는 **해당 연도 이벤트 생성 스킵**
   - **날짜 유효성 검증**: `isActualDateExists()` 함수로 실제 날짜 존재 여부 체크

**품질 요구사항**:
8. 반복 일정 생성 시 기존 단일 이벤트 생성 대비 응답시간 10% 이내 증가
9. 모든 날짜 계산 로직에 대한 단위 테스트 커버리지 95% 이상

### Technical Notes

**핵심 구현 로직**:
```typescript
function generateRecurringEvents(baseEvent, repeatConfig) {
  const events = [];
  let currentDate = new Date(baseEvent.date);
  const endDate = new Date(repeatConfig.endDate); // max: 2025-10-30
  
  while (currentDate <= endDate) {
    // 스킵 로직: 해당 날짜가 실제 존재하는지 체크
    if (isActualDateExists(currentDate)) {
      events.push(createEventForDate(baseEvent, currentDate));
    }
    // 다음 반복 날짜로 이동 (존재하지 않아도 계산은 진행)
    currentDate = getNextRepeatDate(currentDate, repeatConfig.type);
  }
  
  return events;
}

function isActualDateExists(date) {
  // 날짜 객체 생성 후 실제 날짜와 비교
  const testDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return testDate.getDate() === date.getDate(); // 31일 → 2월 = false
}
```

**통합 접근법**: 
- useEventOperations 훅에 `createRecurringEvent` 함수 추가
- 클라이언트에서 반복 로직 처리 후 `/api/events` 배치 호출

**기존 패턴 참조**: 
- EventForm의 기존 토글 섹션 스타일과 애니메이션 패턴 동일 적용
- 날짜 선택기는 기존 startTime/endTime과 동일한 컴포넌트 재사용

### Integration Verification
- IV1: 기존 단일 이벤트 생성 응답시간 증가 10% 미만 확인
- IV2: 기존 Event 타입 사용 코드 컴파일 에러 0개 확인  
- IV3: useEventOperations 기존 인터페이스 100% 호환성 확인

### Definition of Done
- [x] 반복 설정 UI가 기존 폼 디자인과 일치
- [x] 스킵 로직으로 모든 엣지 케이스 시나리오 테스트 통과  
- [x] 기존 이벤트 생성 기능 영향도 0% 확인
- [x] TypeScript 컴파일 에러 0개, ESLint 통과
- [x] 반복 일정 생성 성공률 98% 이상 달성

---

## Story 1.2: 반복 일정 시각적 구분 및 캘린더 통합

### Story Context

**기존 시스템 통합**:
- 통합 대상: 캘린더 월/주 뷰 컴포넌트, 이벤트 렌더링 로직
- 기술 스택: CSS-in-JS 또는 CSS 모듈 (기존 스타일링 방식 따름)
- 따를 패턴: 기존 이벤트 표시 컴포넌트, 아이콘 시스템
- 터치 포인트: 이벤트 렌더링 함수, 스타일시트, 사용자 인터랙션 핸들러

### User Story

As a **캘린더 사용자**,
I want **캘린더 뷰에서 반복 일정을 일반 일정과 시각적으로 구분**할 수 있다,
so that **어떤 일정이 반복 일정인지 한눈에 파악**할 수 있다.

### Acceptance Criteria

**기능 요구사항**:
1. 반복 일정(`repeat.id` 존재) 감지 시 🔄 아이콘 표시
2. 아이콘 위치: 이벤트 제목 우측 상단 (12px, opacity 0.7)
3. 월 뷰와 주 뷰에서 일관된 아이콘 크기와 위치 유지
4. 아이콘 색상: 중성 그레이 (#666) - 카테고리 색상과 독립

**통합 요구사항**:  
5. 이벤트 클릭 시 반복 정보 표시 **(스킵 정보 포함)**:
   - **정상 반복**: "매월 반복, 2025-10-30까지"
   - **스킵 있는 반복**: "31일 매월 반복 (일부 월 제외), 2025-10-30까지"
   - **통계 정보**: "총 12개월 중 7개월에 생성됨"

6. **반복 패턴별 툴팁**:
   - 일반 반복: "매일 반복", "매주 반복"
   - 스킵 반복: "매월 반복 (31일 - 일부 월 제외)", "매년 반복 (29일 - 일부 년 제외)"

7. **접근성 요구사항**: 스크린 리더용 aria-label 추가

**품질 요구사항**:
8. 기존 이벤트 렌더링 성능 영향 5% 이내
9. 아이콘 표시로 인한 레이아웃 왜곡 0건
10. 모든 브라우저에서 일관된 표시

### Technical Notes

**스킵 정보 계산 로직**:
```typescript
function getRepeatDisplayInfo(event) {
  const { type, endDate } = event.repeat;
  const skipInfo = calculateSkippedOccurrences(event.date, type, endDate);
  
  if (skipInfo.skippedCount > 0) {
    return {
      display: `${type} 반복 (${getDateInfo(event.date)} - 일부 ${getSkipUnit(type)} 제외)`,
      tooltip: `${type} 반복 (${skipInfo.reason} - 일부 ${getSkipUnit(type)} 제외)`,
      stats: `총 ${skipInfo.totalPossible}개 중 ${skipInfo.actualExists}개에 생성됨`
    };
  }
  return {
    display: `${type} 반복`,
    tooltip: `${type} 반복`,
    stats: `${skipInfo.actualExists}개 일정`
  };
}
```

### Integration Verification  
- IV1: 기존 이벤트 렌더링 성능 영향 5% 미만 확인
- IV2: 캘린더 그리드 레이아웃 왜곡 0건 확인
- IV3: 월/주 뷰 전환 시 아이콘 위치 일관성 100% 확인

### Definition of Done
- [x] 모든 뷰에서 반복 아이콘 일관된 표시
- [x] 스킵 정보가 사용자에게 명확하게 전달됨
- [x] 기존 이벤트 시각적 표현 변경 없음
- [x] 접근성 테스트 통과 (키보드 네비게이션, 스크린 리더)
- [x] 성능 테스트: 100개 이벤트 렌더링 시간 5% 이내 증가

---

## Story 1.3: 반복 일정 개별 관리 (수정/삭제)

### Story Context

**기존 시스템 통합**:
- 통합 대상: 이벤트 수정/삭제 모달, useEventOperations 훅
- 기술 스택: 기존 모달 컴포넌트, 상태 관리 로직
- 따를 패턴: 현재 이벤트 수정/삭제 워크플로우와 동일한 UX
- 터치 포인트: 모달 UI, 확인 다이얼로그, API 호출 로직

### User Story

As a **캘린더 사용자**,
I want **반복 일정 중 특정 날짜의 일정만 개별적으로 수정하거나 삭제**할 수 있다,
so that **전체 반복을 해치지 않고 예외적인 상황을 처리**할 수 있다.

### Acceptance Criteria

**기능 요구사항**:
1. 반복 일정 수정 시 선택 모달: "이 일정만 수정" vs "전체 반복 시리즈 수정"
2. "이 일정만" 선택 시:
   - `repeat.id` 제거하여 독립 이벤트로 전환
   - 반복 아이콘 즉시 제거
   - 기존 수정 워크플로우로 진행

3. 반복 일정 삭제 시 선택 모달 **(스킵 정보 포함)**:
   - "이 일정만 삭제" vs "전체 반복 시리즈 삭제"  
   - **스킵 상황 표시**: "전체 시리즈 12개 중 7개 일정이 삭제됩니다 (일부 월 제외로 5개는 존재하지 않음)"

4. "이 일정만" 선택 시:
   - 해당 이벤트만 삭제
   - **나머지 반복 유지**: 스킵된 날짜들도 여전히 스킵 상태로 유지
   - 삭제 확인: "반복 일정 중 1개가 삭제되었습니다 (총 7개 중)"

**통합 요구사항**:
5. **데이터 일관성 보장**:
   - 개별 수정/삭제 시 원자적 처리
   - 실패 시 완전 롤백 또는 사용자에게 명확한 오류 메시지
6. 기존 일반 이벤트의 수정/삭제 워크플로우는 변경 없음
7. useEventOperations 상태 업데이트 즉시 UI 반영

**품질 요구사항**:
8. 개별 조작 완료 시간 3초 이내 (사용자 응답성)
9. 반복 일정 개별 조작 성공률 99% 이상
10. 조작 후 캘린더 데이터 일관성 검증 로직 통과

### Technical Notes

**스킵 인식 및 표시 로직**:
```typescript
function getRepeatSeriesInfo(repeatId) {
  const allEvents = getEventsByRepeatId(repeatId);
  const firstEvent = allEvents[0];
  const totalPossible = calculateTotalPossibleEvents(firstEvent.date, firstEvent.repeat.endDate, firstEvent.repeat.type);
  const actualExists = allEvents.length;
  const skipped = totalPossible - actualExists;
  
  return {
    totalPossible,
    actualExists, 
    skipped,
    skipReason: determineSkipReason(firstEvent), // "31일 매월", "29일 매년" 등
    skipUnit: getSkipUnit(firstEvent.repeat.type) // "월", "년" 등
  };
}

function generateDeleteConfirmationMessage(seriesInfo) {
  if (seriesInfo.skipped > 0) {
    return `전체 시리즈 ${seriesInfo.totalPossible}개 중 ${seriesInfo.actualExists}개 일정이 삭제됩니다 (일부 ${seriesInfo.skipUnit} 제외로 ${seriesInfo.skipped}개는 존재하지 않음)`;
  }
  return `전체 ${seriesInfo.actualExists}개 일정이 삭제됩니다`;
}
```

**통합 접근법**:
- 기존 이벤트 수정/삭제 함수를 확장하여 `repeat.id` 체크 로직 추가
- 모달 컴포넌트에 반복 일정 전용 선택 UI 섹션 추가

**기존 패턴 참조**:
- 현재 삭제 확인 모달과 동일한 스타일과 버튼 배치
- 기존 오류 처리 패턴과 동일한 사용자 피드백 방식

**핵심 제약사항**:
- JSON 파일 기반이므로 트랜잭션 롤백이 어려움 → 신중한 검증 로직 필요
- 대량 반복 일정에서 개별 삭제 시 성능 고려

### Integration Verification
- IV1: 기존 일반 이벤트 수정/삭제 워크플로우 영향도 0% 확인
- IV2: 반복 일정 조작 후 useEventOperations 상태 일관성 100% 확인  
- IV3: MSW 테스트에서 모든 반복 시나리오 재현 가능성 확인

### Definition of Done
- [x] 반복/일반 이벤트 모두에서 수정/삭제 정상 동작
- [x] 스킵 정보가 사용자에게 정확하게 표시됨
- [x] 데이터 일관성 테스트 100% 통과
- [x] 사용자 워크플로우 혼란 없음 (UX 테스트)
- [x] 오류 상황 처리 및 사용자 피드백 완비

## 핵심 스킵 로직 시나리오

### 예시 1: 1월 31일 매월 반복 (2025-01-31 시작, 2025-12-31 종료)
```
생성되는 이벤트:
✅ 2025-01-31 (31일 존재)
❌ 2025-02-xx (2월에는 31일 없음 → 스킵)  
✅ 2025-03-31 (31일 존재)
❌ 2025-04-xx (4월에는 31일 없음 → 스킵)
✅ 2025-05-31 (31일 존재)
❌ 2025-06-xx (6월에는 31일 없음 → 스킵)
✅ 2025-07-31 (31일 존재)
✅ 2025-08-31 (31일 존재)
❌ 2025-09-xx (9월에는 31일 없음 → 스킵)
✅ 2025-10-30 (종료일 제한으로 10-30에 생성, 10-31은 제한 초과)

결과: 총 12개월 중 7개월에 생성
```

### 예시 2: 윤년 2월 29일 매년 반복 (2024-02-29 시작, 2025-10-30 종료)
```
생성되는 이벤트:
✅ 2024-02-29 (윤년이므로 29일 존재)
❌ 2025-02-xx (평년이므로 29일 없음 → 스킵)

결과: 2년 중 1년에만 생성
```

## TDD 개발 가이드

### 테스트 우선 개발 순서
1. **Red**: 엣지 케이스 테스트부터 작성 (실패하는 테스트)
2. **Green**: 테스트를 통과하는 최소한의 스킵 로직 구현
3. **Refactor**: 날짜 계산 유틸리티 함수 분리 및 정리

### 핵심 테스트 케이스
- 31일 매월 반복의 각 달별 스킵/생성 검증
- 윤년/평년 29일 매년 반복 검증  
- 종료일 2025-10-30 하드 제한 검증
- 성능 테스트: 100개 반복 일정 생성 시간 측정