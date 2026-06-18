import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ExamSection } from '@/services/exam-sections/types';

interface SectionCardProps {
  section: ExamSection;
  onEdit: (section: ExamSection) => void;
  onDelete: (section: ExamSection) => void;
}

import Link from 'next/link';

export function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <CardTitle>{section.name}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 space-y-2 text-sm text-gray-600 dark:text-gray-400'>
        <p>Questions: {section.questionCount}</p>
        <p>Duration: {section.durationMinutes} mins</p>
        <p>Order: {section.displayOrder}</p>
      </CardContent>
      <CardFooter className='gap-2 flex-wrap'>
        <Button variant='outline' size='sm' onClick={() => onEdit(section)}>
          Edit
        </Button>
        <Button variant='destructive' size='sm' onClick={() => onDelete(section)}>
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
