import axios from 'axios';
import { BuildStatus } from '@/entities/build/types';

// 빌드 정보 fetch
export const fetchBuildStatus = async (buildId: string): Promise<BuildStatus> => {
  const { data } = await axios.get<BuildStatus>(`/api/builds/${buildId}`);
  return data;
};
