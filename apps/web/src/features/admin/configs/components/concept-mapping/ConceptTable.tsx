import React from 'react';
import type { ConceptMapping } from '@/services/concept-mapping';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Trash2, Link, Code2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplatesByConcept } from '@/services/templates/hooks';
import { useCodingPatterns } from '@/services/coding-patterns/hooks';
import { useManualQuestions } from '@/services/manual-questions/hooks';

interface ConceptTableProps {
  concepts: ConceptMapping[];
  isLoading?: boolean;
  onEdit: (concept: ConceptMapping) => void;
  onDeactivate: (concept: ConceptMapping) => void;
  onMapTemplates?: (concept: ConceptMapping) => void;
  onViewManualQuestions?: (concept: ConceptMapping) => void;
  onViewCodingPatterns?: (concept: ConceptMapping) => void;
  hideTemplatesButton?: boolean;
}

function ConceptContentCell({
  concept,
  onMapTemplates,
  onViewCodingPatterns,
  onViewManualQuestions,
}: {
  concept: ConceptMapping;
  onMapTemplates?: (concept: ConceptMapping) => void;
  onViewCodingPatterns?: (concept: ConceptMapping) => void;
  onViewManualQuestions?: (concept: ConceptMapping) => void;
}) {
  const conceptKey = concept.code || concept.conceptCode || '';
  const conceptName = concept.name || concept.conceptName || '';

  const { data: tplResponse, isLoading: isTplLoading } = useTemplatesByConcept(conceptKey);
  const templatesCount = tplResponse?.items?.length || 0;

  const { data: patResponse, isLoading: isPatLoading } = useCodingPatterns(1, 100);
  const patternsCount = (patResponse?.items || []).filter((p: any) => {
    const metaConcept = String((p.metadata as any)?.conceptKey || '').trim().toLowerCase();
    const metaTopic = String((p.metadata as any)?.topicId || '').trim();
    const slug = (p.slug || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const cKey = conceptKey.trim().toLowerCase();
    const cName = conceptName.trim().toLowerCase();

    return (
      (metaConcept && (metaConcept === cKey || metaConcept === cName)) ||
      (metaTopic && metaTopic === concept.topicId) ||
      (cKey && (slug.includes(cKey) || cKey.includes(slug))) ||
      (cName && (title.includes(cName) || cName.includes(title)))
    );
  }).length;

  const { data: mqResponse, isLoading: isMqLoading } = useManualQuestions(concept.topicId ? { topicId: concept.topicId } : undefined);
  const manualQsCount = (mqResponse?.items || []).filter(
    (q: any) => q.conceptId === concept.id || q.conceptCode === conceptKey || q.conceptKey === conceptKey,
  ).length;

  const isLoading = isTplLoading || isPatLoading || isMqLoading;

  if (isLoading) {
    return <Skeleton className="h-6 w-28" />;
  }

  const hasAnyMapped = templatesCount > 0 || patternsCount > 0 || manualQsCount > 0;

  if (!hasAnyMapped) {
    return (
      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground bg-muted/20 border-dashed">
        Unmapped
      </Badge>
    );
  }

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      {templatesCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMapTemplates?.(concept)}
          className="h-6 text-[11px] px-2 font-medium bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200"
        >
          <Link className="h-3 w-3 mr-1" /> Templates ({templatesCount})
        </Button>
      )}

      {patternsCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewCodingPatterns?.(concept)}
          className="h-6 text-[11px] px-2 font-medium bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200"
        >
          <Code2 className="h-3 w-3 mr-1" /> Patterns ({patternsCount})
        </Button>
      )}

      {manualQsCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewManualQuestions?.(concept)}
          className="h-6 text-[11px] px-2 font-medium bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200"
        >
          <Link className="h-3 w-3 mr-1" /> Manual Qs ({manualQsCount})
        </Button>
      )}
    </div>
  );
}

export function ConceptTable({
  concepts,
  isLoading,
  onEdit,
  onDeactivate,
  onMapTemplates,
  onViewManualQuestions,
  onViewCodingPatterns,
  hideTemplatesButton = false,
}: ConceptTableProps) {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className='text-center py-12 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          No Concepts Found
        </h3>
        <p className='text-muted-foreground'>Create your first concept to get started.</p>
      </div>
    );
  }

  return (
    <div className='rounded-md border overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concept Name</TableHead>
              <TableHead>Concept Code</TableHead>
              {!hideTemplatesButton && <TableHead>Content</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concepts.map((concept) => (
              <TableRow
                key={concept.id}
                className='bg-background hover:bg-muted/50 transition-colors'
              >
                <TableCell className='font-medium'>
                  {concept.name || concept.conceptName}
                  {concept.description && (
                    <p className='text-xs text-muted-foreground mt-1 font-normal line-clamp-1'>
                      {concept.description}
                    </p>
                  )}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {concept.code || concept.conceptCode}
                </TableCell>
                {!hideTemplatesButton && (
                  <TableCell>
                    <ConceptContentCell
                      concept={concept}
                      onMapTemplates={onMapTemplates}
                      onViewCodingPatterns={onViewCodingPatterns}
                      onViewManualQuestions={onViewManualQuestions}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant={
                      concept.status === 'ACTIVE' || concept.isActive ? 'default' : 'secondary'
                    }
                  >
                    {concept.status === 'ACTIVE' || concept.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {new Date(concept.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onEdit(concept)}
                      title='Edit Concept'
                    >
                      <Edit2 className='h-4 w-4 text-muted-foreground hover:text-foreground' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onDeactivate(concept)}
                      title='Deactivate Concept'
                      disabled={!(concept.status === 'ACTIVE' || concept.isActive)}
                    >
                      <Trash2 className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
