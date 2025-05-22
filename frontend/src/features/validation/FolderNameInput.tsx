import React from 'react';

interface FolderNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string; // name 속성 추가
  required?: boolean; // required 속성 추가
}

const FolderNameInput = ({
  value,
  onChange,
  onBlur,
  name,
  required = false,
}: FolderNameInputProps) => (
  <input
    type="text"
    className="h-[25px] rounded border border-border px-2"
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    name={name}
    required={required}
    pattern="^[a-zA-Z0-9_-]*$"
    title="폴더명은 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다."
  />
);

export default FolderNameInput;
