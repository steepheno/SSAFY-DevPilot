import { JenkinsConfig } from '@/shared/types/JenkinsConfig.type';
import axios from 'axios';

interface GenerateFileResponse {
  filePath: string;
  projectType: string;
  message: string;
}

const url = import.meta.env.VITE_API_URL;
const endpoint = `${url}/jenkinsfile/generate-file`;

export const generateJenkinsFile = async (
  request: JenkinsConfig,
): Promise<GenerateFileResponse> => {
  const response = await axios.post(endpoint, request, {
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(response);
  return response.data;
};
