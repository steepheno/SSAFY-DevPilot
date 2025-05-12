import { Pencil } from 'lucide-react';

interface DetailButtonProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  savedText: boolean;
}

const DetailButton = ({ isEditMode, setIsEditMode, savedText }: DetailButtonProps) => {
  if (isEditMode) return null;

  return (
    <button
      className="flex items-center rounded-lg bg-gray-100 px-3 py-2"
      onClick={() => setIsEditMode(true)}
    >
      <Pencil />
      <span className="ml-3">{savedText ? '내용 수정' : '상세 내용 입력'}</span>
    </button>
  );
};

export default DetailButton;
