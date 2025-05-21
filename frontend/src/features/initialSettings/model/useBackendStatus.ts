import { useEffect, useState } from 'react';

/**
 * Listens for the Go-side EventsEmit("backend:ready"|"backend:failed")
 * and maps them to 'loading' → 'ready'|'failed'
 */

// 전역 Events 타입 추가
declare global {
  interface Window {
    runtime: {
      EventsOn: (
        eventName: 'backend:ready' | 'backend:failed',
        callback: (...args: any[]) => void,
      ) => () => void;
    };
  }
}

export type BackendStatus = 'loading' | 'ready' | 'failed';

/**
 * Wails로부터 백엔드 준비 상태 이벤트를 수신
 * 'loading' → 'ready' 또는 'failed' 로 전환
 */
export function useBackendStatus(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>('loading');

  useEffect(() => {
    // 리스너 등록
    const offReady = window.runtime.EventsOn('backend:ready', () => setStatus('ready'));
    const offFailed = window.runtime.EventsOn('backend:failed', () => setStatus('failed'));

    return () => {
      offReady();
      offFailed();
    };
  }, []);

  return status;
}
