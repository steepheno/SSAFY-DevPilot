export interface BuildStatus {
  id: string;
  keepLog: boolean;
  number: number;
  queueId: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE';
  timestamp: number;
}
