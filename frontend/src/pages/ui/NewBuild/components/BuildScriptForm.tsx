import CheckboxGroup, { CheckboxOption } from './CheckboxGroup';

interface ProjectStructure {
  directory: string;
  portNo: string;
  selected: Record<string, boolean>;
}

export interface ScriptFormData {
  frontend: ProjectStructure;
  backend: ProjectStructure & { javaVersion: string };
  projectEnvironments: Record<string, boolean>;
}

export interface BuildScriptFormProps {
  formData: ScriptFormData;
  setFormData: (value: ScriptFormData) => void;
}

export const BuildScriptForm = ({ formData, setFormData }: BuildScriptFormProps) => {
  // 프론트엔드 선택 항목
  const frontendOptions: CheckboxOption[] = [
    { id: 'frontend-react', label: 'React' },
    { id: 'frontend-vue', label: 'Vue' },
    { id: 'frontend-nextjs', label: 'Next.js' },
  ];

  // 백엔드 선택 항목
  const backendOptions: CheckboxOption[] = [
    { id: 'backend-spring', label: 'Spring' },
    { id: 'backend-nodejs', label: 'Node.js' },
    { id: 'backend-django', label: 'Django' },
    { id: 'backend-fastapi', label: 'FastApi' },
  ];

  // 프론트엔드 선택 상태 업데이트
  const frontendChange = (selected: Record<string, boolean>) => {
    setFormData({
      ...formData,
      frontend: {
        ...formData.frontend,
        selected,
      },
    });
  };

  // 백엔드 선택 상태 업데이트
  const backendChange = (selected: Record<string, boolean>) => {
    setFormData({
      ...formData,
      backend: {
        ...formData.backend,
        selected,
      },
    });
  };

  // console.log(formData); // 추후 백엔드와 연결할 때 사용됨 (빌드 테스트를 위해 일단은 console.log로 적어둠)

  return (
    <div className="content-container">
      <div className="mt-5">
        <h3 className="text-2xl font-bold">FrontEnd</h3>
      </div>
      <CheckboxGroup options={frontendOptions} onChange={frontendChange} />
      <div className="mt-2 flex">
        <div className="flex">
          <p>폴더명</p>
          <input
            value={formData.frontend.directory}
            onChange={(e) =>
              setFormData({
                ...formData,
                frontend: {
                  ...formData.frontend,
                  directory: e.target.value,
                },
              })
            }
            className="ml-5 h-[25px] rounded border px-2"
          />
        </div>
        <div className="flex">
          <p>포트번호</p>
          <input
            value={formData.frontend.portNo}
            onChange={(e) =>
              setFormData({
                ...formData,
                frontend: {
                  ...formData.frontend,
                  portNo: e.target.value,
                },
              })
            }
            className="ml-5 h-[25px] rounded border px-2"
          />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-2xl font-bold">BackEnd</h3>
      </div>
      <CheckboxGroup options={backendOptions} onChange={backendChange} />

      <div className="mt-2 flex">
        <div className="flex">
          <p>폴더명</p>
          <input
            value={formData.backend.directory}
            onChange={(e) =>
              setFormData({
                ...formData,
                backend: {
                  ...formData.backend,
                  directory: e.target.value,
                },
              })
            }
            className="ml-5 h-[25px] rounded border px-2"
          />
        </div>
        <div className="flex">
          <p>포트번호</p>
          <input
            value={formData.backend.portNo}
            onChange={(e) =>
              setFormData({
                ...formData,
                backend: {
                  ...formData.backend,
                  portNo: e.target.value,
                },
              })
            }
            className="ml-5 h-[25px] rounded border px-2"
          />
        </div>
      </div>

      {/* 프로젝트 환경 선택 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 환경 선택</p>
        <div className="mt-3 flex flex-col space-y-2">
          {['gradle', 'maven', 'nginx', 'redis', 'mysql'].map((env) => (
            <div key={env} className="flex items-center space-x-2">
              <input
                id={env}
                type="checkbox"
                className="cursor-pointer"
                checked={formData.projectEnvironments[env]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectEnvironments: {
                      ...formData.projectEnvironments,
                      [env]: e.target.checked,
                    },
                  })
                }
              />
              <label className="cursor-pointer capitalize" htmlFor={env}>
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </label>
            </div>
          ))}
        </div>

        <div className="flex">
          <p>Java 버전</p>
          <select
            className="ml-5 h-[25px] rounded border px-2"
            value={formData.backend.javaVersion}
            onChange={(e) =>
              setFormData({
                ...formData,
                backend: {
                  ...formData.backend,
                  javaVersion: e.target.value,
                },
              })
            }
          >
            <option value="">선택하세요</option>
            <option value="8">JDK 8</option>
            <option value="11">JDK 11</option>
            <option value="17">JDK 17</option>
            <option value="21">JDK 21</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BuildScriptForm;
