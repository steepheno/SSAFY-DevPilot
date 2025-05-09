import { createBrowserRouter } from 'react-router-dom';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage } from '@/pages/';
import JenkinsSettings from '@/features/jenkins-settings/ui/JenkinsSettings';

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
]);

export default Router;
