// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import PageLayout from '@/widgets/PageLayout';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage } from '@/pages';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';
import BuildInfoPage from '@/pages/BuildInfoPage';
import BuildList from '@/pages/buildLog/ui/BuildList';

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
      {
        path: 'builds/:buildId',
        handle: { breadcrumb: '대시보드' },
        element: <BuildInfoPage />,
      },
      {
        path: 'builds',
        handle: { breadcrumb: '빌드 기록' },
        element: <BuildList />,
      },
    ],
  },
]);

export default router;
