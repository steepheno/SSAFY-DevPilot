import { instance } from '@/shared/api/instance';

const url = import.meta.env.VITE_API_URL;
export const fetchJobsInfo = async () => {
  const response = await instance.get(`${url}/jenkinsapi/info`);
  console.log(response.data);
  return response.data;
};
