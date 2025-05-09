export interface DatabaseConfig {
  mysqlVersion: string;
  useRedis: boolean;
  useMySQL: boolean;
  mysqlRootPassword: string;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
}
