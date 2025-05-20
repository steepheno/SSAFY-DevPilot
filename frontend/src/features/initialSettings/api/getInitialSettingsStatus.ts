import { instance } from '@/shared/api/instance';
import { InitialSettingsStatus } from '../types';

export const getInitialSettingsStatus = async (): Promise<InitialSettingsStatus> => {
  const response = await instance.get('/initial-setting/status');
  return response.data;
};
