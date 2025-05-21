import DetailButton from '@/shared/ui/DetailButton.tsx';
import { useJobs } from '@/features/jobs/model/useJobs';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { Link, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import {
  CircleCheckIcon,
  CircleEllipsisIcon,
  ListIcon,
  CircleXIcon,
  SquareArrowOutUpRight,
  SquareTerminalIcon,
  LogsIcon,
  SquareArrowUpRight,
} from 'lucide-react';
import { Job } from '@/features/jobs/types';
import { getJobBuildInfo, getJobsInfo, getLastJobId } from '@/features/jobs/api';
import { getInitialSettingsStatus } from '@/features/initialSettings/api/getInitialSettingsStatus';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';
import { useSSE } from '@/features/initialSettings/model/useSSE';
import { useQueryClient } from '@tanstack/react-query';

interface CellProps {
  children: React.ReactNode;
}
const Cell: React.FC<CellProps> = ({ children }) => (
  <td className="h-16 border border-gray-300 p-2 text-center align-middle">{children}</td>
);

const iconMap: Record<Job['color'], JSX.Element> = {
  red: <CircleXIcon size={20} color="red" className="mx-auto" />,
  red_anime: <CircleXIcon size={20} color="red" className="mx-auto animate-pulse" />,
  yellow: <CircleEllipsisIcon size={20} color="yellow" className="mx-auto" />,
  yellow_anime: <LoadingSpinner />,
  blue: <CircleCheckIcon size={20} color="blue" className="mx-auto" />,
  blue_anime: <CircleCheckIcon size={20} color="blue" className="mx-auto animate-pulse" />,
  grey: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
  grey_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto animate-pulse" />,
  disabled: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
  disabled_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto animate-pulse" />,
  aborted: <CircleXIcon size={20} color="black" className="mx-auto" />,
  aborted_anime: <CircleXIcon size={20} color="black" className="mx-auto animate-pulse" />,
  notbuilt: <CircleEllipsisIcon size={20} color="black" className="mx-auto" />,
  notbuilt_anime: <CircleEllipsisIcon size={20} color="black" className="mx-auto animate-pulse" />,
};

function mapEventToColor(eventName: string, payload: any): Job['color'] {
  switch (eventName) {
    case 'job_run_started':
      return 'yellow_anime';
    case 'job_run_ended':
      return payload.job_run_status === 'SUCCESS' ? 'blue' : 'red';
    default:
      return 'grey';
  }
}

const MainPage: React.FC = () => {
  // const subStatus = useSSE({
  //   onEvent: (eventName, payload) => {
  //     const jobName = payload.job_name;
  //     const color = mapEventToColor(eventName, payload);
  //   },
  // });

  const { jobList, isJobListLoading, refetchJobList } = useJobs('');
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useSSE({
    onEvent: (eventName, payload) => {
      const jenkinsEvent = (payload as any).eventType as string;
      const jobName = (payload as any).name as string;
      const status = (payload as any).buildNumber;
      console.log(payload);

      let color: Job['color'];
      switch (jenkinsEvent) {
        case 'job_queue_enter':
          color = 'grey_anime';
          break;
        case 'job_run_started':
          color = 'yellow_anime';
          break;
        case 'job_run_ended':
          color = status === 'SUCCESS' ? 'blue' : 'red';
          break;
        case 'job_run_finished':
          color = 'grey';
          break;
        default:
          return;
      }

      // React Query 캐시 갱신
      queryClient.setQueryData<{ jobs: Job[] }>(['jobs'], (old) => {
        console.log(old);
        if (!old) return old;
        return {
          jobs: old.jobs.map((j) => (j.name === jobName ? { ...j, color } : j)),
        };
      });
    },
  });

  const navigate = useNavigate();
  // 마운트될 때마다 최신 jobList를 refetch
  //
  useEffect(() => {
    refetchJobList();
  }, [refetchJobList]);

  if (isJobListLoading) {
    return <LoadingSpinner />;
  }

  const jobs = jobList?.jobs ?? [];

  const handleLogClick = async (jobName: string) => {
    try {
      // 클릭한 job에 대해서만 lastBuildId 호출
      const lastId = await getLastJobId(jobName);
      const lastBuildStatus = await getJobBuildInfo(jobName, lastId);

      console.log(lastBuildStatus);
      // 빌드 결과가 정해지지 않은 경우 로그 출력 페이지로 이동
      if (lastBuildStatus.result === null || 'undefined') {
        navigate(`/builds/${jobName}/${lastId}/log`, { state: { name: jobName } });
      } else {
        navigate(`/builds/${jobName}/${lastId}/`, { state: { name: jobName } });
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    if (color.startsWith('grey')) return '대기 중';
    if (color.startsWith('yellow')) return '빌드 중';
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
          <h2 className="mb-4 text-2xl font-bold">프로젝트 목록</h2>

          {/* 테이블 */}
          <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border">
            <thead>
              <tr className="bg-gray-700 align-middle text-white">
                <th className="h-12 p-2 text-center">최근 빌드</th>
                <th className="h-12 p-2 text-center">프로젝트 이름</th>
                <th className="h-12 p-2 text-center">로그</th>
                <th className="h-12 p-2 text-center">빌드 목록</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const buildListLink = (
                  <Link
                    to={`builds/${job.name}`}
                    state={job}
                    className="text-blue-500 hover:underline"
                  >
                    {job.name}
                  </Link>
                );

                return (
                  <tr key={job.name} className="align-middle odd:bg-white even:bg-gray-50">
                    <Cell>
                      <div className="flex flex-col items-center">
                        {iconMap[job.color]}
                        <span className="mt-1 text-sm">{renderStatus(job.color)}</span>
                        {/* 가장 최근 빌드가 존재할 때만 링크 표시 */}
                      </div>
                    </Cell>
                    <Cell>{job.name}</Cell>
                    <Cell>
                      {job.color !== 'notbuilt' && (
                        <SquareTerminalIcon
                          size={25}
                          color="gray"
                          className="mx-auto cursor-pointer"
                          onClick={() => {
                            handleLogClick(job.name);
                          }}
                        />
                      )}
                    </Cell>
                    <Cell>
                      <ListIcon className="mx-auto cursor-pointer" />
                    </Cell>
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
