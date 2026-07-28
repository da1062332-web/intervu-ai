'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, ArrowRight, FileText, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTemplate } from '@/services/templates/hooks';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

// Sections
import { BasicInfoSection } from './components/BasicInfoSection';
import { QuestionDefinitionSection } from './components/QuestionDefinitionSection';
import { VariableBuilderSection } from './components/VariableBuilderSection';
import { ConstraintBuilderSection } from './components/ConstraintBuilderSection';
import { GenerationStrategySection } from './components/GenerationStrategySection';
import { OptionStrategySection } from './components/OptionStrategySection';
import { SolutionLogicSection } from './components/SolutionLogicSection';
import { DatasetConfigurationSection } from './components/DatasetConfigurationSection';
import { PreviewSection } from './components/PreviewSection';
import { DatasetQuestionDefinitionSection } from './components/DatasetQuestionDefinitionSection';

type SectionType = 
  | 'basic' 
  | 'question' 
  | 'variables' 
  | 'constraints' 
  | 'generation-strategy' 
  | 'options' 
  | 'solution' 
  | 'strategy'
  | 'preview' 
  | 'media' 
  | 'validation' 
  | 'publishing' 
  | 'analytics';

export default function TemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const [activeSection, setActiveSection] = useState<SectionType>('basic');

  // Fetch the full template details
  const { data: response, isLoading, isError } = useTemplate(id);
  const template = response?.data || response;

  const strategy = template?.generationStrategy || 'VARIABLE';
  const showLegacyBuilderPages = false; // hide old Variable Builder / Constraint Builder pages in the live editor

  if (isLoading) {
    return (
      <div className='mt-8'>
        <DetailPageSkeleton />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl h-[50vh]'>
        <EmptyState
          variant='error'
          title='Error loading template'
          description='We could not load the template details.'
          className='border rounded-md'
        />
      </div>
    );
  }

  const sections: { id: SectionType; label: string }[] = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'question', label: 'Question Definition' },
  ];

  if (strategy === 'DATASET' || strategy === 'HYBRID') {
    sections.push({ id: 'dataset-config' as SectionType, label: 'Dataset Configuration' });
  }

  if (strategy === 'VARIABLE' || strategy === 'HYBRID') {
    sections.push({ id: 'generation-strategy', label: 'Generation Strategy' });
    if (showLegacyBuilderPages) {
      sections.push({ id: 'variables', label: 'Variable Builder' });
      sections.push({ id: 'constraints', label: 'Constraint Builder' });
    }
  }

  if (strategy !== 'DATASET') {
    sections.push(
      { id: 'options', label: 'Option Strategy' },
      { id: 'solution', label: 'Solution & Explanation' },
      { id: 'preview', label: 'Preview' }
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'basic': return <BasicInfoSection template={template} />;
      case 'question': 
        return strategy === 'DATASET' ? (
          <DatasetQuestionDefinitionSection template={template} />
        ) : (
          <QuestionDefinitionSection template={template} />
        );
      case 'dataset-config' as SectionType: return <DatasetConfigurationSection template={template} />;
      case 'generation-strategy': return <GenerationStrategySection />;
      case 'variables':
        return showLegacyBuilderPages ? (
          <VariableBuilderSection />
        ) : (
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-900'>
            Legacy Variable Builder is hidden. Use the Generation Strategy tab instead.
          </div>
        );
      case 'constraints':
        return showLegacyBuilderPages ? (
          <ConstraintBuilderSection />
        ) : (
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-900'>
            Legacy Constraint Builder is hidden. Use the Generation Strategy tab instead.
          </div>
        );
      case 'options': return <OptionStrategySection template={template} />;
      case 'solution': return <SolutionLogicSection template={template} />;
      case 'preview': return <PreviewSection template={template} />;
      default: return <BasicInfoSection template={template} />;
    }
  };

  return (
    <div className='container mx-auto space-y-6 max-w-[1400px]'>
      <SectionHeader
        title='Template Editor'
        description='Manage your template configuration across multiple domains.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Templates', href: '/admin/templates' },
          { label: 'Editor', /* active: true */ },
        ]}
        actions={
          <Link href='/admin/assembly'>
            <Button className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white'>
              <ClipboardList className='w-4 h-4' />
              Generate Test Assembly
              <ArrowRight className='w-4 h-4' />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Local Navigation Sidebar */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Template Info Card */}
          {template && (
            <div className='flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 shrink-0'>
                  <FileText className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                </div>
                <div>
                  <h2 className='font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1'>
                    {template.name}
                  </h2>
                  {template.conceptKey && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                      Concept: {template.conceptKey}
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Badge variant='outline' className='text-[10px] uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'>
                      {template.difficultyLevel ?? template.difficulty ?? 'MEDIUM'}
                    </Badge>
                    <Badge variant={template.isActive ? 'outline' : 'secondary'} className='text-[10px] uppercase'>
                      {template.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border rounded-lg p-2 shadow-sm">
            <nav className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Core Settings</h3>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SectionType)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-9">
          {renderSection()}
        </div>

      </div>
    </div>
  );
}
