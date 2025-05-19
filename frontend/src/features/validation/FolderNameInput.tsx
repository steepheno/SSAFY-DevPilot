import { useEffect, useState } from 'react';

interface FolderNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const FolderNameInput = ({ value, onChange }: FolderNameInputProps) => {
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(value);
  const [isTry, setIsTry] = useState(false);

  // 폴더명 유효성 검사
  const validateFolderName = (name: string): string => {
    // 빈 문자열 검사
    if (!name || name.trim() === '') {
      return '폴더명은 비워둘 수 없습니다.';
    }

    // 길이 제한 검사
    if (name.length > 255) {
      return '폴더명은 255자를 초과할 수 없습니다.';
    }

    // 금지된 문자 검사
    const invalidChars = /[\\/:*?"<>|]/;
    if (invalidChars.test(name)) {
      return '다음 문자를 사용할 수 없습니다. \\ / : * ? " < > |';
    }

    // 시작/끝 공백검사
    if (name !== name.trim()) {
      return '앞뒤 공백을 포함할 수 없습니다.';
    }

    // 점(.)으로만 이루어진 이름 검사
    if (/^\.+$/.test(name)) {
      return '점(.)으로만 구성될 수 없습니다.';
    }
    return '';
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 사용자 입력 시작 -> 상호작용 여부 true
    setIsTry(true);

    // 유효성 검사 실행
    const validationError = validateFolderName(newValue);
    setError(validationError);

    // 상위 컴포넌트에 값 전달
    onChange(e);
  };

  // 초기값 설정 및 유효성 검사
  useEffect(() => {
    setInputValue(value);
    if (isTry) {
      setError(validateFolderName(value));
    }
  }, [value, isTry]);

  return (
    <div className="folder-input-container relative">
      <input
        className={`ml-5 h-[25px] rounded border px-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
        value={inputValue}
        onChange={handleChange}
        onBlur={() => {
          setIsTry(true); // 필드에서 포커스가 벗어나면 isTouched를 false -> true
          setError(validateFolderName(inputValue)); // blur 시 유효성 검사 다시 실행
        }}
      />
      {isTry && error && (
        <div className="absolute left-5 top-full z-10 w-[200px] p-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default FolderNameInput;
