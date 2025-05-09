import { useState } from 'react';
import ChatbotIcon from '@/assets/icons/chatbot_icon.svg?react';

const ChatBotButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 채팅창 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-80 rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-medium">AI 채팅</h3>
            <button onClick={toggleChat} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <div className="h-80 overflow-y-auto p-4">
            <div className="mb-2 rounded-lg bg-gray-100 p-2">안녕하세요! 무엇을 도와드릴까요?</div>
          </div>
          <div className="border-t p-4">
            <div className="flex">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-1 rounded-l-lg border border-gray-300 p-2 focus:outline-none"
              />
              <button className="rounded-r-lg bg-blue-500 px-4 py-2 text-white">전송</button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 버튼 */}
      <button
        onClick={toggleChat}
        className="bg-p4 hover:bg-p3 flex h-14 w-14 items-center justify-center rounded-full font-bold text-white focus:outline-none"
      >
        {isOpen ? '✕' : <ChatbotIcon width={45} height={45} />}
      </button>
    </div>
  );
};

export default ChatBotButton;
