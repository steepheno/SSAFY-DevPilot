import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { useJobs } from '@/features/jobs/model/useJobs';
import { formatTimestamp } from '@/shared/lib/time';
import { getBuildStream } from '@/features/jobs/api';

const BuildDetail = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');

  const { jobName, buildId } = useParams<{
    jobName: string;
    buildId: string;
  }>();
  const { build, isBuildLoading } = useJobs(jobName!, buildId!);
  const [streamLines, setStreamLines] = useState<string[]>([]);

  useEffect(() => {
    getBuildStream(jobName!, buildId!)
      .then((data) => {
        const lines = data
          .split('\n')
          .filter((line: any) => line.startsWith('data:'))
          .map((line: any) => line.replace(/^data:\s*/, '').trim());
        setStreamLines(lines);
      })
      .catch((err) => console.error(err));
  }, [buildId]);

  const submitDetailContents = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  return (
    <>
      <div className="my-5 mr-5">
        {isBuildLoading ? (
          <p>로딩 중...</p>
        ) : (
          <>
            {/* 빌드 생성 시간 표시 */}
            <div className="mb-4 flex justify-between">
              <p className="flex items-center px-5 text-h3 font-bold">
                {formatTimestamp(build?.timestamp!)}
              </p>
            </div>

            {/* 상세 내용 표시 - 버튼 아래에 위치하도록 수정 */}
            {!isEditMode && savedText && (
              <div className="mb-4 px-5">
                <div className="text-xl">{savedText}</div>
              </div>
            )}

            <div className="h-[60vh] max-h-full overflow-y-auto whitespace-pre-wrap bg-gray-200 p-2 font-mono text-sm">
              {streamLines.map((line, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="w-10 select-none pr-4 text-right text-gray-400">{idx + 1}</div>
                  <div className="mx-2" />
                  <div className="flex-1 break-words">{line}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default BuildDetail;
