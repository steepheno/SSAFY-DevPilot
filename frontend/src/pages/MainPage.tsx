import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CircleCheckIcon, CircleEllipsisIcon, CircleXIcon, Play } from 'lucide-react';
import { Job } from '@/features/jobs/types';
import { fetchJobsInfo } from '@/features/jobs/api';

const Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="h-12 border border-gray-300 p-2 text-center align-middle">{children}</td>
);

const MainPage = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 페이지 로딩 시 프로젝트 목록 로딩
  useEffect(() => {
    setIsLoading(true);
    fetchJobsInfo()
      .then((data) => setJobs(data.jobs))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-600">로딩 중...</span>
      </div>
    );
  }

  const submitTitle = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  const renderStatus = (color: Job['color']) => {
    if (color.startsWith('blue')) return '성공';
    if (color.startsWith('red')) return '실패';
    return '빌드 전';
  };

  return (
    <>
      {jobs.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-gray-600">최근 진행 빌드가 없습니다.</span>
        </div>
      ) : (
        <>
          <h2>프로젝트 목록</h2>
          {/* 헤더 (제목 & 에디트 버튼) */}
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

          {/* Jobs 테이블 */}
          <table className="w-full table-fixed border-separate border-spacing-0 px-5">
            <thead>
              <tr className="align-middle">
                <th className="h-12 rounded-tl-lg bg-gray-700 p-2 text-center text-white">
                  아이콘
                </th>
                <th className="h-12 bg-gray-700 p-2 text-center text-white">상태</th>
                <th className="h-12 bg-gray-700 p-2 text-center text-white">프로젝트 이름</th>
                <th className="h-12 rounded-tr-lg bg-gray-700 p-2 text-center text-white">빌드</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                {
                  /* 특정 프로젝트 빌드 목록 링크 */
                }
                const link = (
                  <Link
                    to={`builds/${job.name}`}
                    state={job}
                    className="text-blue-500 hover:underline"
                  >
                    {job.name}
                  </Link>
                );
                const playIcon = (
                  <Play size={25} color="rgb(0, 200, 0)" className="mx-auto cursor-pointer" />
                );
                const placeholders = [];
                const iconsMap: Record<Job['color'], JSX.Element> = {
                  red: <CircleXIcon size={20} color="red" className="mx-auto" />,
                  red_anime: <CircleXIcon size={20} color="red" className="mx-auto" />,
                  yellow: <CircleEllipsisIcon size={20} color="yellow" className="mx-auto" />,
                  yellow_anime: <CircleEllipsisIcon size={20} color="yellow" className="mx-auto" />,
                  blue: <CircleCheckIcon size={20} color="blue" className="mx-auto" />,
                  blue_anime: <CircleCheckIcon size={20} color="blue" className="mx-auto" />,
                  grey: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
                  grey_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
                  disabled: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
                  disabled_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
                  aborted: <CircleXIcon size={20} color="black" className="mx-auto" />,
                  aborted_anime: <CircleXIcon size={20} color="black" className="mx-auto" />,
                  notbuilt: <CircleEllipsisIcon size={20} color="black" className="mx-auto" />,
                  notbuilt_anime: (
                    <CircleEllipsisIcon size={20} color="black" className="mx-auto" />
                  ),
                };

                const cells: React.ReactNode[] = [
                  iconsMap[job.color],
                  renderStatus(job.color),
                  link,
                  ...placeholders,
                  playIcon,
                ];

                return (
                  <tr key={job.name} className="align-middle">
                    {cells.map((cell, idx) => (
                      <Cell key={idx}>{cell}</Cell>
                    ))}
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
