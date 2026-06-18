import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import type { ExamSection } from '@/services/exam-sections/types';

interface SectionCardProps {
  section: ExamSection;
  onEdit: (section: ExamSection) => void;
  onDelete: (section: ExamSection) => void;
}

import Link from 'next/link';

export function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
  return (
    <Card className='flex flex-col h-full bg-card'>
      <CardHeader className='pb-3 flex flex-row items-start justify-between space-y-0'>
        <div className='flex items-center space-x-2'>
          <div className='cursor-move text-muted-foreground'>
            <GripVertical className='w-4 h-4' />
          </div>
          <div>
            <CardTitle className='text-base font-semibold leading-none tracking-tight'>
              {section.name}
            </CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>Code: {section.code || 'N/A'}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pb-4 flex-grow'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground mb-1'>Questions</p>
            <p className='font-medium'>{section.questionCount}</p>
          </div>
          <div>
            <p className='text-muted-foreground mb-1'>Duration</p>
            <p className='font-medium'>{section.sectionDurationMinutes} mins</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className='pt-0 flex justify-end space-x-2'>
        <Button variant='ghost' size='sm' onClick={() => onEdit(section)}>
          <Edit2 className='w-4 h-4 mr-1' />
          Edit
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
          onClick={() => onDelete(section)}
        >
          <Trash2 className='w-4 h-4 mr-1' />
          Delete
        </Button>
        <Link href={`/admin/sections/${section.id}/topics`} className='w-full mt-2'>
          <Button variant='default' size='sm' className='w-full'>
            Manage Topics
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
