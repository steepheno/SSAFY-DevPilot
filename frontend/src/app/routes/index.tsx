import { createBrowserRouter } from 'react-router-dom';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage } from '@/pages/';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';
import PageLayout from '@/widgets/PageLayout';
import BuildList from '@/pages/buildLog/ui/BuildList';

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
        <BuildList />
      </PageLayout>
    ),
  },
]);

export default Router;
