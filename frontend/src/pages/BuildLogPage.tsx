import { useState, useEffect } from 'react';
import { useLottie } from 'lottie-react';
import rollingLoadingAnimation from '@/assets/Rolling@1x-1.0s-200px-200px.json';

const BuildLogPage = () => {
  const [빌드중, set빌드중] = useState(false);
  const [log, setLog] = useState(
    `줄바꿈이에요줄바꿈이에요\nCR이에요CR이에요CR이에요CR이에요CR이에요CR이에요CR이에요CR이에요CR이에요CR이에요CR이에요\r길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요길어요`,
  );

  const options = {
    animationData: rollingLoadingAnimation,
    loop: true,
    style: {
      width: 48,
      height: 48,
    },
  };
  const { View } = useLottie(options);

  useEffect(() => {
    const eventSource = new EventSource('/api/sse 연결 url');

    eventSource.addEventListener('new_thread', () => {
      // 'new_thread' 이벤트가 오면 할 동작
    });

    eventSource.onerror = () => {
      eventSource.close(); // 연결 끊기
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    // 빌드끝나면 setTimeout => 빌드완료시의 로직
  }, [빌드중]);

  // 줄 단위로 나눈 로그 (원하면 라인 넘버 표시용)
  const logLines = log.split(/\r?\n/);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <h2>빌드 로그</h2>
      <div className="flex items-center gap-2">
        {빌드중 ? <>{View}</> : <>빌드중아닌데요</>}
        <h3>{'buildNo.'}</h3>
      </div>

      <div className="h-1/3 max-h-full overflow-y-auto whitespace-pre-wrap rounded-sm bg-gray-200 p-4 font-mono text-sm">
        {/* 라인넘버와 로그 표시 */}
        {logLines.map((line, idx) => (
          <div key={idx} className="flex">
            <span className="w-10 pr-4 text-right text-gray-400">{idx + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildLogPage;
