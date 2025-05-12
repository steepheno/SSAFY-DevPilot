import { createBrowserRouter, Outlet } from 'react-router-dom';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage } from '@/pages/';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';
import PageLayout from '@/widgets/PageLayout';
import BuildList from '@/pages/buildLog/ui/BuildList';
import BuildDetail from '@/pages/buildLog/ui/BuildDetail';

const Router = createBrowserRouter([
  {
    path: '/',
    handle: { breadcrumb: '홈' },
    element: <MainPage />,
  },
  {
    path: '/new',
    handle: { breadcrumb: '새 빌드' },
    element: <NewBuildPage />,
    children: [
      {
        path: 'repository',
        element: <JenkinsSettings />,
      },
      {
        path: 'environment',
        element: <DockerSettings />,
      },
      {
        path: 'configure',
        element: <ConfigurePage />,
      },
    ],
  },
  {
    path: '/builds',
    handle: { breadcrumb: '빌드 기록' },
    element: (
      <PageLayout>
        <Outlet />
      </PageLayout>
    ),
    children: [
      {
        path: '',
        handle: { breadcrumb: '빌드 목록' },
        element: <BuildList />,
      },
      {
        path: 'detail',
        handle: { breadcrumb: '빌드 상세' },
        element: <BuildDetail />,
      },
    ],
  },
]);

export default Router;
