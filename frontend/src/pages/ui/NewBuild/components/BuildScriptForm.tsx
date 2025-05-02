import CheckboxGroup, { CheckboxOption } from './CheckboxGroup';

export interface ScriptFormData {
  frontend: Record<string, boolean>;
  backend: Record<string, boolean>;
}

export interface BuildScriptFormProps {
  formData: ScriptFormData;
  setFormData: (value: ScriptFormData) => void;
}

const BuildScriptForm = ({ formData, setFormData }: BuildScriptFormProps) => {
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
      frontend: selected,
    });
  };

  // 백엔드 선택 상태 업데이트
  const backendChange = (selected: Record<string, boolean>) => {
    setFormData({
      ...formData,
      backend: selected,
    });
  };

  // console.log(formData); // 추후 백엔드와 연결할 때 사용됨 (빌드 테스트를 위해 일단은 console.log로 적어둠)

  return (
    <div className="content-container">
      <div className="mt-5">
        <h3 className="text-2xl font-bold">FrontEnd</h3>
      </div>
      <CheckboxGroup options={frontendOptions} onChange={frontendChange} />

      <div className="mt-10">
        <h3 className="text-2xl font-bold">BackEnd</h3>
      </div>
      <CheckboxGroup options={backendOptions} onChange={backendChange} />
    </div>
  );
};

export default BuildScriptForm;
