import { useConfigStore } from '@/shared/store/configStore';
import { Navigate, useLocation } from 'react-router';

interface Props {
  children: React.ReactNode;
}

function InitRoute({ children }: Props) {
  const { isLoggedIn, isInitialized } = useConfigStore();
  const location = useLocation();

  if (isInitialized && !isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default InitRoute;
