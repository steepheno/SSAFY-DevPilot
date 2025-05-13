import { useState } from 'react';
import DetailButton from '@/shared/ui/DetailButton';
import DetailInput from '@/shared/ui/DetailInput';

const BuildDetail = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');

  const submitDetailContents = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  return (
    <>
      <div className="my-10 mr-5">
        {/* 빌드 생성 시간 표시 & 상세 내용 입력 버튼 */}
        <div className="mb-4 flex justify-between">
          <p className="flex items-center px-5 text-h3 font-bold">#1 (2025.5.12 오후 2:31:03)</p>

          <DetailButton
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            savedText={savedText}
          />
        </div>

        {/* 상세 내용 표시 - 버튼 아래에 위치하도록 수정 */}
        {!isEditMode && savedText && (
          <div className="mb-4 px-5">
            <div className="text-xl">{savedText}</div>
          </div>
        )}

        {/* 상세 내용 입력 영역 */}
        <div className="px-5">
          <DetailInput
            isEditMode={isEditMode}
            text={text}
            setText={setText}
            setIsEditMode={setIsEditMode}
            onSubmit={submitDetailContents}
          />
        </div>
      </div>
    </>
  );
};

export default BuildDetail;
