import { ChatbotContentsProps, MessageType } from '@/features/chatbot/model/types';
import { chatbotApi } from '@/features/chatbot/model/api';
import { useEffect, useRef, useState } from 'react';

const ChatbotContents = ({ isOpen, onClose }: ChatbotContentsProps) => {
  /* 1. 대화 내용 상태 관리 */
  // 메시지 목록 상태
  const [messages, setMessages] = useState<MessageType[]>([
    { id: 1, text: '안녕하세요! 무엇을 도와드릴까요?', isBot: true },
  ]);

  // 입력 필드값 상태
  const [inputValue, setInputValue] = useState('');

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // textarea 참조 생성
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절 및 스크롤
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 입력 컨테이너 참조
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // 입력 필드 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current && inputContainerRef.current) {
      // 높이 초기화
      textareaRef.current.style.height = 'auto';

      // 스크롤 높이에 맞게 조절 (최대 100px)
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 100);
      textareaRef.current.style.height = newHeight + 'px';

      // 채팅 컨테이너 영역 조정
      if (chatContainerRef.current) {
        const baseChatHeight = 500 - 56 - 68; // 기본 채팅 영역 높이 (500px - 헤더(56px) - 입력창 기본 높이(68px))
        const extraInputHeight = Math.max(0, newHeight - 40); // 추가 입력창 높이 (기본 높이 40px을 초과하는 부분)

        chatContainerRef.current.style.height = baseChatHeight - extraInputHeight + 'px'; // 채팅 영역 높이 조정
      }
    }
  }, [inputValue]);

  // 새 메시지 추가되면 스크롤 최하단으로
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /* 2. 메시지 추가 기능 */
  // 새 메시지 추가
  const addMessage = (text: string, isBot: boolean) => {
    const newMessage: MessageType = {
      id: Date.now(), // 고유 ID 생성
      text,
      isBot,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // 사용자 메시지 전송 후 봇 응답 추가
  const sendMessage = async () => {
    if (inputValue.trim() === '') return;

    // 사용자 메시지 추가
    addMessage(inputValue, false);

    // 입력창 초기화
    setInputValue('');

    // textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    // 채팅 영역 높이 원상복구
    if (chatContainerRef.current) {
      chatContainerRef.current.style.height = '376px'; // 500 - 56 - 68
    }

    // 로딩 상태 활성화
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(inputValue);
      setIsLoading(false);

      // 봇 응답 추가
      addMessage(response, true);
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
      setIsLoading(false);
      addMessage('오류가 발생했습니다. 다시 시도해주세요.', true);
    }
  };

  /* 3. 입력 필드 핸들링 */
  // 입력값 변경 감지
  const inputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Enter 키로 메시지 전송 (Shift + Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 기본 줄바꿈 동작 방지
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-0 mb-2 flex h-[500px] w-80 flex-col rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-medium">AI 채팅</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* 4. 채팅 내용 - 유동적인 높이를 가지게 변경 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ height: '376px' }} // 초기 높이 설정 (500 - 헤더(56) - 입력창(68))
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 rounded-lg p-3 ${
              message.isBot ? 'max-w-[70%] bg-gray-100' : 'bg-blue-500 text-white'
            } ${message.isBot ? '' : 'ml-auto max-w-[70%]'}`}
            style={{ whiteSpace: 'pre-wrap', width: 'fit-content' }}
          >
            {message.text}
          </div>
        ))}

        {/* 로딩 표시 */}
        {isLoading && (
          <div
            className="mb-3 max-w-[70%] rounded-lg bg-gray-100 p-3"
            style={{ width: 'fit-content' }}
          >
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 입력창 - 고정된 위치 */}
      <div ref={inputContainerRef} className="mt-auto border-t p-4">
        <div className="flex items-end">
          <textarea
            ref={textareaRef}
            placeholder="메시지를 입력하세요..."
            className="flex-1 resize-none overflow-hidden rounded-l-lg border border-gray-300 p-2 focus:outline-none"
            value={inputValue}
            onChange={inputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: '40px', maxHeight: '100px' }}
          />
          <button
            className="rounded-r-lg bg-blue-500 px-4 py-2 text-white"
            onClick={sendMessage}
            style={{ minHeight: '40px' }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotContents;
