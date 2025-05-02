interface DatabaseConfig {
  mysqlVersion: string;
  useRedis: boolean;
  useMySQL: boolean;
  mysqlRootPassword: string;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
}

interface BackendConfig {
  javaVersion: string;
  jenkinsfileProjectType: string;
  backendPort: number;
  backendDir: string;
  useMaven: boolean;
}

interface FrontendConfig {
  frontendPort: number;
  dockerfileFrontendType: string;
  frontendDir: string;
}

interface ProjectConfig {
  projectName: string;
  useNginx: boolean;
}

interface MattermostConfig {
  mattermostNotification: boolean;
  mattermostWebhookUrl: string;
  mattermostChannel: string;
}
