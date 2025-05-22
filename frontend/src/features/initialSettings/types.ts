export interface InitialSettings {
  pemPath: string;
  ec2Host: string;
  jenkinsPort: string;
  jenkinsPassword: string;
  configDir: string;
  localFrontDir: string;
  localBackendDir: string;
}

export interface InitialSettingsStatus {
  initialized: boolean;
  configDir: string;
}
