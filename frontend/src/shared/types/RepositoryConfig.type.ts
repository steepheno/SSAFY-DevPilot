interface RepositoryConfig {
  gitRepositoryUrl: string;
  gitCredentialsId: string;
  jenkinsfileBranchConfigs: BranchConfig[];
}

interface BranchConfig {
  branchName: string;
  buildEnabled: boolean;
  testEnabled: boolean;
  deployEnabled: boolean;
}
