import { JenkinsConfig } from '@/entities/jenkins/types';
import { DockerConfig } from '@/entities/dockerFile/types/DockerConfig';
import { generateJenkinsFile } from '@/entities/jenkins/api/generateJenkinsfile';
import { generateDockerfile } from '@/entities/dockerFile/model/generateDockerfile';
import { useFormStore } from '@/shared/store';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const InputCheck = () => {
  const { projectConfig, repositoryConfig, backendConfig, frontendConfig, databaseConfig } =
    useFormStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 브랜치 이름 목록 추출
  const branchNames = repositoryConfig.jenkinsfileBranchConfigs
    .map((config) => config.branchName)
    .filter((name) => name)
    .join(', ');

  // API 요청 핸들러
  const generateFile = async () => {
    setIsLoading(true);

    try {
      /* 1. Jenkins 파일 생성 API 요청 */
      try {
        // FormStore의 데이터를 JenkinsConfig 형식으로 변환
        const jenkinsConfig: JenkinsConfig = {
          jenkinsfileProjectType: projectConfig.useMaven
            ? 'JAVA_SPRING_MAVEN'
            : 'JAVA_SPRING_GRADLE',
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

        // Jenkins 파일 API 요청 보내기
        const response = await generateJenkinsFile(jenkinsConfig);
        console.log('Jenkins 파일 생성 완료: ', response);
      } catch (error) {
        console.error('Jenkins 파일 생성 실패: ', error);
        // Jenkins 생성 실패 시 전체 프로세스 중단
        throw new Error('Jenkins 파일 생성에 실패했습니다. Docker 파일 생성을 진행할 수 없습니다.');
      }

      /* 2. Dockerfile 생성 API 요청 */
      try {
        const dockerConfig: DockerConfig = {
          projectName: projectConfig.projectName,
          backendDir: backendConfig.backendDir,
          frontendDir: frontendConfig.frontendDir,
          useMaven: projectConfig.useMaven,
          javaVersion: backendConfig.javaVersion,
          backendPort: backendConfig.backendPort,
          dockerfileFrontendType: frontendConfig.dockerfileFrontendType,
          frontendPort: frontendConfig.frontendPort,
          useNginx: projectConfig.useNginx,
          useRedis: projectConfig.useRedis,
          useMySQL: projectConfig.useMySQL,
          mysqlVersion: databaseConfig.mysqlVersion,
          mysqlRootPassword: databaseConfig.mysqlRootPassword,
          mysqlDatabase: databaseConfig.mysqlDatabase,
          mysqlUser: databaseConfig.mysqlUser,
          mysqlPassword: databaseConfig.mysqlPassword,
        };

        // Docker API 요청 보내기
        const dockerResponse = await generateDockerfile(dockerConfig);
        console.log('Docker 파일 생성 완료: ', dockerResponse);
      } catch (error) {
        console.error('Docker 파일 생성 실패: ', error);
        throw new Error('Docker 파일 생성에 실패했습니다.');
      }

      // 모든 파일 생성이 성공한 경우
      alert('Jenkins 파일과 Docker 파일이 생성되었습니다.');
      navigate(`/builds/${projectConfig.projectName}`);
    } catch (error) {
      // 전체 프로세스 중 발생한 오류 처리
      console.error('파일 생성 중 오류 발생: ', error);
      alert(error instanceof Error ? error.message : '파일 생성 중 오류가 발생했습니다.');
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
        <div className="flex justify-between">
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
          <div className="mr-3 flex gap-2">
            <p className="font-bold">프로젝트 Git 토큰 이름 :</p>
            <p>{repositoryConfig.gitCredentialsId}</p>
          </div>
          <div className="ml-10 flex gap-3">
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
          <div className="ml-2 flex gap-3">
            <p className="font-bold">개인 Git 토큰값 : </p>
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
            <div className="mr-20 flex gap-2">
              <p className="ml-1 text-bodysmall font-bold">폴더명 : </p>
              <p>{backendConfig.backendDir}</p>
            </div>

            {/* 포트번호 */}
            <div className="ml-20 mr-10 flex gap-2">
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
            <div className="mr-2 flex gap-3">
              <p className="text-bodysmall font-bold">폴더명 : </p>
              <p>{frontendConfig.frontendDir}</p>
            </div>

            {/* 포트번호 */}
            <div className="ml-20 mr-10 flex gap-2">
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
              <div className="mt-3 flex justify-between gap-20">
                {/* 버전 정보 */}
                <div className="flex gap-3">
                  <p className="text-bodysmall font-bold">버전 : </p>
                  <p>{databaseConfig.mysqlVersion}</p>
                </div>

                {/* Root 비밀번호 */}
                <div className="flex gap-3">
                  <p className="text-bodysmall font-bold">Root 비밀번호 :</p>
                  <p>{databaseConfig.mysqlRootPassword}</p>
                </div>

                {/* Database 이름 */}
                <div className="mr-10 flex gap-3">
                  <p className="ml-10 text-bodysmall font-bold">Database 이름 :</p>
                  <p>{databaseConfig.mysqlDatabase}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-20">
                {/* 사용자 이름 */}
                <div className="mr-20 flex gap-3">
                  <p className="text-bodysmall font-bold">사용자 이름 :</p>
                  <p>{databaseConfig.mysqlUser}</p>
                </div>

                {/* 비밀번호 */}
                <div className="ml-20 flex gap-3">
                  <p className="ml-2 text-bodysmall font-bold">비밀번호 :</p>
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
          onClick={generateFile}
          disabled={isLoading}
        >
          {isLoading ? '생성 중...' : '파일 생성'}
        </button>
      </div>
    </div>
  );
};

export default InputCheck;
