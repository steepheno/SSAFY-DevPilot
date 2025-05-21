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
    | 'aborted'
    | 'aborted_anime'
    | 'notbuilt'
    | 'notbuilt_anime';
}

export interface BuildStatus {
  number: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE';
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
