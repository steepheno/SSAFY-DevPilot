import axios from 'axios';
import { InitialSettingConfig } from '../types/InitialSettingConfig';

const url = import.meta.env.VITE_API_URL;
const endpoint = `${url}/initial-setting/install`;

export const setInitialConfig = async (request: InitialSettingConfig) => {
  const response = await axios.post(endpoint, request);
  console.log(response);
  return response.data;
};
