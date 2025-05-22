// import CheckboxGroup from '@/widgets/checkbox/ui/CheckboxGroup';
import type { CheckboxOption } from '@/widgets/checkbox/ui/CheckboxGroup.tsx';

interface ProjectStructure {
  directory: string;
  portNo: string;
  selected: Record<string, boolean>;
}

interface SectionFormProps<T extends ProjectStructure> {
  title: string;
  options: CheckboxOption[];
  data: T;
  onChange: (newData: T) => void;
  extraFields?: React.ReactNode;
}

export interface BuildScriptFormData {
  frontend: ProjectStructure;
  backend: ProjectStructure & { javaVersion: string };
  projectEnvironments: Record<string, boolean>;
}

export interface BuildScriptFormProps {
  formData: BuildScriptFormData;
  setFormData: (value: BuildScriptFormData) => void;
}

const SectionForm = <T extends ProjectStructure>({
  title,
  // options,
  data,
  onChange,
  extraFields,
}: SectionFormProps<T>) => (
  <section className="mb-8">
    <span className="mb-2 text-xl font-bold">{title}</span>
    {/* <CheckboxGroup options={options} onChange={(selected) => onChange({ ...data, selected })} /> */}
    <div className="mt-2 flex space-x-8">
      <div className="flex items-center space-x-2">
        <p>경로</p>
        <input
          required
          value={data.directory}
          onChange={(e) => onChange({ ...data, directory: e.target.value })}
          className="h-[25px] rounded border px-2"
        />
      </div>
      <div className="flex items-center space-x-2">
        <p>포트번호</p>
        <input
          required
          value={data.portNo}
          type="number"
          min="0"
          onChange={(e) => onChange({ ...data, portNo: e.target.value })}
          className="h-[25px] rounded border px-2"
        />
      </div>
    </div>
    {extraFields && <div className="mt-2">{extraFields}</div>}
  </section>
);

const EnvironmentSelector = ({
  environments,
  onChange,
}: {
  environments: Record<string, boolean>;
  onChange: (newEnvs: Record<string, boolean>) => void;
}) => {
  const envList = ['gradle', 'maven', 'nginx', 'redis', 'mysql'] as const;
  return (
    <div className="mt-3 flex flex-col space-y-2">
      {envList.map((env) => (
        <label key={env} className="flex items-center space-x-2 capitalize">
          <input
            type="checkbox"
            checked={environments[env]}
            onChange={(e) => onChange({ ...environments, [env]: e.target.checked })}
            className="cursor-pointer"
          />
          <span>{env}</span>
        </label>
      ))}
    </div>
  );
};

export const BuildScriptForm = ({ formData, setFormData }: BuildScriptFormProps) => {
  // 공통 업데이트 헬퍼
  const updateSection = <K extends keyof BuildScriptFormData>(
    section: K,
    data: BuildScriptFormData[K],
  ) => {
    setFormData({ ...formData, [section]: data });
  };

  const frontendOptions: CheckboxOption[] = [
    { id: 'frontend-react', label: 'React' },
    { id: 'frontend-vue', label: 'Vue' },
    { id: 'frontend-nextjs', label: 'Next.js' },
  ];

  const backendOptions: CheckboxOption[] = [
    { id: 'backend-spring', label: 'Spring' },
    { id: 'backend-nodejs', label: 'Node.js' },
    { id: 'backend-django', label: 'Django' },
    { id: 'backend-fastapi', label: 'FastApi' },
  ];

  return (
    <>
      {/* 프론트엔드 */}
      <SectionForm
        title="FrontEnd"
        options={frontendOptions}
        data={formData.frontend}
        onChange={(data) => updateSection('frontend', data)}
      />

      {/* 백엔드 */}
      <SectionForm
        title="BackEnd"
        options={backendOptions}
        data={formData.backend}
        onChange={(data) => updateSection('backend', data)}
        extraFields={
          <div className="flex items-center space-x-2">
            <p>Java 버전</p>
            <select
              value={formData.backend.javaVersion}
              onChange={(e) =>
                updateSection('backend', {
                  ...formData.backend,
                  javaVersion: e.target.value,
                })
              }
              className="h-[25px] rounded border px-2"
            >
              <option value="">선택하세요</option>
              <option value="8">JDK 8</option>
              <option value="11">JDK 11</option>
              <option value="17">JDK 17</option>
              <option value="21">JDK 21</option>
            </select>
          </div>
        }
      />

      {/* 프로젝트 환경 선택 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 환경 선택</p>
        <EnvironmentSelector
          environments={formData.projectEnvironments}
          onChange={(envs) => setFormData({ ...formData, projectEnvironments: envs })}
        />
      </div>
    </>
  );
};

export default BuildScriptForm;
