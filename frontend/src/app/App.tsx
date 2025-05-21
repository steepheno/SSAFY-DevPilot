import './styles/App.css';

import { createHashRouter, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/features/login/ui/ProtectedRoute';
import PublicRoute from '@/features/login/ui/PublicRoute';
import InitRoute from '@/features/login/ui/InitRoute';

import PageLayout from '@/widgets/PageLayout';
import BuildFormLayout from '@/widgets/BuildFormLayout';
import {
  LoginPage,
  InitialPage,
  MainPage,
  DockerSettings,
  BuildInfoPage,
  BuildLogPage,
  RepositorySettingsPage,
  NotFoundPage,
  PreferencesPage,
  InputCheck,
} from '@/pages';
import BuildList from '@/pages/buildLog/ui/BuildList';
import BuildDetail from '@/pages/buildLog/ui/BuildDetail';
import { useQueryClient } from '@tanstack/react-query';

const Router = createHashRouter([
  {
    path: '/login',
    children: [
      {
        path: '',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: 'new',
        element: (
          <InitRoute>
            <InitialPage />
          </InitRoute>
        ),
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <PageLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        handle: { breadcrumb: '홈' },
        element: <MainPage />,
      },
      {
        path: 'new',
        handle: { breadcrumb: '새 빌드' },
        element: <BuildFormLayout />,
        children: [
          {
            index: true,
            path: 'repository',
            handle: { breadcrumb: 'Git 설정', buildStep: 1, title: '저장소 설정' },
            element: <RepositorySettingsPage />,
          },
          {
            path: 'project',
            handle: { breadcrumb: '빌드 파일 생성', buildStep: 2, title: '빌드 파일 생성' },
            element: <DockerSettings />,
          },
          {
            path: 'check',
            handle: { breadcrumb: '입력값 확인', buildStep: 3, title: '입력값 확인' },
            element: <InputCheck />,
          },
        ],
      },
      {
        path: 'builds',
        element: <Outlet />, // 하위 라우트만 렌더
        handle: { breadcrumb: '빌드 기록' },
        children: [
          { index: true, element: <BuildList /> },
          { path: ':buildId', element: <BuildInfoPage /> },
          {
            path: ':buildId/detail',
            element: <BuildDetail />,
            handle: { breadcrumb: '빌드 상세' },
          },
          { path: ':buildId/log', element: <BuildLogPage />, handle: { breadcrumb: '빌드 로그' } },
        ],
      },

      {
        path: 'preferences',
        handle: { breadcrumb: '설정', title: '설정' },
        element: <PreferencesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default Router;
