export interface JenkinsConfig {
  jenkinsfileProjectType: string;
  projectName: string;
  gitRepositoryUrl: string;
  gitCredentialsId: string;
  jenkinsfileBranchConfigs: BranchConfig[];
  frontendDir: string;
  backendDir: string;
  mattermostNotification: boolean;
  mattermostWebhookUrl: string;
  mattermostChannel: string;
  javaVersion: string;
}

interface BranchConfig {
  branchName: string;
  buildEnabled: boolean;
  testEnabled: boolean;
  deployEnabled: boolean;
}
