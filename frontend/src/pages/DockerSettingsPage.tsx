import { useState } from 'react';
import BuildInfo from '@/features/dockerfile-settings/ui/BuildInfo';
import ProjectEnvironment from '@/features/dockerfile-settings/ui/ProjectEnvironment';
import MySqlInfo from '@/features/dockerfile-settings/ui/MySqlInfo';
import DockerfileConfig from '@/entities/dockerFile/types';
import { useBuildInfo } from '@/entities/dockerFile/model/useBuildInfo';
import { useProjectEnvironment } from '@/entities/dockerFile/model/useProjectEnvironment';
import { useMySqlInfo } from '@/entities/dockerFile/model/useMySqlInfo';
import { generateDockerfile } from '@/entities/dockerFile/api';
import { DockerSuccessResponse } from '@/entities/dockerFile/api';

const DockerfileSettings = () => {
  // 프로젝트 제목 상태 관리
  const [projectName, setProjectName] = useState('');

  // 빌드 정보 상태 관리
  const buildInfo = useBuildInfo();

  // 프로젝트 환경 체크박스 상태 관리
  const projectEnvironment = useProjectEnvironment();

  // MySQL 설정 상태 관리
  const mySqlInfo = useMySqlInfo();

  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);

  // 응답 결과 상태 관리
  const [result, setResult] = useState<DockerSuccessResponse | null>(null);

  const buildDockerfile = async () => {
    // 프로젝트 제목 검증
    if (!projectName) {
      alert('프로젝트 이름을 입력해주세요.');
      return;
    }

    // 빌드 정보 검증
    if (!buildInfo.validateBuildInfo()) {
      return;
    }

    // MySQL 설정 검증
    if (!mySqlInfo.validateMySqlInfo()) {
      return;
    }

    // API 요청 데이터 구성
    const dockerConfig: DockerfileConfig = {
      projectName,
      ...buildInfo.getBuildInfoConfig(),
      ...projectEnvironment.getProjectEnvironmentConfig(),
      ...mySqlInfo.getMySqlInfoConfig(),
    };

    try {
      setIsLoading(true);

      // API 함수 호출
      const data = await generateDockerfile(dockerConfig);
      console.log(data);
      console.log(result); // 응답 결과 확인 (미사용 에러 제거용)

      // 응답 결과 설정
      setResult(data);

      alert('Dockerfile이 성공적으로 생성되었습니다.');
    } catch (error) {
      alert('Dockerfile 생성 중 오류 발생');
      console.error('오류 메시지: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-10 py-10">
      {/* 프로젝트 이름 입력 */}
      <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
        <p className="text-body font-bold">프로젝트 이름</p>
        <input
          className="mt-3 h-[30px] rounded border px-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* 빌드 정보 입력 */}
      <BuildInfo buildInfo={buildInfo} />

      {/* 프로젝트 환경 선택 */}
      <ProjectEnvironment projectEnvironment={projectEnvironment} />

      {/* MySQL 설정 */}
      <MySqlInfo mySqlInfo={mySqlInfo} />

      {/* 빌드 버튼 */}
      <div className="flex justify-center">
        <button
          className="rounded-[10px] bg-blue-500 px-4 py-2 text-white"
          onClick={buildDockerfile}
          disabled={isLoading}
        >
          {isLoading ? '빌드 중...' : '빌드하기'}
        </button>
      </div>
    </div>
  );
};

export default DockerfileSettings;
