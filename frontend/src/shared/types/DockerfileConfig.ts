interface DockerfileConfig {
  projectName: string;
  backendDir: string;
  frontendDir: string;
  useMaven: boolean;
  javaVersion: string;
  backendPort: number;
  dockerfileFrontendType: string;
  frontendPort: number;
  useNginx: boolean;
  useRedis: boolean;
  useMySQL: boolean;
  mysqlVersion: string;
  mysqlRootPassword: string;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
}

export default DockerfileConfig;
