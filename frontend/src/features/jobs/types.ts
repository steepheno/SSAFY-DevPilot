export interface Job {
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
    | 'aborted' // 취소됨
    | 'aborted_anime'
    | 'notbuilt' // 빌드 전
    | 'notbuilt_anime'; // 최초 빌드 진행중
}

export interface JobsResponse {
  mode: string;
  nodeDescription: string;
  jobs: Job[];
}

export interface BuildStatus {
  number: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED';
  timestamp: number;
  duration: number;
  fullDisplayName: string;
  parameters: [
    {
      shortDescription: string;
      userName: string;
      userId: string;
    },
  ];
}

export interface JobInfo {
  mode: string;
  nodeDescription: string;
  jobs: Job[];
}
