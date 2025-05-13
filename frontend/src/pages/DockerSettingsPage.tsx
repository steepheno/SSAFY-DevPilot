import { useFormStore } from '@/shared/store';
import BuildInfo from '@/features/dockerfile-settings/ui/BuildInfo';
import { checkInpuValidation } from '@/features/dockerfile-settings/lib/checkInputValidation';
import ProjectEnvironment from '@/features/dockerfile-settings/ui/ProjectEnvironment';
import MySqlInfo from '@/features/dockerfile-settings/ui/MySqlInfo';
import DockerfileConfig from '@/entities/dockerFile/types';
import { generateDockerfile } from '@/entities/dockerFile/api';
import { useNavigate } from 'react-router-dom';

const DockerfileSettings = () => {
  // Navigate
  const navigate = useNavigate();

  const { projectConfig, frontendConfig, backendConfig, databaseConfig } = useFormStore();

  // 프로젝트 환경 체크박스 상태 관리
  // const projectEnvironment = useProjectEnvironment();

  // MySQL 설정 상태 관리

  // 로딩 상태 관리
  // const [isLoading, setIsLoading] = useState(false);

  // 응답 결과 상태 관리
  // const [, setResult] = useState<DockerSuccessResponse | null>(null);

  const buildDockerfile = async () => {
    // 빌드 정보 검증
    // if (!buildInfo.validateBuildInfo()) {
    //   return;
    // }

    // MySQL 설정 검증
    // if (!mySqlInfo.validateMySqlInfo()) {
    //   return;
    // }

    // API 요청 데이터 구성
    const dockerConfig: DockerfileConfig = {
      ...backendConfig,
      ...frontendConfig,
      ...projectConfig,
      ...databaseConfig,
    };

    console.log('API 요청 데이터: ', dockerConfig);

    try {
      // setIsLoading(true);

      // API 함수 호출
      const data = await generateDockerfile(dockerConfig);
      console.log('호출 직후 data: ', data);

      // 응답 결과 설정
      setResult(data);
      console.log('setResult 직후 data: ', data);

      navigate('/new/configure');
    } catch (error) {
      alert('Dockerfile 생성 중 오류 발생');
      console.error('오류 메시지: ', error);
    } finally {
      // setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h2>Dockerfile 설정</h2>

      {/* 빌드 정보 입력 */}
      <BuildInfo />

      {/* 프로젝트 환경 선택 */}
      <ProjectEnvironment />

      {/* MySQL 설정 */}
      <MySqlInfo mySqlInfo={mySqlInfo} />

      {/* 빌드 버튼 */}
      <div className="flex justify-center">
        <button
          className="rounded-[10px] bg-blue-500 px-4 py-2 text-white"
          onClick={() => checkInpuValidation({ backendConfig, frontendConfig })}

          // buildDockerfile(....)
          // disabled={isLoading}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default DockerfileSettings;
