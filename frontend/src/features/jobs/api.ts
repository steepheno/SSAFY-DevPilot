import { instance } from '@/shared/api/instance';
import { BuildStatus } from './types';

// Job 목록 정보 조회
export const getJobsInfo = async () => {
  const response = await instance.get('/jenkinsapi/info');
  return response.data;
};

// 특정 job의 모든 빌드 정보 조회
export const getJobBuildsInfo = async (jobName: string) => {
  const response = await instance.get(`/jenkinsapi/job/${jobName}`);
  console.log(response);
  return response.data;
};

// 특정 job의 특정 빌드 정보 조회
export const getJobBuildInfo = async (jobName: string, buildNumber: string) => {
  const response = await instance.get<BuildStatus>(`/jenkinsapi/job/${jobName}/${buildNumber}`);
  return response.data;
};
