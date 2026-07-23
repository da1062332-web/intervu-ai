import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneratedQuestion } from '@/services/question-generation/types';
import { Eye, Check, X, RefreshCw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

function TopicNameCell({ topicId }: { topicId?: string }) {
  const { data: topics = [], isLoading } = useTopics();
  if (!topicId) return <span className="text-muted-foreground font-mono text-xs">General</span>;
  if (isLoading) return <Skeleton className="h-4 w-20" />;
  const topic = topics.find((t: any) => t.id === topicId);
  return <span title={topic?.name || topicId}>{topic?.name || topicId}</span>;
}

function ConceptNameCell({ topicId, conceptId }: { topicId?: string; conceptId?: string }) {
  const { data: concepts, isLoading } = useConcepts(topicId || '', false);
  
  if (!conceptId) return <span className="text-muted-foreground font-mono text-xs">General</span>;
  if (isLoading) return <Skeleton className="h-4 w-20" />;
  
  const conceptsArray = Array.isArray(concepts) 
    ? concepts 
    : (concepts as any)?.data 
      ? (concepts as any).data 
      : (concepts as any)?.items 
        ? (concepts as any).items 
        : [];

  const concept = conceptsArray.find((c: any) => c.id === conceptId || c.code === conceptId || c.conceptCode === conceptId);
  return (
    <span title={concept?.name || concept?.conceptName || conceptId}>
      {concept?.name || concept?.conceptName || conceptId}
    </span>
  );
}

export interface ReviewTableProps {
  questions: GeneratedQuestion[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (visibleIds?: string[]) => void;
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
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ALL');
  const [selectedConceptId, setSelectedConceptId] = useState<string>('ALL');

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(selectedTopicId !== 'ALL' ? selectedTopicId : '', true);

  const filtered = questions.filter((q: any) => {
    const isPending =
      q.status === 'GENERATED' ||
      q.status === 'Draft' ||
      q.status === 'DRAFT' ||
      q.rawStatus === 'GENERATED' ||
      q.rawStatus === 'DRAFT' ||
      !q.status;

    const matchesTopic = selectedTopicId === 'ALL' || q.topicId === selectedTopicId;
    const matchesConcept = selectedConceptId === 'ALL' || q.conceptId === selectedConceptId;

    const matchesSearch =
      !search ||
      (q.questionText && q.questionText.toLowerCase().includes(search.toLowerCase()));

    return isPending && matchesTopic && matchesConcept && matchesSearch;
  });

  const filteredIds = filtered.map((q) => q.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input 
            placeholder="Search question statement..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          {/* Topic Select Filter */}
          <select
            className="flex h-10 w-full sm:w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedTopicId}
            onChange={(e) => {
              setSelectedTopicId(e.target.value);
              setSelectedConceptId('ALL');
            }}
            disabled={isLoadingTopics}
          >
            <option value="ALL">{isLoadingTopics ? 'Loading topics...' : 'All Topics'}</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Concept Select Filter */}
          <select
            className="flex h-10 w-full sm:w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedConceptId}
            onChange={(e) => setSelectedConceptId(e.target.value)}
            disabled={selectedTopicId === 'ALL' || isLoadingConcepts}
          >
            <option value="ALL">
              {selectedTopicId === 'ALL'
                ? 'Select Topic First'
                : isLoadingConcepts
                  ? 'Loading concepts...'
                  : 'All Concepts'}
            </option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.conceptName}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {(search || selectedTopicId !== 'ALL' || selectedConceptId !== 'ALL') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setSelectedTopicId('ALL');
                setSelectedConceptId('ALL');
              }}
              className="h-10 px-3 shrink-0"
              title="Clear filters"
            >
              <X className="mr-2 h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground whitespace-nowrap">
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
                  onCheckedChange={() => onToggleSelectAll(filteredIds)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Question Statement</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Concept / Section</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No generated questions pending review.
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
                  <TableCell className="max-w-[320px] truncate" title={q.questionText}>
                    {q.questionText}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <TopicNameCell topicId={q.topicId} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <ConceptNameCell topicId={q.topicId} conceptId={q.conceptId || (q as any).conceptKey} />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        (q.difficulty?.toUpperCase() || 'MEDIUM') === 'HARD' 
                          ? 'destructive' 
                          : (q.difficulty?.toUpperCase() || 'MEDIUM') === 'MEDIUM' 
                            ? 'default' 
                            : 'secondary'
                      }
                    >
                      {q.difficulty || 'Medium'}
                    </Badge>
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
