export interface ChatbotContentsProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MessageType {
  id: number;
  text: string;
  isBot: boolean;
}
