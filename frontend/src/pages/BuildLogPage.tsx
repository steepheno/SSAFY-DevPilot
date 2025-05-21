import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { CircleCheckIcon, CirclePlayIcon, CircleXIcon } from 'lucide-react';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner.tsx';

const BuildLogPage = () => {
  const { buildId } = useParams<{ buildId: string }>();
  const [buildStatus, setBuildStatus] = useState<'pending' | 'progress' | 'complete' | 'error'>(
    'pending',
  );
  type LogEntry = {
    message: string;
    isError: boolean;
  };

  const [log, setLog] = useState<LogEntry[]>([]);

  // type Event =
  //   | 'job_run_queue_enter'
  //   | 'job_run_queue_buildable'
  //   | 'job_run_queue_left'
  //   | 'job_run_started'
  //   | 'job_run_ended'
  //   | 'job_run_queue_task_complete';

  // interface Job {
  //   event: Event;
  //   data: {
  //     eventType: Event;
  //     name: string;
  //     buildNumber: number;
  //     timestamp: number;
  //   };
  // }

  const url = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const eventSource = new EventSource(`${url}/events/stream/clientId`);
    eventSource.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      const text = typeof payload === 'string' ? payload : JSON.stringify(payload);

      switch (type) {
        // case 'subscription_succeeded':
        //   console.log(payload);
        //   break;
        // case 'job_run_queue_enter':
        //   console.log(payload);
        //   break;
        // case 'job_run_queue_left':
        //   console.log(payload);
        //   break;
        case 'job_run_started':
          setBuildStatus('progress');
          setLog((prev) => [...prev, { message: payload as string, isError: false }]);
          break;
        case 'job_run_ended':
          setBuildStatus('complete');
          setLog((prev) => [...prev, { message: payload as string, isError: false }]);
          eventSource.close();
          break;
        // case 'job_run_queue_task_complete':
        //   console.log(payload);
        default:
          setLog((prev) => [...prev, { message: payload as string, isError: false }]);
          break;
      }
    };

    eventSource.addEventListener('new_thread', () => {
      // 'new_thread' 이벤트가 오면 할 동작
    });

    eventSource.onerror = (error: any) => {
      const errorMessage = (error as ErrorEvent).message || 'SSE error';
      setLog((prev) => [...prev, { message: errorMessage as string, isError: true }]);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    // 빌드끝나면 setTimeout => 빌드완료시의 로직
  }, [buildStatus]);

  // 로그 갱신시마다 스크롤 맨밑으로
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [log]);

  return (
    <div className="overflow-hidden">
      <div
        ref={containerRef}
        className="h-[60vh] max-h-full overflow-y-auto whitespace-pre-wrap bg-gray-200 p-2 font-mono text-sm"
      >
        {/* 라인넘버와 로그 표시 */}
        {log.map((line, idx) => (
          <pre key={idx} className="flex whitespace-pre-wrap">
            <div
              className={`${line.isError ? 'text-red-600' : ''} w-10 select-none pr-4 text-right text-gray-400`}
            >
              {idx + 1}
            </div>
            <div className="mx-2" />
            <span className={line.isError ? 'text-red-600' : ''}>{line.message}</span>
          </pre>
        ))}
      </div>
    </div>
  );
};

export default BuildLogPage;
