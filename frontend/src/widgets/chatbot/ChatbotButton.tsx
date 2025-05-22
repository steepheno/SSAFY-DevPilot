import { useState } from 'react';
import ChatbotIcon from '@/assets/icons/chatbot_icon.svg?react';
import ChatbotContents from '@/features/chatbot/ui/ChatbotContents';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 채팅창 */}
      <ChatbotContents isOpen={isOpen} onClose={toggleChat} />

      {/* 채팅 버튼 */}
      <button
        onClick={toggleChat}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-p4 font-bold text-white hover:bg-p3 focus:outline-none"
      >
        {isOpen ? '✕' : <ChatbotIcon width={45} height={45} />}
      </button>
    </div>
  );
};

export default ChatbotButton;
