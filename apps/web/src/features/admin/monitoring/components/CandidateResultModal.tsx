'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, User } from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';
import { ResultDetailsPage } from '@/modules/results/pages/ResultDetailsPage';

interface CandidateResultModalProps {
  candidate: CandidateItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateResultModal({
  candidate,
  isOpen,
  onClose,
}: CandidateResultModalProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='max-w-6xl w-[96vw] h-[92vh] max-h-[92vh] p-0 flex flex-col overflow-hidden border shadow-2xl bg-background rounded-2xl'
        showCloseButton={true}
      >
        <DialogHeader className='px-6 py-3.5 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0 shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
              <FileText className='size-4' />
            </div>
            <div>
              <DialogTitle className='text-sm font-bold flex items-center gap-2'>
                <span>Candidate Assessment Result &amp; Analytics</span>
                <Badge variant='outline' className='text-[10px] font-mono'>
                  {candidate.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5'>
                <User className='size-3' />
                <span className='font-medium text-foreground'>{candidate.candidateName}</span>
                <span>• {candidate.candidateEmail}</span>
                <span className='font-mono text-[11px] opacity-75'>• ID: {candidate.attemptId}</span>
              </DialogDescription>
            </div>
          </div>
          <div className='flex items-center gap-2 pr-8'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => window.open(`/admin/results/${candidate.attemptId}`, '_blank')}
              className='h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground'
              title='Open full report in a new browser tab'
            >
              <ExternalLink className='size-3.5' />
              <span>Open in Full Page</span>
            </Button>
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4'>
          <ResultDetailsPage
            attemptId={candidate.attemptId}
            isModal={true}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
