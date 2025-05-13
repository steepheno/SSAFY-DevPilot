export interface DatabaseConfig {
  useRedis: boolean;

  useMySQL: boolean;
  mysqlVersion: string;
  mysqlRootPassword: string;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
}
