import { useNavigate } from 'react-router-dom';
import { useFormStore } from '@/shared/store';
import BuildInfo from '@/features/dockerfileSettings/ui/BuildInfo.tsx';
import ProjectEnvironment from '@/features/dockerfileSettings/ui/ProjectEnvironment.tsx';
import MySqlInfo from '@/features/dockerfileSettings/ui/MySqlInfo.tsx';
import ProjectNameInput from './newBuildPage/ui/ProjectNameInput';
import { useEffect, useRef } from 'react';

const DockerfileSettings = () => {
  // Navigate
  const navigate = useNavigate();
  // Form 참조 추가
  const formRef = useRef<HTMLFormElement>(null);

  const { projectConfig, backendConfig, frontendConfig } = useFormStore();

  // 새로고침 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault(); // 브라우저가 기본 경고 메시지를 표시
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = formRef.current!;
    const isValid = form.reportValidity();

    // form validation - 기본 HTML 유효성 검사
    if (!isValid) {
      const firstInvalid = form.querySelector<HTMLElement>(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
    }

    // 추가적인 유효성 검사
    // 백엔드 포트 번호 검사
    if (!backendConfig.backendPort) {
      const backendPortInput = form.querySelector<HTMLElement>('[name="backendPort"]');
      if (backendPortInput) {
        backendPortInput.focus();
        return;
      }
    }

    // 프론트엔드 포트 번호 검사
    if (!frontendConfig.frontendPort) {
      const frontendPortInput = form.querySelector<HTMLElement>('[name="frontendPort"]');
      if (frontendPortInput) {
        frontendPortInput.focus();
        return;
      }
    }

    // Java 버전 검사
    if (backendConfig.javaVersion === 'option') {
      const javaVersionSelect = form.querySelector<HTMLElement>('[name="javaVersion"]');
      if (javaVersionSelect) {
        javaVersionSelect.focus();
        return;
      }
    }

    // 프론트엔드 타입 검사
    if (frontendConfig.dockerfileFrontendType === 'option') {
      const frontendTypeSelect = form.querySelector<HTMLElement>('[name="dockerfileFrontendType"]');
      if (frontendTypeSelect) {
        frontendTypeSelect.focus();
        return;
      }
    }

    // 폴더명 검사
    if (!backendConfig.backendDir) {
      const backendDirInput = form.querySelector<HTMLElement>('[name="backendDir"]');
      if (backendDirInput) {
        backendDirInput.focus();
        return;
      }
    }

    if (!frontendConfig.frontendDir) {
      const frontendDirInput = form.querySelector<HTMLElement>('[name="frontendDir"]');
      if (frontendDirInput) {
        frontendDirInput.focus();
        return;
      }
    }

    // 모든 유효성 검사를 통과하면 다음 페이지로 이동
    navigate('/new/check');
  };

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit}>
        <ProjectNameInput />

        {/* 빌드 정보 입력 */}
        <BuildInfo />

        {/* 프로젝트 환경 선택 */}
        <ProjectEnvironment />

        {/* MySQL 설정 */}
        {projectConfig.useMySQL && <MySqlInfo />}

        {/* 다음 버튼 */}
        <div className="flex justify-center">
          <button className="rounded-[10px] bg-blue-500 px-4 py-2 text-white" type="submit">
            다음
          </button>
        </div>
      </form>
    </div>
  );
};

export default DockerfileSettings;
