import { useFormStore } from '@/shared/store';
import React from 'react';

const ProjectEnvironment = () => {
  const { projectConfig, setProjectConfig } = useFormStore();

  const handleCheckbox =
    (key: keyof typeof projectConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProjectConfig({ [key]: e.target.checked });
    };

  return (
    <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
      <p className="text-xl font-bold">프로젝트 환경 선택</p>
      <div className="mt-3 flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <input
            id="gradle"
            type="checkbox"
            className="cursor-pointer"
            checked={projectConfig.useGradle}
            onChange={handleCheckbox('useGradle')}
          />
          <label htmlFor="gradle" className="cursor-pointer">
            Gradle
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="maven"
            type="checkbox"
            className="cursor-pointer"
            checked={projectConfig.useMaven}
            onChange={handleCheckbox('useMaven')}
          />
          <label htmlFor="maven" className="cursor-pointer">
            Maven
          </label>
        </div>

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
