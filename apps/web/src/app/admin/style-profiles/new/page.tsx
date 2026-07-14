import React from 'react';
import { StyleProfileForm } from '@/features/style-profiles/components/StyleProfileForm';

export const metadata = {
  title: 'Create Style Profile | Admin',
  description: 'Create a new question generation style profile',
};

export default function NewStyleProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <StyleProfileForm />
    </div>
  );
}
