import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';
import { useSubscriptionStatus } from '@/features/initialSettings/model/useSSE';

const BuildLogPage = () => {
  const { jobName, buildId } = useParams<{ jobName: string; buildId: string }>();
  const [logLines, setLogLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // status 이벤트 구독
  const subStatus = useSubscriptionStatus({
    onEvent: () => {},
  });

  // 로그 처리
  useEffect(() => {
    if (!jobName || !buildId) return;
    const url = `http://localhost:3000/api/jenkinsapi/stream/${jobName}/${buildId}`;
    const es = new EventSource(url);

    // log 이벤트는 chunk 전달
    es.addEventListener('log', (e: MessageEvent) => {
      const chunk = e.data as string;
      setLogLines((prev) => [...prev, ...chunk.split(/\r?\n/)]);
    });

    // 에러처리
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [jobName, buildId]);

  // 로그 갱신시마다 스크롤 맨밑으로
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logLines]);

  // 렌더링 분기
  if (subStatus !== 'subscription_succeeded') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">구독 연결 중...</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div
        ref={containerRef}
        className="h-[60vh] max-h-full overflow-y-auto whitespace-pre-wrap bg-gray-200 p-2 font-mono text-sm"
      >
        {logLines.map((line, i) => (
          <pre key={i} className="m-0">
            {line}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default BuildLogPage;
