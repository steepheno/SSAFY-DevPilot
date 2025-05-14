import { createBrowserRouter, Outlet } from 'react-router-dom';
import PageLayout from '@/widgets/PageLayout';
import {
  MainPage,
  LoginPage,
  InitialPage,
  NewBuildPage,
  DockerSettings,
  BuildInfoPage,
} from '@/pages';
import RepositorySettings from '@/features/jenkins-settings/ui/RepositorySettings';
import BuildList from '@/pages/buildLog/ui/BuildList';
import BuildDetail from '@/pages/buildLog/ui/BuildDetail';

const Router = createBrowserRouter([
  {
    path: '/login',
    children: [
      {
        path: '',
        element: <LoginPage />,
      },
      {
        path: 'new',
        element: <InitialPage />,
      },
    ],
  },
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
            handle: { breadcrumb: '저장소 설정' },
            element: <RepositorySettings />,
          },
          {
            path: 'project',
            handle: { breadcrumb: '프로젝트 설정' },
            element: <DockerSettings />,
          },
        ],
      },
      {
        path: 'builds',
        element: <Outlet />, // 하위 라우트만 렌더링
        handle: { breadcrumb: '빌드 기록' },
        children: [
          {
            index: true,
            element: <BuildList />,
          },
          {
            path: ':buildId',
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
