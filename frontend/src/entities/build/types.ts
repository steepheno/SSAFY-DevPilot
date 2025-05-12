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
