import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function TemplateSection({
  title,
  description,
  children,
  actions,
  className,
}: TemplateSectionProps) {
  return (
    <Card className={`w-full shadow-sm ${className || ''}`}>
      <CardHeader className='flex flex-row items-center justify-between border-b pb-4'>
        <div className='space-y-1'>
          <CardTitle className='text-xl'>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions && <div className='flex items-center space-x-2'>{actions}</div>}
      </CardHeader>
      <CardContent className='pt-6'>{children}</CardContent>
    </Card>
  );
}
