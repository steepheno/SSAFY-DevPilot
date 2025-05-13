import { useFormStore } from '@/shared/store';

const ProjectEnvironment = () => {
  const { projectConfig, setProjectConfig } = useFormStore();

  return (
    <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
      <p className="text-xl font-bold">프로젝트 환경 선택</p>
      <div className="mt-3 flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <input
            className="cursor-pointer"
            type="checkbox"
            id="gradle"
            checked={projectConfig.useGradle}
            onChange={(prev) => setProjectConfig({ useGradle: !prev })}
          />
          <label className="cursor-pointer" htmlFor="gradle">
            Gradle
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="cursor-pointer"
            type="checkbox"
            id="maven"
            checked={projectConfig.useMaven}
            onChange={(prev) => setProjectConfig({ useMaven: !prev })}
          />
          <label className="cursor-pointer" htmlFor="maven">
            Maven
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="cursor-pointer"
            type="checkbox"
            id="nginx"
            checked={projectConfig.useNginx}
            onChange={(prev) => setProjectConfig({ useNginx: !prev })}
          />
          <label className="cursor-pointer" htmlFor="nginx">
            Nginx
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="cursor-pointer"
            type="checkbox"
            id="redis"
            checked={projectConfig.useRedis}
            onChange={(prev) => setProjectConfig({ useRedis: !prev })}
          />
          <label className="cursor-pointer" htmlFor="redis">
            Redis
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="cursor-pointer"
            type="checkbox"
            id="MySQL"
            checked={projectConfig.useMySQL}
            onChange={(prev) => setProjectConfig({ useMySQL: !prev })}
          />
          <label className="cursor-pointer" htmlFor="MySQL">
            MySQL
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProjectEnvironment;
