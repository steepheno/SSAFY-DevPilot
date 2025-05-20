// import { fetchJobInfo } from '@/entities/build/api.ts';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BuildList from './buildLog/ui/BuildList';
import { Job } from '@/features/jobs/types';
import { useJobs } from '@/features/jobs/model/useJobs';

// type LocationState = {
//   job?: Job;
// };

const BuildInfoPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { jobName, buildId } = useParams<{
    jobName: string;
    buildId: string;
  }>();

  const { builds } = useJobs(jobName!);
  const [job, setJob] = useState<Job | null>(null);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-600">빌드 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* <h2 className="text-lg font-semibold">{location.state.name}</h2> */}
      {/* <BuildList jobName={jobName} /> */}
    </div>
  );
};

export default BuildInfoPage;
