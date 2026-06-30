import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, User, FileText, Globe } from 'lucide-react';

interface HistoryRecord {
  id: string;
  step: string;
  changedBy: string;
  date: string;
  reason?: string;
  source: string;
  ipAddress: string;
}

interface WorkflowHistoryProps {
  history: HistoryRecord[];
}

export const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({ history }) => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Workflow History</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Complete audit trail of all actions and transitions in this workflow.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='divide-y'>
            {history.length > 0 ? (
              history.map((record) => (
                <div
                  key={record.id}
                  className='p-4 flex gap-4 items-start hover:bg-muted/50 transition-colors'
                >
                  <div className='mt-1 bg-primary/10 p-2 rounded-full'>
                    <History className='w-4 h-4 text-primary' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='font-medium text-sm'>
                        Transitioned to {record.step.replace('_', ' ')}
                      </p>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(record.date).toLocaleString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <User className='w-3 h-3' /> {record.changedBy}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Globe className='w-3 h-3' /> {record.ipAddress}
                      </span>
                      <span className='flex items-center gap-1'>
                        <FileText className='w-3 h-3' /> {record.source}
                      </span>
                    </div>
                    {record.reason && (
                      <p className='text-sm text-muted-foreground mt-2 italic bg-muted p-2 rounded border'>
                        Reason: {record.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className='p-8 text-center text-muted-foreground'>
                <p>No history records found for this workflow.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
