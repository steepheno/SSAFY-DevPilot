import { useEffect, useState } from 'react';

interface PortNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const PortNumberInput = ({ value, onChange }: PortNumberInputProps) => {
  const [error, setError] = useState('');
  // 입력 필드에 표시할 값 (빈 문자열 또는 숫자 문자열)
  const [displayValue, setDisplayValue] = useState<string>(value === 0 ? '' : value.toString());
  // 실제 데이터 값 (항상 숫자)
  const [inputValue, setInputValue] = useState(value);
  const [isTry, setIsTry] = useState(false);

  // 포트번호 유효성 검사
  const validatePortNumber = (port: number | string): string => {
    if (port === undefined || port === null || port === '') {
      return '포트번호는 비워둘 수 없습니다.';
    }

    // 포트번호는 정수
    if (!Number.isInteger(Number(port))) {
      return '정수만 입력 가능합니다.';
    }

    // 포트번호 범위 검사
    const portNumber = Number(port);
    if (portNumber < 0 || portNumber > 65535) {
      return '0~65535 사이의 값만 가능합니다.';
    }

    return '';
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // 화면에 표시할 값 설정
    setDisplayValue(newValue);

    // 사용자 입력 시작 -> 상호작용 여부 true
    setIsTry(true);

    // 상위 컴포넌트에 숫자로 변환하여 전달
    const numericValue = newValue === '' ? 0 : Number(newValue);

    // 유효성 검사 실행
    const validationError = validatePortNumber(newValue);
    setError(validationError);

    // 값이 유효하거나 빈 값인 경우 상위 컴포넌트에 전달
    if (!validationError || newValue === '') {
      onChange(numericValue);
    }
  };

  // 초기값 설정 및 유효성 검사
  useEffect(() => {
    setInputValue(value);
    if (isTry) {
      // 값이 0이면 화면에 빈 문자열로 표시
      setDisplayValue(value === 0 ? '' : value.toString());
      setError(validatePortNumber(value === 0 ? '' : value));
    }
  }, [value, isTry]);

  return (
    <div className="port-input-container relative">
      <input
        className={`ml-5 h-[25px] rounded border px-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
        type="number"
        value={displayValue}
        onChange={handleChange}
        onBlur={() => {
          setIsTry(true); // 필드에서 포커스가 벗어나면 isTouched를 false -> true
          validatePortNumber(inputValue);
        }}
      />
      {error && (
        <div className="absolute left-5 top-full z-10 w-[200px] p-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default PortNumberInput;
