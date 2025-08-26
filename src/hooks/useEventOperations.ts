import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { isActualDateExists } from '../utils/dateUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;
      if (editing) {
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  // 반복 이벤트 생성 로직
  const generateRepeatEvents = (baseEvent: EventForm, repeatId: string): EventForm[] => {
    const events: EventForm[] = [];
    const startDate = new Date(baseEvent.date);
    const endDate = baseEvent.repeat.endDate ? new Date(baseEvent.repeat.endDate) : null;
    
    if (baseEvent.repeat.type === 'none' || !endDate) {
      return [{ ...baseEvent, repeat: { ...baseEvent.repeat, id: undefined } }];
    }

    let currentDate = new Date(startDate);
    let eventsCreated = 0;
    const maxEvents = 365; // 안전장치: 최대 365개 이벤트

    while (currentDate <= endDate && eventsCreated < maxEvents) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      // 날짜 유효성 검증 - 엣지 케이스 스킵
      if (isActualDateExists(year, month, day)) {
        const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        events.push({
          ...baseEvent,
          date: eventDate,
          repeat: {
            ...baseEvent.repeat,
            id: repeatId,
            skipInvalidDates: true
          }
        });
        eventsCreated++;
      }

      // 다음 날짜 계산
      switch (baseEvent.repeat.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + baseEvent.repeat.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (baseEvent.repeat.interval * 7));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + baseEvent.repeat.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + baseEvent.repeat.interval);
          break;
      }
    }

    return events;
  };

  // 반복 이벤트들을 일괄 저장
  const saveRepeatEvents = async (eventData: EventForm, repeatId: string) => {
    try {
      const repeatEvents = generateRepeatEvents(eventData, repeatId);
      
      // 각 이벤트를 개별적으로 저장
      for (const event of repeatEvents) {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error('Failed to save repeat event');
        }
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(`반복 일정 ${repeatEvents.length}개가 생성되었습니다.`, {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving repeat events:', error);
      enqueueSnackbar('반복 일정 저장 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, fetchEvents, saveEvent, deleteEvent, saveRepeatEvents, generateRepeatEvents };
};
