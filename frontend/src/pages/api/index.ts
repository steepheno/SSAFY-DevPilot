import DockerfileConfig from '@/shared/types/DockerfileConfig';
import axios from 'axios';

export interface DockerSuccessResponse {
  additionalProp1: string;
  additionalProp2: string;
  additionalProp3: string;
}

// API URL
const API_URL = import.meta.env.VITE_API_URL;
console.log(API_URL);

/**
 * Dockerfile 및 docker-compose 파일 생성 API 요청
 * @param config Dockerfile 설정 정보
 * @returns 생성된 파일 정보를 담은 응답
 */

export const generateDockerfile = async (
  config: DockerfileConfig,
): Promise<DockerSuccessResponse> => {
  try {
    const url = `${API_URL}/docker/generate-files`;
    console.log(url);
    const response = await axios.post<DockerSuccessResponse>(url, config, {
      headers: { 'Content-Type': 'application/json' },
    });

    // 응답 데이터 반환
    return response.data;
  } catch (error) {
    console.error('Dockerfile 생성 실패: ', error);
    throw error;
  }
};
