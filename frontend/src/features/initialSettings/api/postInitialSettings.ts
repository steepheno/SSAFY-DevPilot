import { instance } from '@/shared/api/instance.ts';
import { InitialSettings } from '@/features/initialSettings/types';

export const postInitialSettings = async (settings: InitialSettings) => {
  try {
    const response = await instance.post('/initial-setting/test', settings);
    console.log('초기 설정 입력값: ', response.data);
    return response.data;
  } catch (error) {
    console.error('API 통신 중 에러 발생: ', error);
  }
};
