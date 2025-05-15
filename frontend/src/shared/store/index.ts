import { create } from 'zustand';
import { RepositoryConfig, BranchConfig } from '@/entities/repository/types';
import { ProjectConfig } from '@/entities/project/types';
import { BackendConfig } from '@/entities/backend/types';
import { FrontendConfig } from '@/entities/frontend/types';
import { DatabaseConfig } from '@/entities/database/types';

interface FormStore {
  projectConfig: ProjectConfig;
  setProjectConfig: (updater: Partial<ProjectConfig>) => void;

  repositoryConfig: RepositoryConfig;
  setRepositoryConfig: (updater: Partial<RepositoryConfig>) => void;

  backendConfig: BackendConfig;
  setBackendConfig: (updater: Partial<BackendConfig>) => void;

  frontendConfig: FrontendConfig;
  setFrontendConfig: (updater: Partial<FrontendConfig>) => void;

  databaseConfig: DatabaseConfig;
  setDatabaseConfig: (updater: Partial<DatabaseConfig>) => void;

  resetAll: () => void;
}

const defaultProject: ProjectConfig = {
  projectName: '',
  useNginx: false,
  useMaven: false,
  useMySQL: false,
  useRedis: false,
  useGradle: false,
};

const defaultRepository: RepositoryConfig = {
  gitRepositoryUrl: '',
  gitCredentialsId: '',
  gitToken: '',
  jenkinsfileBranchConfigs: [
    { branchName: '', buildEnabled: true, testEnabled: true, deployEnabled: true } as BranchConfig,
  ],
};

const defaultBackend: BackendConfig = {
  jenkinsfileProjectType: '',
  backendDir: '',
  useMaven: false,
  javaVersion: '',
  backendPort: 0,
};

const defaultFrontend: FrontendConfig = {
  frontendDir: '',
  dockerfileFrontendType: '',
  frontendPort: 0,
};

const defaultDatabase: DatabaseConfig = {
  useRedis: false,
  useMySQL: false,
  mysqlVersion: '',
  mysqlRootPassword: '',
  mysqlDatabase: '',
  mysqlUser: '',
  mysqlPassword: '',
};

export const useFormStore = create<FormStore>((set) => ({
  // 초기 상태
  projectConfig: defaultProject,
  repositoryConfig: defaultRepository,
  backendConfig: defaultBackend,
  frontendConfig: defaultFrontend,
  databaseConfig: defaultDatabase,

  // 업데이트 함수
  setProjectConfig: (updater) =>
    set((state) => ({
      projectConfig: { ...state.projectConfig, ...updater },
    })),

  setRepositoryConfig: (updater) =>
    set((state) => ({
      repositoryConfig: { ...state.repositoryConfig, ...updater },
    })),

  setBackendConfig: (updater) =>
    set((state) => ({
      backendConfig: { ...state.backendConfig, ...updater },
    })),

  setFrontendConfig: (updater) =>
    set((state) => ({
      frontendConfig: { ...state.frontendConfig, ...updater },
    })),

  setDatabaseConfig: (updater) =>
    set((state) => ({
      databaseConfig: { ...state.databaseConfig, ...updater },
    })),

  // 전체 리셋
  resetAll: () =>
    set(() => ({
      projectConfig: defaultProject,
      repositoryConfig: defaultRepository,
      backendConfig: defaultBackend,
      frontendConfig: defaultFrontend,
      databaseConfig: defaultDatabase,
    })),
}));
