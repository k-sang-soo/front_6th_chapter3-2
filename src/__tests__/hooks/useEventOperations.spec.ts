import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEventOperations } from '../../hooks/useEventOperations';
import { EventForm } from '../../types';

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// snackbar 모킹
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}));

describe('useEventOperations - 반복 이벤트 생성 로직', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    });
  });

  describe('generateRepeatEvents', () => {
    it('반복 타입이 none일 때 단일 이벤트만 반환한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '테스트 이벤트',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'none',
          interval: 1,
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

      expect(events).toHaveLength(1);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[0].repeat.id).toBeUndefined();
    });

    it('매일 반복 이벤트를 올바르게 생성한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '매일 반복',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-05',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'daily-uuid');

      expect(events).toHaveLength(5);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2025-10-02');
      expect(events[2].date).toBe('2025-10-03');
      expect(events[3].date).toBe('2025-10-04');
      expect(events[4].date).toBe('2025-10-05');
      expect(events.every((event) => event.repeat.id === 'daily-uuid')).toBe(true);
      expect(events.every((event) => event.repeat.skipInvalidDates === true)).toBe(true);
    });

    it('매주 반복 이벤트를 올바르게 생성한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '매주 반복',
        date: '2025-10-01', // 수요일
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: '2025-10-15',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'weekly-uuid');

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01'); // 첫 번째 수요일
      expect(events[1].date).toBe('2025-10-08'); // 두 번째 수요일
      expect(events[2].date).toBe('2025-10-15'); // 세 번째 수요일
      expect(events.every((event) => event.repeat.id === 'weekly-uuid')).toBe(true);
    });

    it('매월 반복 이벤트를 올바르게 생성한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '매월 반복',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-31',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'monthly-uuid');

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-15');
      expect(events[1].date).toBe('2025-11-15');
      expect(events[2].date).toBe('2025-12-15');
      expect(events.every((event) => event.repeat.id === 'monthly-uuid')).toBe(true);
    });

    it('매년 반복 이벤트를 올바르게 생성한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '매년 반복',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2027-10-31',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'yearly-uuid');

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2026-10-01');
      expect(events[2].date).toBe('2027-10-01');
      expect(events.every((event) => event.repeat.id === 'yearly-uuid')).toBe(true);
    });

    it('31일 매월 반복 시 31일이 없는 달은 스킵한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '31일 매월 반복',
        date: '2025-10-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2026-01-31',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'skip-uuid');

      // 실제로 생성된 이벤트들을 확인
      const validDates = events.map((e) => e.date);

      // 10월 31일은 존재함
      expect(validDates).toContain('2025-10-31');
      // 11월 31일은 존재하지 않으므로 해당 달은 스킵됨
      expect(validDates).not.toContain('2025-11-31');

      // 엣지 케이스 스킵 처리가 올바르게 동작하는지 확인
      expect(events.every((event) => event.repeat.skipInvalidDates === true)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('윤년 2월 29일 매년 반복 시 평년에는 스킵한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '윤년 2월 29일',
        date: '2024-02-29', // 2024년은 윤년
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2027-03-01',
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'leap-uuid');

      // 생성된 날짜들 확인
      const validDates = events.map((e) => e.date);

      // 2024-02-29 (윤년)는 존재함
      expect(validDates).toContain('2024-02-29');
      // 평년인 경우는 날짜가 유효하지 않으므로 스킵됨
      expect(validDates).not.toContain('2025-02-29');
      expect(validDates).not.toContain('2026-02-29');
      expect(validDates).not.toContain('2027-02-29');

      // 엣지 케이스 스킵 처리가 올바르게 동작하는지 확인
      expect(events.every((event) => event.repeat.skipInvalidDates === true)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('최대 365개 이벤트 제한이 동작한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: '매일 반복 제한 테스트',
        date: '2025-01-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2030-12-31', // 5년간 매일 = 1800개 이상
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'limit-uuid');

      expect(events.length).toBeLessThanOrEqual(365);
    });
  });

  describe('saveRepeatEvents', () => {
    it('반복 이벤트들을 순차적으로 저장한다', async () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const eventData: EventForm = {
        title: '반복 저장 테스트',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-03',
        },
        notificationTime: 0,
      };

      await act(async () => {
        await result.current.saveRepeatEvents(eventData, 'save-uuid');
      });

      // 성공 메시지 확인
      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('반복 일정 3개가 생성되었습니다.', {
          variant: 'success',
        });
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('endDate 없는 반복 이벤트는 단일 이벤트만 생성한다', () => {
      const { result } = renderHook(() => useEventOperations(false, mockOnSave));

      const baseEvent: EventForm = {
        title: 'endDate 없는 반복',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          // endDate가 없음
        },
        notificationTime: 0,
      };

      const events = result.current.generateRepeatEvents(baseEvent, 'no-end-uuid');

      // endDate가 없으면 단일 이벤트만 생성됨
      expect(events).toHaveLength(1);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[0].repeat.id).toBeUndefined();
    });
  });
});
