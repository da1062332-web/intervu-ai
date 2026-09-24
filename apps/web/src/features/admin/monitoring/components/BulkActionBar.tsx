'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  RotateCcw,
  Send,
  X,
  Loader2,
  Users,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface BulkActionBarProps {
  selectedCount: number;
  onExtendTime: (minutes: number) => Promise<void>;
  onRecover: (graceMinutes: number) => Promise<void>;
  onForceSubmit: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClearSelection: () => void;
  isActing?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onExtendTime,
  onRecover,
  onForceSubmit,
  onDelete,
  onClearSelection,
  isActing = false,
}: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<'recover' | 'submit' | null>(null);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className='animate-in fade-in slide-in-from-top-2 duration-200 shrink-0'>
      <div className='flex items-center gap-2.5 p-2 px-3 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-sm text-xs max-w-full overflow-x-auto'>
        {/* Count Badge */}
        <div className='flex items-center gap-1.5 pr-2 border-r border-border/60 shrink-0'>
          <Users className='size-4 text-primary' />
          <Badge variant='secondary' className='h-6 px-2 text-xs font-semibold bg-primary/10 text-primary border-primary/20'>
            {selectedCount} Selected
          </Badge>
        </div>

        {/* Quick Extend Time Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size='sm'
              variant='outline'
              disabled={isActing}
              className='h-8 text-xs gap-1.5 px-2.5 shrink-0 whitespace-nowrap border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            >
              <Clock className='size-3.5 text-amber-600' />
              <span>Extend Time</span>
              <ChevronDown className='size-3 opacity-60' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='text-xs'>
            <DropdownMenuItem onClick={() => onExtendTime(5)} className='gap-2'>
              <Clock className='size-3.5 text-amber-600' />
              Add +5 Minutes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExtendTime(10)} className='gap-2'>
              <Clock className='size-3.5 text-amber-600' />
              Add +10 Minutes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExtendTime(15)} className='gap-2'>
              <Clock className='size-3.5 text-amber-600' />
              Add +15 Minutes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExtendTime(30)} className='gap-2'>
              <Clock className='size-3.5 text-amber-600' />
              Add +30 Minutes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk Authorize Resume */}
        <Button
          size='sm'
          variant='default'
          disabled={isActing}
          onClick={() => {
            if (confirmAction === 'recover') {
              onRecover(5);
              setConfirmAction(null);
            } else {
              setConfirmAction('recover');
            }
          }}
          className={`h-8 text-xs gap-1.5 px-3 shrink-0 whitespace-nowrap transition-colors ${
            confirmAction === 'recover'
              ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {isActing ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : (
            <RotateCcw className='size-3.5' />
          )}
          {confirmAction === 'recover'
            ? `Confirm Resume (${selectedCount})?`
            : 'Authorize Resume (+5m)'}
        </Button>

        {/* Bulk Force Submit */}
        <Button
          size='sm'
          variant='destructive'
          disabled={isActing}
          onClick={() => {
            if (confirmAction === 'submit') {
              onForceSubmit();
              setConfirmAction(null);
            } else {
              setConfirmAction('submit');
            }
          }}
          className='h-8 text-xs gap-1.5 px-3 shrink-0 whitespace-nowrap'
        >
          <Send className='size-3.5' />
          {confirmAction === 'submit'
            ? `Confirm Submit (${selectedCount})?`
            : 'Force Submit'}
        </Button>

        {/* Bulk Delete */}
        <ConfirmationDialog
          title={`Permanently delete ${selectedCount} attempt${selectedCount > 1 ? 's' : ''}?`}
          description='This permanently deletes the selected attempts and all associated answers, submissions, and results. This cannot be undone.'
          confirmLabel='Delete Permanently'
          destructive
          isLoading={isActing}
          onConfirm={onDelete}
          trigger={
            <Button
              size='sm'
              variant='destructive'
              disabled={isActing}
              className='h-8 text-xs gap-1.5 px-3 shrink-0 whitespace-nowrap bg-rose-700 hover:bg-rose-800'
            >
              <Trash2 className='size-3.5' />
              Delete
            </Button>
          }
        />

        {/* Clear Selection */}
        <Button
          size='sm'
          variant='ghost'
          onClick={() => {
            setConfirmAction(null);
            onClearSelection();
          }}
          disabled={isActing}
          className='size-7 p-0 rounded-md text-muted-foreground hover:text-foreground ml-1 shrink-0'
          title='Clear Selection'
        >
          <X className='size-4' />
        </Button>
      </div>
    </div>
  );
}
