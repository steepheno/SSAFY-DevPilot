export interface InitialSettings {
  pemPath: string;
  ec2Host: string;
  jenkinsPort: string;
  jenkinsPassword: string;
  configDir: string;
}

export interface InitialSettingsStatus {
  initialized: boolean;
  configDir: string;
}
