import React from 'react';
import type { ConceptMapping } from '@/services/concept-mapping';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConceptTableProps {
  concepts: ConceptMapping[];
  isLoading: boolean;
  onEdit: (concept: ConceptMapping) => void;
  onDeactivate: (concept: ConceptMapping) => void;
}

export function ConceptTable({ concepts, isLoading, onEdit, onDeactivate }: ConceptTableProps) {
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
        <table className='w-full text-sm text-left'>
          <thead className='text-xs text-muted-foreground uppercase bg-muted/50'>
            <tr>
              <th scope='col' className='px-6 py-3 font-medium'>
                Concept Name
              </th>
              <th scope='col' className='px-6 py-3 font-medium'>
                Concept Code
              </th>
              <th scope='col' className='px-6 py-3 font-medium'>
                Status
              </th>
              <th scope='col' className='px-6 py-3 font-medium'>
                Created At
              </th>
              <th scope='col' className='px-6 py-3 font-medium text-right'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {concepts.map((concept) => (
              <tr key={concept.id} className='bg-background hover:bg-muted/50 transition-colors'>
                <td className='px-6 py-4 font-medium'>
                  {concept.name || concept.conceptName}
                  {concept.description && (
                    <p className='text-xs text-muted-foreground mt-1 font-normal line-clamp-1'>
                      {concept.description}
                    </p>
                  )}
                </td>
                <td className='px-6 py-4 font-mono text-xs'>
                  {concept.code || concept.conceptCode}
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant={
                      concept.status === 'ACTIVE' || concept.isActive ? 'default' : 'secondary'
                    }
                  >
                    {concept.status === 'ACTIVE' || concept.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </td>
                <td className='px-6 py-4 text-muted-foreground'>
                  {new Date(concept.createdAt).toLocaleDateString()}
                </td>
                <td className='px-6 py-4 text-right'>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
