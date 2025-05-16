import { ChatbotContentsProps, MessageType } from '@/features/chatbot/model/types';
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

  // 입력 필드 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      // 높이 초기화
      textareaRef.current.style.height = 'auto';
      // 스크롤 높이에 맞게 조절 (최대 4줄까지)
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px';
    }
  }, [inputValue]);

  // 새 메시지가 추가될 때 스크롤을 최하단으로 (잘 안 되는듯)
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
  const sendMessage = () => {
    if (inputValue.trim() === '') return;

    // 사용자 메시지 추가
    addMessage(inputValue, false);

    // 입력창 초기화
    setInputValue('');

    // textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 로딩 상태 활성화
    setIsLoading(true);

    // 봇 응답 추가
    setTimeout(() => {
      setIsLoading(false);
      addMessage('메시지 수신', true);
    }, 2000);
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
    <div className="absolute bottom-16 right-0 mb-2 w-80 rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-medium">AI 채팅</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* 4. 채팅 내용 */}
      <div ref={chatContainerRef} className="h-80 overflow-y-auto p-4">
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

      {/* 입력창 */}
      <div className="border-t p-4">
        <div className="flex">
          <textarea
            ref={textareaRef}
            placeholder="메시지를 입력하세요..."
            className="flex-1 resize-none overflow-hidden rounded-l-lg border border-gray-300 p-2 focus:outline-none"
            value={inputValue}
            onChange={inputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
          <button
            className="h-full self-end rounded-r-lg bg-blue-500 px-4 py-2 text-white"
            onClick={sendMessage}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotContents;
