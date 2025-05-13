import { createBrowserRouter, Outlet, redirect } from 'react-router-dom';
import PageLayout from '@/widgets/PageLayout';
import { MainPage, NewBuildPage, DockerSettings, ConfigurePage, BuildInfoPage } from '@/pages';
import RepositorySettings from '@/features/jenkins-settings/ui/RepositorySettings';
import BuildList from '@/pages/buildLog/ui/BuildList';
import BuildDetail from '@/pages/buildLog/ui/BuildDetail';

async function buildInfoLoader(params: any) {
  const { buildId } = params;
  if (!/^\d+$/.test(buildId || '')) {
    throw redirect('/404');
  }
  return null;
}

const Router = createBrowserRouter([
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
          {
            path: 'repository',
            handle: { breadcrumb: 'Git 설정' },
            element: <RepositorySettings />,
          },
          {
            path: 'environment',
            handle: { breadcrumb: '빌드 파일 생성' },
            element: <DockerSettings />,
          },
          { path: 'configure', element: <ConfigurePage /> },
        ],
      },
      {
        path: 'builds',
        element: <Outlet />, // 하위 라우트만 렌더
        handle: { breadcrumb: '빌드 기록' },
        children: [
          {
            index: true,
            element: <BuildList />,
          },
          {
            path: ':buildId',

            loader: buildInfoLoader,
            element: <BuildInfoPage />,
            handle: { breadcrumb: '대시보드' },
            children: [
              {
                path: 'detail',
                element: <BuildDetail />,
                handle: { breadcrumb: '빌드 상세' },
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default Router;
