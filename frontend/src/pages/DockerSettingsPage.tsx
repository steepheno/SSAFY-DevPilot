import { useNavigate } from 'react-router-dom';
import { useFormStore } from '@/shared/store';
import BuildInfo from '@/features/dockerfileSettings/ui/BuildInfo.tsx';
import ProjectEnvironment from '@/features/dockerfileSettings/ui/ProjectEnvironment.tsx';
import MySqlInfo from '@/features/dockerfileSettings/ui/MySqlInfo.tsx';
import ProjectNameInput from './newBuildPage/ui/ProjectNameInput';

const DockerfileSettings = () => {
  // Navigate
  const navigate = useNavigate();

  const goToCheck = () => {
    navigate('/new/check');
  };

  const { projectConfig } = useFormStore();

  return (
    <div>
      <ProjectNameInput />

      {/* 빌드 정보 입력 */}
      <BuildInfo />

      {/* 프로젝트 환경 선택 */}
      <ProjectEnvironment />

      {/* MySQL 설정 */}
      {projectConfig.useMySQL && <MySqlInfo />}

      {/* 빌드 버튼 */}
      <div className="flex justify-center">
        <button className="rounded-[10px] bg-blue-500 px-4 py-2 text-white" onClick={goToCheck}>
          다음
        </button>
      </div>
    </div>
  );
};

export default DockerfileSettings;
