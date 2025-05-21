// src/AppInitializer.tsx
import React from 'react';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';
import { useBackendStatus } from '@/features/initialSettings/model/useBackendStatus';

interface Props {
  children: React.ReactNode;
}

export default function AppInitializer({ children }: Props) {
  const status = useBackendStatus(); // 백엔드 구동 상태 확인

  return (
    <div className="flex h-screen items-center justify-center">
      {status === 'loading' ? (
        <>
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">백엔드 로딩 중...</span>
          </div>
        </>
      ) : status === 'failed' ? (
        <div className="flex flex-col items-center justify-center">
          <span className="text-red-500">
            백엔드 로딩에 실패했습니다. DevPilot을 재시작해주세요.
          </span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
