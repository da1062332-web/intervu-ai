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
import { Edit2, Trash2, Link } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConceptTableProps {
  concepts: ConceptMapping[];
  isLoading?: boolean;
  onEdit: (concept: ConceptMapping) => void;
  onDeactivate: (concept: ConceptMapping) => void;
  onMapTemplates?: (concept: ConceptMapping) => void;
  onViewManualQuestions?: (concept: ConceptMapping) => void;
  hideTemplatesButton?: boolean;
}

export function ConceptTable({
  concepts,
  isLoading,
  onEdit,
  onDeactivate,
  onMapTemplates,
  onViewManualQuestions,
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
                    <div className="flex gap-2">
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onMapTemplates?.(concept)}
                        className="h-7 text-xs px-2"
                      >
                        <Link className="h-3 w-3 mr-1" /> Templates
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onViewManualQuestions?.(concept)}
                        className="h-7 text-xs px-2"
                      >
                        <Link className="h-3 w-3 mr-1" /> Manual Qs
                      </Button>
                    </div>
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
