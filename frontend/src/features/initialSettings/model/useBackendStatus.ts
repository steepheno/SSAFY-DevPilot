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

// 웹 환경에선 Wails 런타임이 없으므로 바로 ready
const isWails =
  typeof window !== 'undefined' &&
  typeof window.runtime === 'object' &&
  typeof window.runtime.EventsOn === 'function';

/**
 * Wails로부터 백엔드 준비 상태 이벤트를 수신
 * 'loading' → 'ready' 또는 'failed' 로 전환
 */
export function useBackendStatus(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>(isWails ? 'loading' : 'ready');

  useEffect(() => {
    if (!isWails) return; // 웹에선 아무 리스너도 등록하지 않음

    // Wails 런타임이 있을 때만 리스너 등록
    const offReady = window.runtime.EventsOn('backend:ready', () => setStatus('ready'));
    const offFailed = window.runtime.EventsOn('backend:failed', () => setStatus('failed'));
    return () => {
      offReady();
      offFailed();
    };
  }, [isWails]);

  return status;
}
