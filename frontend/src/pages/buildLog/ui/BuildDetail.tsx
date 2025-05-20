import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { useJobs } from '@/features/jobs/model/useJobs';
import { formatTimestamp } from '@/shared/lib/time';

const BuildDetail = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');

  const { jobName, buildId } = useParams<{
    jobName: string;
    buildId: string;
  }>();
  const { build, isBuildError, isBuildLoading } = useJobs(jobName!, buildId!);

  useEffect(() => {
    console.log(buildId);
    console.log(build);
  }, [buildId, build]);

  const submitDetailContents = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  return (
    <>
      <div className="my-10 mr-5">
        {isBuildLoading ? (
          <p>로딩 중...</p>
        ) : (
          <>
            {/* 빌드 생성 시간 표시 & 상세 내용 입력 버튼 */}
            <div className="mb-4 flex justify-between">
              <p className="flex items-center px-5 text-h3 font-bold">
                {formatTimestamp(build?.timestamp!)}
              </p>

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
          </>
        )}
      </div>
    </>
  );
};

export default BuildDetail;
