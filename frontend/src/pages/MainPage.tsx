import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { FunctionComponent, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { fetchJobsInfo } from '@/features/jobs/api';
import { CircleCheckIcon, CircleEllipsisIcon, CircleXIcon } from 'lucide-react';

interface Job {
  name: string;
  url: string;
  color:
    | 'red'
    | 'red_anime'
    | 'yellow'
    | 'yellow_anime'
    | 'blue'
    | 'blue_anime'
    | 'grey'
    | 'grey_anime'
    | 'disabled'
    | 'disabled_anime'
    | 'aborted'
    | 'aborted_anime'
    | 'notbuilt'
    | 'notbuilt_anime';
}

const iconMap: Record<Job['color'], FunctionComponent> = {
  red: CircleXIcon,
  // yellow: YellowIcon,
  // blue: BlueIcon,
  // grey: GreyIcon,
  // disabled: DisabledIcon,
  // aborted: AbortedIcon,
  // notbuilt: NotBuiltIcon,
};

const MainPage = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobsInfo()
      .then((data) => setJobs(data.jobs))
      .catch((err) => console.error(err));
  }, []);

  const submitTitle = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  const renderStatus = (color: string) => {
    switch (color) {
      case 'blue':
        return '성공';
      case 'red':
        return '실패';
      case 'notbuilt':
      default:
        return '미구축';
    }
  };

  return (
    <>
      {jobs.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-gray-600">최근 진행 빌드가 없습니다.</span>
        </div>
      ) : (
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
                <th className="rounded-tl-lg bg-gray-700 p-2 text-center text-white">아이콘</th>
                <th className="bg-gray-700 p-2 text-center text-white">상태</th>
                <th className="bg-gray-700 p-2 text-center text-white">프로젝트 이름</th>
                <th className="bg-gray-700 p-2 text-center text-white">최근 성공</th>
                <th className="bg-gray-700 p-2 text-center text-white">최근 실패</th>
                <th className="bg-gray-700 p-2 text-center text-white">최근 소요시간</th>
                <th className="rounded-tr-lg bg-gray-700 p-2 text-center text-white">빌드</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const IconComponent = iconMap[job.color];
                return (
                  <tr key={job.name}>
                    <td className="border border-gray-300 p-2 text-center">
                      <IconComponent />
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {renderStatus(job.color)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        {job.name}
                      </a>
                    </td>
                    <td className="border border-gray-300 p-2 text-center">--</td>
                    <td className="border border-gray-300 p-2 text-center">--</td>
                    <td className="border border-gray-300 p-2 text-center">--</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <Play size={25} color="rgb(0, 200, 0)" className="mx-auto cursor-pointer" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};
export default MainPage;
