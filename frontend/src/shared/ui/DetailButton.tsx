import { Pencil } from 'lucide-react';

interface DetailButtonProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  savedText: string;
}

const DetailButton = ({ isEditMode, setIsEditMode, savedText }: DetailButtonProps) => {
  if (isEditMode) return null;

  return (
    <button
      className="flex items-center rounded-lg bg-gray-100 px-3 py-2"
      onClick={() => setIsEditMode(true)}
    >
      <Pencil />
    </button>
  );
};

export default DetailButton;
