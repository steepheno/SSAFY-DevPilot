import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner.tsx';
import { CircleCheckIcon, CirclePlayIcon, CircleXIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const BuildLogPage = () => {
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

  const sse_url = import.meta.env.VITE_SSE_URL;
  useEffect(() => {
    const eventSource = new EventSource(sse_url);
    eventSource.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

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
      setLog((prev) => [...prev, { message: error as string, isError: true }]);
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
    <div className="">
      <h2>빌드 로그</h2>
      <div className="flex items-center gap-2">
        {buildStatus === 'progress' ? (
          <LoadingSpinner />
        ) : buildStatus === 'complete' ? (
          <CircleCheckIcon size={24} color="green" />
        ) : buildStatus === 'error' ? (
          <CircleXIcon size={24} color="red" />
        ) : (
          <CirclePlayIcon size={24} color="gray" />
        )}
        <h3>{'buildNo.'}</h3>
      </div>

      <div
        ref={containerRef}
        className="h-1/3 max-h-full min-h-48 overflow-y-auto overscroll-none whitespace-pre-wrap rounded-sm bg-gray-200 p-2 font-mono text-sm"
      >
        {/* 라인넘버와 로그 표시 */}
        {log.map((line, idx) => (
          <div className="flex">
            <span
              className={`${line.isError ? 'text-red-600' : ''} w-10 select-none pr-4 text-left text-gray-400`}
            >
              {idx + 1}
            </span>
            {/* 구분선 */}
            <div className="mx-2 border-r border-gray-400" />
            <span className={line.isError ? 'text-red-600' : ''}>{line.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildLogPage;
