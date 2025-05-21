import { useEffect, useState, useRef } from 'react';

export type SubscriptionStatus =
  | 'subscription_succeeded'
  | 'subscription_error'
  | 'subscription_end';

interface UseSubscriptionStatusOptions {
  onEvent: (type: string, payload: any) => void;
}

export function useSubscriptionStatus({ onEvent }: UseSubscriptionStatusOptions) {
  const [status, setStatus] = useState<SubscriptionStatus>('subscription_end');
  const evtSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('http://localhost:3000/api/jenkinsapi/events/stream/clientId');
    evtSourceRef.current = es;

    // 1) 연결 성공
    es.onopen = () => {
      setStatus('subscription_succeeded');
    };

    // 2) named events as plain strings
    const namedEvents: string[] = [
      'job_run_queue_enter',
      'job_run_queue_buildable',
      'job_run_queue_left',
      'job_run_started',
      'job_run_ended',
      'job_run_queue_task_complete',
    ];

    namedEvents.forEach((eventName) => {
      // tell TS that `e` is a MessageEvent so `.data` exists
      es.addEventListener(eventName, (e: MessageEvent) => {
        let data: any = e.data;
        try {
          data = JSON.parse(e.data);
        } catch {}
        onEvent(eventName, data);
      });
    });

    // 3) fallback to "message" for unnamed events
    es.addEventListener('message', (e: MessageEvent) => {
      let parsed: any;
      try {
        parsed = JSON.parse(e.data);
        onEvent(parsed.type, parsed.payload);
      } catch {
        onEvent('message', e.data);
      }
    });

    // 4) 에러
    es.onerror = () => {
      setStatus('subscription_error');
      es.close();
    };

    return () => {
      es.close();
    };
  }, [onEvent]);

  return status;
}
