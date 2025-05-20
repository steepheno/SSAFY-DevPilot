import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfigStore } from '@/shared/store/configStore';

interface Props {
  children: ReactNode;
}

function PublicRoute({ children }: Props) {
  const { isInitialized, isLoggedIn } = useConfigStore();
  const location = useLocation();

  // 이미 로그인 돼 있으면 홈으로
  if (isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  // 초기 설정이 안 돼 있으면 초기 설정 페이지로
  if (!isInitialized) {
    return <Navigate to="/login/new" replace state={{ from: location }} />;
  }
  // 초기 설정도 완료, 로그인 전 사용자 전용 페이지 렌더
  return <>{children}</>;
}

export default PublicRoute;
