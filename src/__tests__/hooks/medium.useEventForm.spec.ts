import { renderHook, act } from '@testing-library/react';
import React from 'react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event } from '../../types';

describe('useEventForm', () => {
  describe('기본 상태 초기화', () => {
    it('initialEvent가 없을 때 기본값으로 초기화된다', () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.title).toBe('');
      expect(result.current.date).toBe('');
      expect(result.current.startTime).toBe('');
      expect(result.current.endTime).toBe('');
      expect(result.current.description).toBe('');
      expect(result.current.location).toBe('');
      expect(result.current.category).toBe('업무');
      expect(result.current.isRepeating).toBe(true); // initialEvent가 없을 때 undefined?.repeat.type !== 'none'이 true가 됨
      expect(result.current.repeatType).toBe('none');
      expect(result.current.repeatInterval).toBe(1);
      expect(result.current.repeatEndDate).toBe('');
      expect(result.current.notificationTime).toBe(10);
      expect(result.current.editingEvent).toBeNull();
    });

    it('initialEvent가 있을 때 해당 값으로 초기화된다', () => {
      const initialEvent: Event = {
        id: '1',
        title: '테스트 이벤트',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '개인',
        repeat: {
          type: 'weekly',
          interval: 2,
          endDate: '2025-08-15',
        },
        notificationTime: 15,
      };

      const { result } = renderHook(() => useEventForm(initialEvent));

      expect(result.current.title).toBe('테스트 이벤트');
      expect(result.current.date).toBe('2025-07-15');
      expect(result.current.startTime).toBe('09:00');
      expect(result.current.endTime).toBe('10:00');
      expect(result.current.description).toBe('테스트 설명');
      expect(result.current.location).toBe('테스트 장소');
      expect(result.current.category).toBe('개인');
      expect(result.current.isRepeating).toBe(true);
      expect(result.current.repeatType).toBe('weekly');
      expect(result.current.repeatInterval).toBe(2);
      expect(result.current.repeatEndDate).toBe('2025-08-15');
      expect(result.current.notificationTime).toBe(15);
    });
  });

  describe('시간 유효성 검증', () => {
    it('올바른 시간 입력 시 에러가 없다', () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.handleStartTimeChange({
          target: { value: '09:00' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleEndTimeChange({
          target: { value: '10:00' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.startTimeError).toBeNull();
      expect(result.current.endTimeError).toBeNull();
    });

    it('시작 시간이 종료 시간보다 늦을 때 에러가 발생한다', () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.handleStartTimeChange({
          target: { value: '10:00' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleEndTimeChange({
          target: { value: '09:00' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.endTimeError).toBe('종료 시간은 시작 시간보다 늦어야 합니다.');
    });
  });

  describe('폼 리셋', () => {
    it('resetForm 호출 시 모든 값이 초기 상태로 돌아간다', () => {
      const { result } = renderHook(() => useEventForm());

      // 폼에 값 설정
      act(() => {
        result.current.setTitle('테스트 제목');
        result.current.setDate('2025-07-15');
        result.current.setStartTime('09:00');
        result.current.setEndTime('10:00');
        result.current.setDescription('테스트 설명');
        result.current.setLocation('테스트 장소');
        result.current.setCategory('개인');
        result.current.setIsRepeating(true);
        result.current.setRepeatType('daily');
        result.current.setRepeatInterval(2);
        result.current.setRepeatEndDate('2025-08-15');
        result.current.setNotificationTime(30);
      });

      // 리셋 실행
      act(() => {
        result.current.resetForm();
      });

      // 모든 값이 초기화되었는지 확인
      expect(result.current.title).toBe('');
      expect(result.current.date).toBe('');
      expect(result.current.startTime).toBe('');
      expect(result.current.endTime).toBe('');
      expect(result.current.description).toBe('');
      expect(result.current.location).toBe('');
      expect(result.current.category).toBe('업무');
      expect(result.current.isRepeating).toBe(false);
      expect(result.current.repeatType).toBe('none');
      expect(result.current.repeatInterval).toBe(1);
      expect(result.current.repeatEndDate).toBe('');
      expect(result.current.notificationTime).toBe(10);
    });
  });

  describe('이벤트 편집', () => {
    it('editEvent 호출 시 해당 이벤트 정보로 폼이 설정된다', () => {
      const { result } = renderHook(() => useEventForm());

      const eventToEdit: Event = {
        id: '1',
        title: '편집할 이벤트',
        date: '2025-07-20',
        startTime: '14:00',
        endTime: '15:30',
        description: '편집 설명',
        location: '편집 장소',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 3,
          endDate: '2025-12-20',
        },
        notificationTime: 60,
      };

      act(() => {
        result.current.editEvent(eventToEdit);
      });

      expect(result.current.editingEvent).toBe(eventToEdit);
      expect(result.current.title).toBe('편집할 이벤트');
      expect(result.current.date).toBe('2025-07-20');
      expect(result.current.startTime).toBe('14:00');
      expect(result.current.endTime).toBe('15:30');
      expect(result.current.description).toBe('편집 설명');
      expect(result.current.location).toBe('편집 장소');
      expect(result.current.category).toBe('업무');
      expect(result.current.isRepeating).toBe(true);
      expect(result.current.repeatType).toBe('monthly');
      expect(result.current.repeatInterval).toBe(3);
      expect(result.current.repeatEndDate).toBe('2025-12-20');
      expect(result.current.notificationTime).toBe(60);
    });

    it('반복 없는 이벤트 편집 시 isRepeating이 false로 설정된다', () => {
      const { result } = renderHook(() => useEventForm());

      const nonRepeatEvent: Event = {
        id: '2',
        title: '단일 이벤트',
        date: '2025-07-25',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '개인',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 10,
      };

      act(() => {
        result.current.editEvent(nonRepeatEvent);
      });

      expect(result.current.isRepeating).toBe(false);
      expect(result.current.repeatType).toBe('none');
    });
  });

  describe('UUID 생성', () => {
    it('generateRepeatId는 유효한 UUID를 반환한다', () => {
      const { result } = renderHook(() => useEventForm());

      const uuid = result.current.generateRepeatId();

      // UUID v4 형식 검증 (8-4-4-4-12 패턴)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('generateRepeatId는 매번 다른 UUID를 반환한다', () => {
      const { result } = renderHook(() => useEventForm());

      const uuid1 = result.current.generateRepeatId();
      const uuid2 = result.current.generateRepeatId();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('RepeatInfo 확장 기능 테스트', () => {
    it('반복 이벤트의 id 필드가 올바르게 설정된다', () => {
      const repeatEvent: Event = {
        id: '1',
        title: '반복 이벤트',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          id: 'repeat-uuid-123',
          type: 'weekly',
          interval: 1,
          endDate: '2025-08-15',
          skipInvalidDates: true,
        },
        notificationTime: 10,
      };

      const { result } = renderHook(() => useEventForm(repeatEvent));

      expect(result.current.repeatType).toBe('weekly');
      expect(result.current.repeatEndDate).toBe('2025-08-15');
    });

    it('skipInvalidDates 필드가 기존 이벤트와 호환된다', () => {
      const basicEvent: Event = {
        id: '1',
        title: '기본 이벤트',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'none', interval: 1 }, // skipInvalidDates 필드 없음
        notificationTime: 10,
      };

      const { result } = renderHook(() => useEventForm(basicEvent));

      // 기존 이벤트도 정상적으로 처리됨
      expect(result.current.repeatType).toBe('none');
      expect(result.current.isRepeating).toBe(false);
    });

    it('endDate 필드 확장이 기존 Event 인터페이스와 호환된다', () => {
      const eventWithEndDate: Event = {
        id: '1',
        title: '종료일 있는 이벤트',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-08-15',
        },
        notificationTime: 10,
      };

      const { result } = renderHook(() => useEventForm(eventWithEndDate));

      expect(result.current.repeatType).toBe('daily');
      expect(result.current.repeatEndDate).toBe('2025-08-15');
      expect(result.current.isRepeating).toBe(true);
    });
  });

  describe('endDate 유효성 검증', () => {
    it('빈 endDate는 유효하다', () => {
      const { result } = renderHook(() => useEventForm());

      const error = result.current.validateEndDate('');

      expect(error).toBeNull();
    });

    it('2025-10-30 이후의 날짜는 유효하지 않다', () => {
      const { result } = renderHook(() => useEventForm());

      const error = result.current.validateEndDate('2025-10-31');

      expect(error).toBe('반복 종료일은 2025-10-30까지만 선택 가능합니다.');
    });

    it('시작일보다 이른 종료일은 유효하지 않다', () => {
      const { result } = renderHook(() => useEventForm());

      // 시작일 설정
      act(() => {
        result.current.setDate('2025-07-15');
      });

      const error = result.current.validateEndDate('2025-07-10');

      expect(error).toBe('반복 종료일은 시작일 이후여야 합니다.');
    });

    it('유효한 종료일은 에러가 없다', () => {
      const { result } = renderHook(() => useEventForm());

      // 시작일 설정
      act(() => {
        result.current.setDate('2025-07-15');
      });

      const error = result.current.validateEndDate('2025-08-15');

      expect(error).toBeNull();
    });

    it('2025-10-30은 유효한 최대 날짜다', () => {
      const { result } = renderHook(() => useEventForm());

      // 시작일 설정
      act(() => {
        result.current.setDate('2025-07-15');
      });

      const error = result.current.validateEndDate('2025-10-30');

      expect(error).toBeNull();
    });
  });
});
