export interface DatabaseConfig {
  mysqlVersion: string;
  useRedis: boolean;
  useMySQL: boolean;
  mysqlRootPassword: string;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
}

export interface BackendConfig {
  javaVersion: string;
  jenkinsfileProjectType: string;
  backendPort: number;
  backendDir: string;
  useMaven: boolean;
}

export interface FrontendConfig {
  frontendPort: number;
  dockerfileFrontendType: string;
  frontendDir: string;
}

export interface ProjectConfig {
  projectName: string;
  useNginx: boolean;
}

export interface MattermostConfig {
  mattermostNotification: boolean;
  mattermostWebhookUrl: string;
  mattermostChannel: string;
}
