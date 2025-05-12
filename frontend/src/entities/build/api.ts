import { BuildStatus } from './types';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const fetchBuildInfo = async (jobName: string, buildNumber: string) => {
  const url = `${API_URL}/jenkinsapi/job/${jobName}/${buildNumber}`;
  try {
    const response = await axios.get<BuildStatus>(url);
    console.log(response.data);
    return response;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};
