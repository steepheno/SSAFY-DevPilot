import { fastApiInstance } from '@/shared/api/instance';
import { ChatbotRequest, ChatbotResponse } from '@/features/chatbot/model/types';

export const chatbotApi = {
  sendMessage: async (question: string): Promise<string> => {
    try {
      const response = await fastApiInstance.post<ChatbotResponse>('/llm/generations', {
        question,
      } as ChatbotRequest);
      console.log('송신 데이터: ', response);
      return response.data.response;
    } catch (error) {
      console.error('API 통신 중 에러 발생: ', error);
      return '오류가 발생했습니다. 다시 시도해주세요.';
    }
  },
};
