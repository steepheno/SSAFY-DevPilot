interface DetailInputProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  text: string;
  setText: (value: string) => void;
  onSubmit: () => void;
}

const DetailInput = ({ isEditMode, setIsEditMode, text, setText, onSubmit }: DetailInputProps) => {
  if (!isEditMode) return null;

  return (
    <div>
      <textarea
        className="w-[950px] rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="상세 내용을 입력하세요"
        autoFocus
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => setIsEditMode(false)}
          className="flex items-center justify-center rounded-lg bg-gray-200 px-3 py-2"
        >
          <span>취소</span>
        </button>
        <button
          onClick={onSubmit}
          className="ml-3 flex items-center justify-center rounded-lg bg-blue-500 px-3 py-2 text-white"
        >
          <span>저장</span>
        </button>
      </div>
    </div>
  );
};

export default DetailInput;
