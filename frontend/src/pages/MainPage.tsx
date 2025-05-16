import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { useState } from 'react';

const MainPage = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');

  const submitTitle = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  return (
    <>
      {!isEditMode ? (
        <div className="my-10 mr-5">
          {savedText && (
            <div className="mb-4 px-5">
              <div className="text-xl">{savedText}</div>
            </div>
          )}
          <div className="flex justify-end">
            <DetailButton
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              savedText={savedText}
            />
          </div>
        </div>
      ) : (
        <div className="my-10 px-5">
          <DetailInput
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            text={text}
            setText={setText}
            onSubmit={submitTitle}
          />
        </div>
      )}
      <table className="w-full border-separate border-spacing-0 px-5">
        <thead>
          <tr>
            <th className="rounded-tl-lg bg-gray-700 p-2 text-center text-white">상태</th>
            <th className="bg-gray-700 p-2 text-center text-white">날씨</th>
            <th className="bg-gray-700 p-2 text-center text-white">프로젝트 이름</th>
            <th className="bg-gray-700 p-2 text-center text-white">최근 성공</th>
            <th className="bg-gray-700 p-2 text-center text-white">최근 실패</th>
            <th className="bg-gray-700 p-2 text-center text-white">최근 소요시간</th>
            <th className="rounded-tr-lg bg-gray-700 p-2 text-center text-white">빌드</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 text-center">실패</td>
            <td className="border border-gray-300 p-2 text-center">Rain</td>
            <td className="border border-gray-300 p-2 text-center">test</td>
            <td className="border border-gray-300 p-2 text-center">--</td>
            <td className="border border-gray-300 p-2 text-center">8.5 sec</td>
            <td className="border border-gray-300 p-2 text-center">43ms</td>
            <td className="cursor-pointer border border-gray-300 p-2 text-center">아이콘</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-center">성공</td>
            <td className="border border-gray-300 p-2 text-center">Sunny</td>
            <td className="border border-gray-300 p-2 text-center">test2</td>
            <td className="border border-gray-300 p-2 text-center">24 sec</td>
            <td className="border border-gray-300 p-2 text-center">--</td>
            <td className="border border-gray-300 p-2 text-center">43ms</td>
            <td className="cursor-pointer border border-gray-300 p-2 text-center">아이콘</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default MainPage;
