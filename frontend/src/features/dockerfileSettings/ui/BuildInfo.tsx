import FolderNameInput from '@/features/validation/FolderNameInput';
import PortNumberInput from '@/features/validation/PortNumberInput';
import { useFormStore } from '@/shared/store';
import { useState } from 'react';

// FormField 컴포넌트 수정 - 에러 메시지 레이아웃 변경
const FormField = ({
  label,
  children,
  required = false,
  error = '',
  showError = false,
  dataFieldAttr = '',
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  showError?: boolean;
  dataFieldAttr?: string;
}) => (
  <div className="flex flex-col" data-field={dataFieldAttr}>
    <div className="flex items-center">
      <span className="text-m block font-medium">
        {required && <span className="mr-1 text-red-500">*</span>}
        {label}
      </span>
      <div className="ml-5">{children}</div>
    </div>
    {showError && error && <div className="ml-16 mt-1 text-xs text-red-500">{error}</div>}
  </div>
);

const BuildInfo = () => {
  const { backendConfig, setBackendConfig, frontendConfig, setFrontendConfig } = useFormStore();
  // 필수 입력 필드에 대한 에러 상태 추가
  const [errors, setErrors] = useState({
    backendDir: '',
    backendPort: '',
    javaVersion: '',
    frontendDir: '',
    frontendPort: '',
    dockerfileFrontendType: '',
  });

  // 필드 상호작용 추적
  const [isTry, setIsTry] = useState({
    backendDir: false,
    backendPort: false,
    javaVersion: false,
    frontendDir: false,
    frontendPort: false,
    dockerfileFrontendType: false,
  });

  // Java 버전 변경 핸들러
  const handleJavaVersionChange = (e: any) => {
    const value = e.target.value;
    setBackendConfig({ javaVersion: value });

    // 상호작용 표시
    setIsTry((prev) => ({ ...prev, javaVersion: true }));

    // 유효성 검사
    if (value === 'option') {
      setErrors((prev) => ({ ...prev, javaVersion: 'Java 버전을 선택해주세요.' }));
    } else {
      setErrors((prev) => ({ ...prev, javaVersion: '' }));
    }
  };

  // 프로젝트 환경 변경 핸들러
  const handleFrontendTypeChange = (e: any) => {
    const value = e.target.value;
    setFrontendConfig({ dockerfileFrontendType: value });

    // 상호작용 표시
    setIsTry((prev) => ({ ...prev, dockerfileFrontendType: true }));

    // 유효성 검사
    if (value === 'option') {
      setErrors((prev) => ({ ...prev, dockerfileFrontendType: '프로젝트 환경을 선택해주세요.' }));
    } else {
      setErrors((prev) => ({ ...prev, dockerfileFrontendType: '' }));
    }
  };

  return (
    <div className="mb-10 mt-3 rounded-[10px] bg-gray-100 px-5 py-6">
      <p className="text-xl font-bold">빌드 정보</p>
      <p className="mt-5 font-bold">백엔드</p>
      <div className="mt-2 flex justify-between">
        <FormField
          label="폴더명"
          required
          showError={isTry.backendDir && !!errors.backendDir}
          error={errors.backendDir}
          dataFieldAttr="backendDir"
        >
          <FolderNameInput
            value={backendConfig.backendDir}
            name="backendDir"
            required
            onChange={(e) => {
              setBackendConfig({ ...backendConfig, backendDir: e.target.value });
              setIsTry((prev) => ({ ...prev, backendDir: true }));
            }}
          />
        </FormField>

        <FormField
          label="포트번호"
          required
          showError={isTry.backendPort && !!errors.backendPort}
          error={errors.backendPort}
          dataFieldAttr="backendPort"
        >
          <PortNumberInput
            value={Number(backendConfig.backendPort)}
            name="backendPort"
            required
            onChange={(value) => {
              setBackendConfig({ ...backendConfig, backendPort: value });
              setIsTry((prev) => ({ ...prev, backendPort: true }));
            }}
          />
        </FormField>

        <FormField
          label="Java 버전"
          required
          showError={isTry.javaVersion && !!errors.javaVersion}
          error={errors.javaVersion}
          dataFieldAttr="javaVersion"
        >
          <select
            className={`h-[25px] rounded border px-2 ${isTry.javaVersion && errors.javaVersion ? 'border-red-500' : 'border-border'}`}
            value={backendConfig.javaVersion}
            name="javaVersion"
            required
            onChange={handleJavaVersionChange}
            onBlur={handleJavaVersionChange}
          >
            <option value="option">선택하세요</option>
            <option value="8">JDK 8</option>
            <option value="11">JDK 11</option>
            <option value="17">JDK 17</option>
            <option value="21">JDK 21</option>
          </select>
        </FormField>
      </div>

      <p className="mt-10 font-bold">프론트엔드</p>
      <div className="mt-2 flex justify-between">
        <FormField
          label="폴더명"
          required
          showError={isTry.frontendDir && !!errors.frontendDir}
          error={errors.frontendDir}
          dataFieldAttr="frontendDir"
        >
          <FolderNameInput
            value={frontendConfig.frontendDir}
            name="frontendDir"
            required
            onChange={(e) => {
              setFrontendConfig({ ...frontendConfig, frontendDir: e.target.value });
              setIsTry((prev) => ({ ...prev, frontendDir: true }));
            }}
          />
        </FormField>

        <FormField
          label="포트번호"
          required
          showError={isTry.frontendPort && !!errors.frontendPort}
          error={errors.frontendPort}
          dataFieldAttr="frontendPort"
        >
          <PortNumberInput
            value={Number(frontendConfig.frontendPort)}
            name="frontendPort"
            required
            onChange={(value) => {
              setFrontendConfig({ ...frontendConfig, frontendPort: value });
              setIsTry((prev) => ({ ...prev, frontendPort: true }));
            }}
          />
        </FormField>

        <FormField
          label="프로젝트 환경"
          required
          showError={isTry.dockerfileFrontendType && !!errors.dockerfileFrontendType}
          error={errors.dockerfileFrontendType}
          dataFieldAttr="dockerfileFrontendType"
        >
          <select
            className={`h-[25px] rounded border px-2 ${isTry.dockerfileFrontendType && errors.dockerfileFrontendType ? 'border-red-500' : 'border-border'}`}
            value={frontendConfig.dockerfileFrontendType}
            name="dockerfileFrontendType"
            required
            onChange={handleFrontendTypeChange}
            onBlur={handleFrontendTypeChange}
          >
            <option value="option">선택하세요</option>
            <option value="REACT">REACT</option>
            <option value="VUE">VUE</option>
            <option value="NEXTJS">NEXTJS</option>
          </select>
        </FormField>
      </div>
    </div>
  );
};

export default BuildInfo;
