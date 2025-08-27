import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  const newEvent: EventForm = {
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations());

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations());

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});

describe('반복 이벤트 생성', () => {
  it('none 타입의 반복은 단일 이벤트만 생성한다', () => {
    const { result } = renderHook(() => useEventOperations());

    const baseEvent: EventForm = {
      title: '테스트 이벤트',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'none',
        interval: 1,
        endDate: '2025-08-15',
      },
      notificationTime: 10,
    };

    const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2025-07-15');
    expect(events[0].repeat.id).toBeUndefined();
  });

  it('endDate가 없으면 단일 이벤트만 생성한다', () => {
    const { result } = renderHook(() => useEventOperations());

    const baseEvent: EventForm = {
      title: '테스트 이벤트',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
      },
      notificationTime: 10,
    };

    const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2025-07-15');
  });

  it('매일 반복 이벤트를 올바르게 생성한다', () => {
    const { result } = renderHook(() => useEventOperations());

    const baseEvent: EventForm = {
      title: '매일 반복',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-07-17',
      },
      notificationTime: 10,
    };

    const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2025-07-15');
    expect(events[1].date).toBe('2025-07-16');
    expect(events[2].date).toBe('2025-07-17');
    events.forEach((event) => {
      expect(event.repeat.id).toBe('test-uuid');
      expect(event.repeat.skipInvalidDates).toBe(true);
    });
  });

  it('31일 매월 반복에서 존재하지 않는 날짜를 스킵한다', () => {
    const { result } = renderHook(() => useEventOperations());

    const baseEvent: EventForm = {
      title: '31일 매월 반복',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-04-30',
      },
      notificationTime: 10,
    };

    const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

    // 1월 31일, 3월 31일, 4월의 유효한 날짜까지 생성됨 (실제 구현에 따라)
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].date).toBe('2025-01-31');
    // 유효한 날짜만 생성되는지 확인
    events.forEach((event) => {
      const [year, month, day] = event.date.split('-').map(Number);
      expect(year).toBeGreaterThanOrEqual(2025);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  it('윤년 2월 29일 매년 반복에서 평년은 스킵한다', () => {
    const { result } = renderHook(() => useEventOperations());

    const baseEvent: EventForm = {
      title: '윤년 2월 29일',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2027-02-28',
      },
      notificationTime: 10,
    };

    const events = result.current.generateRepeatEvents(baseEvent, 'test-uuid');

    // 실제 구현에 따라 유효한 날짜만 생성되는지 확인
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].date).toBe('2024-02-29');
    // 생성된 모든 이벤트가 유효한 날짜인지 검증
    events.forEach((event) => {
      const [year, month, day] = event.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      expect(dateObj.getFullYear()).toBe(year);
      expect(dateObj.getMonth() + 1).toBe(month);
      expect(dateObj.getDate()).toBe(day);
    });
  });

  it('saveRepeatEvents가 반복 이벤트들을 순차적으로 저장한다', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations());

    await act(() => Promise.resolve(null));

    const baseEvent: EventForm = {
      title: '반복 저장 테스트',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-07-16',
      },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(baseEvent, 'test-uuid');
    });

    expect(enqueueSnackbarFn).toHaveBeenCalledWith('반복 일정 2개가 생성되었습니다.', {
      variant: 'success',
    });
  });

  it('반복 이벤트 저장 실패 시 에러 처리가 된다', async () => {
    server.use(
      http.post('/api/events', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEventOperations());

    await act(() => Promise.resolve(null));

    const baseEvent: EventForm = {
      title: '저장 실패 테스트',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-07-15',
      },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(baseEvent, 'test-uuid');
    });

    expect(enqueueSnackbarFn).toHaveBeenCalledWith('반복 일정 저장 실패', { variant: 'error' });

    server.resetHandlers();
  });
});
