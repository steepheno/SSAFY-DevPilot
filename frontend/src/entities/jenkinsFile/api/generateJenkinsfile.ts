import axios from 'axios';
import { JenkinsConfig, GenerateFileResponse } from '../types';

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
