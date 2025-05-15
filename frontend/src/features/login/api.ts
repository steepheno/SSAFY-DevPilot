import { instance } from '@/shared/api/instance';
import { JenkinsLogin } from '@/features/login/types';

export const loginJenkins = async (password: JenkinsLogin) => {
  try {
    const response = await instance.post('/jenkinsapi/login', password);
    console.log('Password: ', response.data); // 디버깅 후 삭제 예정
    return response.data;
  } catch (error) {
    console.error('API 통신 중 에러 발생: ', error);
  }
};
