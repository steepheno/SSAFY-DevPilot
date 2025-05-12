import { createBrowserRouter } from 'react-router-dom';
import PageLayout from '@/widgets/PageLayout';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage, BuildInfoPage } from '@/pages';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';
import BuildList from '@/pages/buildLog/ui/BuildList';
import BuildDetail from '@/pages/buildLog/ui/BuildDetail';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PageLayout />,
    children: [
      {
        index: true,
        handle: { breadcrumb: '홈' },
        element: <MainPage />,
      },
      {
        path: 'new',
        handle: { breadcrumb: '새 빌드' },
        element: <NewBuildPage />,
        children: [
          { path: 'repository', element: <JenkinsSettings /> },
          { path: 'environment', element: <DockerSettings /> },
          { path: 'configure', element: <ConfigurePage /> },
        ],
      },
      // TODO: /builds페이지를 루트로 children 내에 하위 페이지 렌더
      {
        path: 'builds',
        handle: { breadcrumb: '빌드 기록' },
        element: <BuildList />,
      },
      {
        path: 'builds/:buildId',
        handle: { breadcrumb: '대시보드' },
        element: <BuildInfoPage />,
      },
      {
        path: 'builds/:buildId/detail',
        handle: { breadcrumb: '빌드 상세' },
        element: <BuildDetail />,
      },
    ],
  },
]);

export default router;
