interface JenkinsConfig {
  jenkinsfileProjectType: string;
  projectName: string;
  gitRepositoryUrl: string;
  gitCredentialsId: string;
  jenkinsfileBranchConfigs: [
    {
      branchName: string;
      buildEnabled: boolean;
      testEnabled: boolean;
      deployEnabled: boolean;
    },
  ];
  frontendDir: string;
  backendDir: string;
  mattermostNotification: boolean;
  mattermostWebhookUrl: string;
  mattermostChannel: string;
  javaVersion: string;
}
