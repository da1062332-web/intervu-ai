import { QueueJobRequest, QueueJobResponse } from '../../types';

export interface IQueueContract {
  processJob(request: QueueJobRequest): Promise<QueueJobResponse>;
}
