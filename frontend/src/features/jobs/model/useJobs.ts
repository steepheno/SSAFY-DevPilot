import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobBuildsInfo, getJobBuildInfo, getJobsInfo } from '../api';
export const useJobs = (jobName: string, buildNumber?: string) => {
  const client = useQueryClient();

  const {
    data: jobList,
    error: jobListError,
    isPending: isJobListLoading,
    isError: isJobListError,
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobsInfo(),
  });

  const {
    data: builds,
    error: buildsError,
    isPending: isBuildsLoading,
    isError: isBuildsError,
  } = useQuery({
    queryKey: [jobName, 'builds'],
    queryFn: () => {
      const res = getJobBuildsInfo(jobName);
      console.log(res);
      return res;
    },
  });

  const {
    data: build,
    error: buildError,
    isPending: isBuildLoading,
    isError: isBuildError,
  } = useQuery({
    queryKey: [jobName, 'build', buildNumber],
    queryFn: () => getJobBuildInfo(jobName, buildNumber!),
  });

  // const { mutateAsync: login, isPending: isLoggingIn } = useMutation<boolean, Error, JenkinsLogin>({
  // mutationFn: (password) => loginJenkins(password),
  // onSuccess: (loggedIn) => {
  //   client.setQueryData(['auth', password], loggedIn);
  // },
  // });

  return {
    jobList,
    builds,
    build,

    jobListError,
    buildsError,
    buildError,

    isJobListError,
    isBuildsError,
    isBuildError,

    isJobListLoading,
    isBuildsLoading,
    isBuildLoading,
  };
};
