import { useParams, useMatch, Outlet } from 'react-router-dom';
import { CircleCheck, CircleEllipsis, CircleXIcon } from 'lucide-react';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';
import { useJobs } from '@/features/jobs/model/useJobs';

export default function JobLayout() {
  const { jobName, buildId } = useParams<{ jobName: string; buildId: string }>();

  // 로그 페이지 매칭: /builds/:jobName/:buildId/log
  const isLogPage = useMatch('/builds/:jobName/:buildId/log');
  const isListPage = useMatch('/builds/:jobName');

  const { build } = useJobs(jobName!, buildId!);

  // 빌드 상세나 정보 페이지는 build.result 가 반드시 undefined가 아님
  // (서버에서 응답받아 세팅해 주는 상태)
  // 로그 페이지이면서 빌드가 아직 끝나지 않았으면 스피너
  // 그 외(로그 페이지가 아니거나 build.result가 있으면) 성공/실패 아이콘
  let Badge = null as JSX.Element | null;
  if (isLogPage && !build?.result) {
    Badge = <LoadingSpinner />;
  } else if (build?.result === 'SUCCESS') {
    Badge = <CircleCheck color="green" />;
  } else if (build?.result === 'FAILURE') {
    Badge = <CircleXIcon color="red" />;
  } else if (!isListPage) {
    // 빌드 정보가 아직 로딩 중이거나 로그 페이지가 아닌데 결과값도 없으면 말풍선
    Badge = <CircleEllipsis color="gray" />;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {Badge}
        <h2>
          {jobName}
          {buildId && ` #${buildId}`}
        </h2>
      </div>
      <Outlet />
    </div>
  );
}
