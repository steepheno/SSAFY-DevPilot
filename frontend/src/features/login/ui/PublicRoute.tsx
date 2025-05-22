import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfigStore } from '@/shared/store/configStore';
import { getInitialSettingsStatus } from '@/features/initialSettings/api/getInitialSettingsStatus';

interface Props {
  children: ReactNode;
}

function PublicRoute({ children }: Props) {
  const { isInitialized, setIsInitialized, isLoggedIn } = useConfigStore();
  const location = useLocation();

  useEffect(() => {
    async function checkInit() {
      try {
        const response = await getInitialSettingsStatus();
        if (response.initialized === true) {
          setIsInitialized(response.initialized);
          console.log(isInitialized);
        }
      } catch (error) {}
    }

    checkInit();
  }, [isInitialized]);

  // 이미 로그인 돼 있으면 홈으로
  if (isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  // // 초기 설정이 안 돼 있으면 초기 설정 페이지로
  // if (!isInitialized) {
  //   return <Navigate to="/login/new" replace state={{ from: location }} />;
  // }
  // 초기 설정도 완료, 로그인 전 사용자 전용 페이지 렌더
  return <>{children}</>;
}

export default PublicRoute;
