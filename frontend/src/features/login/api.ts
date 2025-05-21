import { instance } from '@/shared/api/instance';
import { JenkinsLogin } from '@/features/login/types';

export const loginJenkins = async (password: JenkinsLogin): Promise<boolean> => {
  const response = await instance.post('/jenkinsapi/login', password);
  return response.status === 200;
};
