// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import PageLayout from '@/widgets/PageLayout';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage } from '@/pages';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';
import BuildInfoPage from '@/pages/BuildInfoPage';

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
        path: 'build/:buildId',
        handle: { breadcrumb: '대시보드' },
        element: <BuildInfoPage />,
      },
    ],
  },
]);

export default router;
