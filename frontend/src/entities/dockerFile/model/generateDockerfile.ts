import axios from 'axios';
import { DockerConfig } from '@/entities/dockerFile/types/DockerConfig';

export interface DockerSuccessResponse {
  additionalProp1: string;
  additionalProp2: string;
  additionalProp3: string;
}

// API URL
const API_URL = import.meta.env.VITE_API_URL;
const url = `${API_URL}/docker/generate-files`;
console.log(API_URL);

export const generateDockerfile = async (request: DockerConfig): Promise<DockerSuccessResponse> => {
  const response = await axios.post<DockerSuccessResponse>(url, request, {
    headers: { 'Content-Type': 'application/json' },
  });

  // 응답 데이터 반환
  console.log(response);
  return response.data;
};
