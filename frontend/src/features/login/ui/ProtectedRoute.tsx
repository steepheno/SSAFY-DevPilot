import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfigStore } from '@/shared/store/configStore';

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const { isInitialized, isLoggedIn } = useConfigStore();
  const location = useLocation();

  // 로그인 안 돼 있으면 로그인 페이지로
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // 로그인은 돼 있지만 초기 설정 안 돼 있으면 초기 설정 페이지로
  if (!isInitialized) {
    return <Navigate to="/login/new" replace state={{ from: location }} />;
  }
  // 로그인+초기 설정 모두 완료된 사용자 전용 페이지 렌더
  return <>{children}</>;
}

export default ProtectedRoute;
