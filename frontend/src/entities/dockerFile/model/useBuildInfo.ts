import { useState } from 'react';

export const useBuildInfo = () => {
  const [backendDir, setBackendDir] = useState('');
  const [backendPort, setBackendPort] = useState(0);
  const [javaVersion, setJavaVersion] = useState('');
  const [frontendDir, setFrontendDir] = useState('');
  const [frontendPort, setFrontendPort] = useState(0);
  const [dockerfileFrontendType, setDockerfileFrontendType] = useState('');

  const validateBuildInfo = () => {
    if (!backendDir) {
      alert('백엔드 폴더명을 입력해주세요.');
      return false;
    }

    if (!frontendDir) {
      alert('프론트엔드 폴더명을 입력해주세요.');
      return false;
    }

    if (backendPort < 0 || frontendPort < 0) {
      alert('유효한 포트번호를 입력해주세요.');
      return false;
    }

    if (javaVersion === 'option') {
      alert('Java 버전을 선택해주세요.');
      return false;
    }

    if (dockerfileFrontendType === 'option') {
      alert('프론트엔드 프로젝트 환경을 선택해주세요.');
      return false;
    }

    return true;
  };

  const getBuildInfoConfig = () => {
    return {
      backendDir,
      backendPort: Number(backendPort),
      javaVersion,
      frontendDir,
      frontendPort: Number(frontendPort),
      dockerfileFrontendType,
    };
  };

  return {
    backendDir,
    setBackendDir,
    backendPort,
    setBackendPort,
    javaVersion,
    setJavaVersion,
    frontendDir,
    setFrontendDir,
    frontendPort,
    setFrontendPort,
    dockerfileFrontendType,
    setDockerfileFrontendType,
    validateBuildInfo,
    getBuildInfoConfig,
  };
};
