import { instance } from '@/shared/api/instance';
import { JenkinsLogin } from '@/features/login/types';

export const loginJenkins = async (password: JenkinsLogin): Promise<boolean> => {
<<<<<<< HEAD
  const response = await instance.post('/jenkinsapi/login', password);
  return response.status === 200;
=======
  try {
    const response = await instance.post('/jenkinsapi/login', password);
    return response.status === 200;
  } catch (error) {
    console.error('API 통신 중 에러 발생: ', error);
    return false;
  }
>>>>>>> 9a403fbb37117d760cfeb6a1c5653e3fa5e1e482
};
