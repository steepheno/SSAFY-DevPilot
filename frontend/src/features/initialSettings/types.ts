export interface InitialSettings {
  pemPath: string;
  ec2Host: string;
  jenkinsPassword: string;
}

export interface InitialSettingsStatus {
  initialized: boolean;
}
