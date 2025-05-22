import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useConfigStore } from '@/shared/store/configStore';
import { getInitialSettingsStatus } from '@/features/initialSettings/api/getInitialSettingsStatus';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const { isLoggedIn, isInitialized, loadingInit, errorInit, checkInitialization } =
    useConfigStore();

  const location = useLocation();

  // 앱 마운트 시 한번 실행
  useEffect(() => {
    checkInitialization();
  }, []);

  // 로딩 / 에러 / 로그인 / 초기화 분기
  if (loadingInit) return <LoadingSpinner />;
  if (errorInit) return null;
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isInitialized) {
    return <Navigate to="/login/new" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
