import { generateJenkinsFile } from '@/entities/jenkins/api/generateJenkinsfile';
import { JenkinsConfig } from '@/entities/jenkins/types';
import { useFormStore } from '@/shared/store';
import { useState } from 'react';

const InputCheck = () => {
  const { projectConfig, repositoryConfig, backendConfig, frontendConfig, databaseConfig } =
    useFormStore();
  const [isLoading, setIsLoading] = useState(false);

  // 브랜치 이름 목록 추출
  const branchNames = repositoryConfig.jenkinsfileBranchConfigs
    .map((config) => config.branchName)
    .filter((name) => name)
    .join(', ');

  // API 요청 핸들러
  const handleGenerateFile = async () => {
    try {
      setIsLoading(true);

      // FormStore의 데이터를 JenkinsConfig 형식으로 변환
      const jenkinsConfig: JenkinsConfig = {
        jenkinsfileProjectType: projectConfig.useMaven ? 'JAVA_SPRING_MAVEN' : 'JAVA_SPRING_GRADLE',
        projectName: projectConfig.projectName,
        gitRepositoryUrl: repositoryConfig.gitRepoUrl,
        gitCredentialsId: repositoryConfig.gitCredentialsId,
        jenkinsfileBranchConfigs: repositoryConfig.jenkinsfileBranchConfigs,
        frontendDir: frontendConfig.frontendDir,
        backendDir: backendConfig.backendDir,
        mattermostNotification: true, // 필요에 따라 조정
        mattermostWebhookUrl: '', // 필요에 따라 조정
        mattermostChannel: '', // 필요에 따라 조정
        javaVersion: backendConfig.javaVersion,
      };

      // API 요청 보내기
      const response = await generateJenkinsFile(jenkinsConfig);
      console.log('Jenkins 파일 생성 성공: ', response);
    } catch (error) {
      console.error('Jenkins 파일 생성 실패: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pr-10">
      {/* 프로젝트 이름 */}
      <div className="my-10 flex gap-5">
        <h2>프로젝트 이름 : </h2>
        <p className="text-body">{projectConfig.projectName}</p>
      </div>

      {/* Git 정보 */}
      <h2>Git 정보</h2>
      <div className="mb-10 mt-5 rounded-[10px] bg-gray-100 px-5 py-5">
        <div className="flex gap-20">
          {/* 아이디 */}
          <div className="mr-20 flex gap-3">
            <p className="text-bodysmall font-bold">사용자 ID : </p>
            <p>{repositoryConfig.gitUserName}</p>
          </div>

          {/* 저장소 주소 */}
          <div className="flex gap-3">
            <p className="text-bodysmall font-bold">Git 주소 :</p>
            <p>{repositoryConfig.gitRepoUrl}</p>
          </div>

          {/* 빌드 브랜치 */}
          <div className="flex gap-3">
            <p className="ml-10 text-bodysmall font-bold">빌드 브랜치 :</p>
            <p>{branchNames}</p>
          </div>
        </div>

        {/* 프로젝트 Git */}
        <div className="mt-5 flex gap-20">
          <div className="flex gap-2">
            <p className="font-bold">프로젝트 Git 토큰 이름 :</p>
            <p>{repositoryConfig.gitCredentialsId}</p>
          </div>
          <div className="flex gap-3">
            <p className="font-bold">프로젝트 Git 토큰값 : </p>
            <p>{repositoryConfig.gitToken}</p>
          </div>
        </div>

        {/* 개인 Git 정보 */}
        <div className="mt-5 flex gap-20">
          <div className="flex gap-2">
            <p className="font-bold">개인 Git 토큰 이름 :</p>
            <p>{repositoryConfig.gitPersonalCredentialsId}</p>
          </div>
          <div className="ml-4 flex gap-3">
            <p className="ml-3 font-bold">개인 Git 토큰값 : </p>
            <p>{repositoryConfig.gitPersonalToken}</p>
          </div>
        </div>
      </div>

      {/* 빌드 정보 */}
      <h2>빌드 정보</h2>
      <div className="mb-10 mt-5 rounded-[10px] bg-gray-100 px-5 py-5">
        <div className="mb-8">
          <h3>백엔드</h3>
          <div className="mt-3 flex gap-20">
            {/* 폴더명 */}
            <div className="mr-20 flex gap-3">
              <p className="ml-1 text-bodysmall font-bold">폴더명 : </p>
              <p>{backendConfig.backendDir}</p>
            </div>

            {/* 포트번호 */}
            <div className="mr-10 flex gap-3">
              <p className="text-bodysmall font-bold">포트번호 :</p>
              <p>{backendConfig.backendPort}</p>
            </div>

            {/* Java 버전 */}
            <div className="flex gap-3">
              <p className="ml-10 text-bodysmall font-bold">Java 버전 :</p>
              <p>JDK {backendConfig.javaVersion}</p>
            </div>
          </div>
        </div>

        <div>
          <h3>프론트엔드</h3>
          <div className="mt-3 flex gap-20">
            {/* 폴더명 */}
            <div className="mr-20 flex gap-3">
              <p className="text-bodysmall font-bold">폴더명 : </p>
              <p>{frontendConfig.frontendDir}</p>
            </div>

            {/* 포트번호 */}
            <div className="mr-10 flex gap-3">
              <p className="text-bodysmall font-bold">포트번호 :</p>
              <p>{frontendConfig.frontendPort}</p>
            </div>

            {/* 프로젝트 환경 */}
            <div className="flex gap-3">
              <p className="ml-10 text-bodysmall font-bold">프로젝트 환경 :</p>
              <p>{frontendConfig.dockerfileFrontendType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 프로젝트 환경 */}
      <div className="my-10">
        <h2>프로젝트 환경</h2>
        <div className="mb-10 mt-5 rounded-[10px] bg-gray-100 px-5 py-5">
          <div className="mb-3 flex gap-3">
            <p className="text-bodysmall font-bold">Spring 빌드 환경 : </p>
            <p>{projectConfig.useMaven ? 'Maven' : 'Gradle'}</p>
          </div>
          <div className="flex gap-3">
            <p className="text-bodysmall font-bold">추가 사용 환경 : </p>
            {/* 여러 개 선택하면 ,로 구분 */}
            {[
              projectConfig.useNginx && 'Nginx',
              projectConfig.useMySQL && 'MySQL',
              projectConfig.useRedis && 'Redis',
            ]
              .filter(Boolean)
              .join(', ')}
          </div>

          {/* MySQL 정보 - 조건부 렌더링 */}
          {projectConfig.useMySQL && (
            <>
              <p className="mt-5 text-bodysmall font-bold">MySQL 정보</p>
              <div className="mt-3 flex gap-20">
                {/* 버전 정보 */}
                <div className="mr-20 flex gap-3">
                  <p className="text-bodysmall font-bold">버전 : </p>
                  <p>{databaseConfig.mysqlVersion}</p>
                </div>

                {/* Root 비밀번호 */}
                <div className="mr-10 flex gap-3">
                  <p className="text-bodysmall font-bold">Root 비밀번호 :</p>
                  <p>{databaseConfig.mysqlRootPassword}</p>
                </div>

                {/* Database 이름 */}
                <div className="flex gap-3">
                  <p className="ml-10 text-bodysmall font-bold">Database 이름 :</p>
                  <p>{databaseConfig.mysqlDatabase}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-20">
                {/* 사용자 이름 */}
                <div className="flex gap-3">
                  <p className="text-bodysmall font-bold">사용자 이름 :</p>
                  <p>{databaseConfig.mysqlUser}</p>
                </div>

                {/* 비밀번호 */}
                <div className="flex gap-3">
                  <p className="ml-3 text-bodysmall font-bold">비밀번호 :</p>
                  <p>{databaseConfig.mysqlPassword}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center">
        <button
          className="rounded-[10px] bg-blue-500 px-4 py-2 text-white"
          onClick={handleGenerateFile}
          disabled={isLoading}
        >
          파일 생성
        </button>
      </div>
    </div>
  );
};

export default InputCheck;
