export interface RepositoryConfig {
  gitToken: string; // 프로젝트에서 발행하는 Gitlab 토큰값
  gitCredentialsId: string; // 프로젝트에서 발행한 토큰 이름
  gitPersonalToken: string; // 개인 계정 토큰값
  gitPersonalCredentialsId: string; // 개인 계정 토큰 이름
  gitUserName: string; // 사용자 Git 아이디
  gitRepoUrl: string; // 원격 저장소 주소
  jenkinsfileBranchConfigs: BranchConfig[];
}

export interface BranchConfig {
  branchName: string;
  buildEnabled: boolean;
  testEnabled: boolean;
  deployEnabled: boolean;
}
