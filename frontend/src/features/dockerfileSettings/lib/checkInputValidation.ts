import { BackendConfig } from '@/entities/backend/types';
import { FrontendConfig } from '@/entities/frontend/types';

export function checkInpuValidation({
  backendConfig,
  frontendConfig,
}: {
  backendConfig: BackendConfig;
  frontendConfig: FrontendConfig;
}) {
  if (!backendConfig.backendDir) {
    alert('백엔드 폴더명을 입력해주세요.');
    return false;
  }

  if (!frontendConfig.frontendDir) {
    alert('프론트엔드 폴더명을 입력해주세요.');
    return false;
  }

  if (backendConfig.backendPort < 0 || frontendConfig.frontendPort < 0) {
    alert('유효한 포트번호를 입력해주세요.');
    return false;
  }

  if (backendConfig.javaVersion === 'option') {
    alert('Java 버전을 선택해주세요.');
    return false;
  }

  if (frontendConfig.dockerfileFrontendType === 'option') {
    alert('프론트엔드 프로젝트 환경을 선택해주세요.');
    return false;
  }
}
