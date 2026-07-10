import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneratedQuestion } from '@/services/question-generation/types';
import { Eye, Check, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface ReviewTableProps {
  questions: GeneratedQuestion[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreview: (question: GeneratedQuestion) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  processingId: string | null;
}

export function ReviewTable({
  questions,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onApprove,
  onReject,
  onRegenerate,
  processingId
}: ReviewTableProps) {
  const [search, setSearch] = useState('');

  const filtered = questions.filter(q => 
    q.status === 'Draft' && 
    (q.questionText.toLowerCase().includes(search.toLowerCase()) || q.id.toLowerCase().includes(search.toLowerCase()))
  );

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder="Search draft questions..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} pending review
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Question Statement</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Template</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No draft questions pending review.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(q.id)}
                      onCheckedChange={() => onToggleSelect(q.id)}
                      aria-label={`Select ${q.id}`}
                    />
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Preview"
                        onClick={() => onPreview(q)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Regenerate"
                        onClick={() => onRegenerate(q.id)}
                        disabled={processingId === q.id}
                      >
                        <RefreshCw className={`h-4 w-4 ${processingId === q.id ? 'animate-spin text-blue-500' : ''}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Reject"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => onReject(q.id)}
                        disabled={processingId === q.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Approve"
                        className="text-green-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => onApprove(q.id)}
                        disabled={processingId === q.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
