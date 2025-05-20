import { useParams, Outlet } from 'react-router';

export default function JobLayout() {
  const { jobName } = useParams<{ jobName: string }>();
  const { buildId } = useParams<{ buildId: string }>();

  if (!jobName) return <p>잘못된 경로입니다.</p>;

  return (
    <div>
      <h2>
        {jobName}
        {/* buildId가 있을 때만 보여주기 */}
        {buildId && <> #{buildId}</>}
      </h2>

      <Outlet />
    </div>
  );
}
