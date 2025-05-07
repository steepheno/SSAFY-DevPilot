export interface RepositoryConfig {
  gitRepositoryUrl: string;
  gitCredentialsId: string;
  jenkinsfileBranchConfigs: BranchConfig[];
}

export interface BranchConfig {
  branchName: string;
  buildEnabled: boolean;
  testEnabled: boolean;
  deployEnabled: boolean;
}
