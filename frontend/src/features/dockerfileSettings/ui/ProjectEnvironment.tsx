import { useFormStore } from '@/shared/store';
import React from 'react';

const ProjectEnvironment = () => {
  const { projectConfig, setProjectConfig } = useFormStore();

  // Gradle, Maven 선택 라디오 버튼 핸들러
  const handleBuildTool = (value: 'gradle' | 'maven') => {
    setProjectConfig({
      useGradle: value === 'gradle',
      useMaven: value === 'maven',
    });
  };

  // 나머지 체크박스 핸들러
  const handleCheckbox =
    (key: keyof typeof projectConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (key === 'useGradle' && e.target.checked) {
        // Gradle 선택하면 Maven 해제
        setProjectConfig({
          useGradle: true,
          useMaven: false,
        });
      } else if (key === 'useMaven' && e.target.checked) {
        // Maven 선택하면 Gradle 해제
        setProjectConfig({
          useGradle: false,
          useMaven: true,
        });
      } else {
        setProjectConfig({ [key]: e.target.checked });
      }
    };

  return (
    <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
      <p className="text-xl font-bold">프로젝트 환경 선택</p>

      {/* 빌드 도구 선택 (Gradle or Maven) */}
      <div className="mt-3 flex flex-col space-y-2">
        <p>Spring 빌드 환경</p>
        <div className="flex gap-20 pb-5">
          <div className="flex items-center space-x-2">
            <input
              id="gradle"
              type="radio"
              name="buildTool"
              className="cursor-pointer"
              checked={projectConfig.useGradle}
              onChange={() => handleBuildTool('gradle')}
            />
            <label htmlFor="gradle" className="cursor-pointer">
              Gradle
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="maven"
              type="radio"
              name="buildTool"
              className="cursor-pointer"
              checked={projectConfig.useMaven}
              onChange={() => handleBuildTool('maven')}
            />
            <label htmlFor="maven" className="cursor-pointer">
              Maven
            </label>
          </div>
        </div>

        <p>기타 환경</p>
        <div className="flex items-center space-x-2">
          <input
            id="nginx"
            type="checkbox"
            className="cursor-pointer"
            checked={projectConfig.useNginx}
            onChange={handleCheckbox('useNginx')}
          />
          <label htmlFor="nginx" className="cursor-pointer">
            Nginx
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="redis"
            type="checkbox"
            className="cursor-pointer"
            checked={projectConfig.useRedis}
            onChange={handleCheckbox('useRedis')}
          />
          <label htmlFor="redis" className="cursor-pointer">
            Redis
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="mysql"
            type="checkbox"
            className="cursor-pointer"
            checked={projectConfig.useMySQL}
            onChange={handleCheckbox('useMySQL')}
          />
          <label htmlFor="mysql" className="cursor-pointer">
            MySQL
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProjectEnvironment;
