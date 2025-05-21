// src/shared/routes/InitRoute.tsx
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfigStore } from '@/shared/store/configStore';

interface Props {
  children: ReactNode;
}

export default function InitRoute({ children }: Props) {
  const { isLoggedIn, isInitialized, loadingInit, errorInit, checkInitialization } =
    useConfigStore();
  const location = useLocation();

  // 마운트 시 최초 한 번 초기화 체크
  useEffect(() => {
    checkInitialization();
  }, []);

  // 초기 설정 체크 중
  if (loadingInit) {
    return null; // 혹은 <LoadingSpinner />
  }
  // 초기 설정 로드 중 오류
  if (errorInit) {
    // 원하는 에러 UI 렌더링 or 경로 리다이렉트
    return <div className="p-4 text-red-600">{errorInit}</div>;
  }

  // 초기 설정은 됐는데, 로그인 안 돼 있으면 로그인 페이지로
  if (isInitialized && !isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 그 외(로그인 전, 초기화 전 등)는 그냥 자식 렌더
  return <>{children}</>;
}
