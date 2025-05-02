import { createBrowserRouter } from 'react-router-dom';
import Main from '@/pages/ui/Main';
import JenkinsSettings from '@/pages/ui/JenkinsSettings';
import DockerfileSettings from '@/pages/ui/DockerSettings';
import Configure from '@/pages/ui/Configure';
import NewBuildPage from '@/pages/ui/NewBuild/NewBuildPage';

const Router = createBrowserRouter([
  {
    path: '/',
    handle: { breadcrumb: '홈' },
    element: <Main />,
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
        element: <DockerfileSettings />,
      },
      {
        path: 'configure',
        element: <Configure />,
      },
    ],
  },
]);

export default Router;
