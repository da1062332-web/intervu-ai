import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneratedQuestion } from '@/services/question-generation/types';

export interface QuestionPoolTableProps {
  questions: GeneratedQuestion[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function QuestionPoolTable({
  questions,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: QuestionPoolTableProps) {
  // We only show Approved and Published in the Bank
  const poolQuestions = questions.filter(
    (q: any) =>
      q.status === 'APPROVED' ||
      q.status === 'Approved' ||
      q.status === 'PUBLISHED' ||
      q.status === 'Published' ||
      q.rawStatus === 'APPROVED' ||
      q.rawStatus === 'PUBLISHED'
  );
  
  // Exclude Published from selection for Publishing
  const selectableQuestions = poolQuestions.filter(
    (q: any) =>
      q.status === 'APPROVED' ||
      q.status === 'Approved' ||
      q.rawStatus === 'APPROVED'
  );
  
  const allSelected = selectableQuestions.length > 0 && 
                      selectedIds.length === selectableQuestions.length;

  return (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all approved"
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Question Statement</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))
          ) : poolQuestions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No approved or published questions found.
              </TableCell>
            </TableRow>
          ) : (
            poolQuestions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  {q.status === 'APPROVED' && (
                    <Checkbox 
                      checked={selectedIds.includes(q.id)}
                      onCheckedChange={() => onToggleSelect(q.id)}
                      aria-label={`Select ${q.id}`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{q.id}</TableCell>
                <TableCell className="max-w-[300px] truncate" title={q.questionText}>
                  {q.questionText}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{q.difficulty}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {q.templateId}
                </TableCell>
                <TableCell>
                  <Badge variant={q.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {q.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
