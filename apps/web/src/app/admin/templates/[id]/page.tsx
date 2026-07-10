'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, ArrowRight, FileText, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/services/templates/hooks';

// Sections
import { BasicInfoSection } from './components/BasicInfoSection';
import { QuestionDefinitionSection } from './components/QuestionDefinitionSection';
import { VariableBuilderSection } from './components/VariableBuilderSection';
import { ConstraintBuilderSection } from './components/ConstraintBuilderSection';
import { OptionStrategySection } from './components/OptionStrategySection';
import { SolutionLogicSection } from './components/SolutionLogicSection';
import { StrategyConfigSection } from './components/StrategyConfigSection';
import { PreviewSection } from './components/PreviewSection';

type SectionType = 
  | 'basic' 
  | 'question' 
  | 'variables' 
  | 'constraints' 
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

  // Fetch the template list to find the matching template details
  const { data: response } = useTemplates(1, 100);
  const template = response?.items?.find((t: any) => t.id === id);

  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'question', label: 'Question Definition' },
    { id: 'variables', label: 'Variable Builder' },
    { id: 'constraints', label: 'Constraint Builder' },
    { id: 'options', label: 'Option Strategy' },
    { id: 'solution', label: 'Solution & Explanation' },
    { id: 'strategy', label: 'Strategy Configuration' },
    { id: 'preview', label: 'Preview' },
  ];

  const futureSections = [
    { id: 'media', label: 'Media Designer (Coming Soon)' },
    { id: 'validation', label: 'Validation Center (Coming Soon)' },
    { id: 'publishing', label: 'Publishing (Coming Soon)' },
    { id: 'analytics', label: 'Analytics (Coming Soon)' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'basic': return <BasicInfoSection template={template} />;
      case 'question': return <QuestionDefinitionSection template={template} />;
      case 'variables': return <VariableBuilderSection />;
      case 'constraints': return <ConstraintBuilderSection />;
      case 'options': return <OptionStrategySection template={template} />;
      case 'solution': return <SolutionLogicSection />;
      case 'strategy': return <StrategyConfigSection />;
      case 'preview': return <PreviewSection />;
      case 'media':
      case 'validation':
      case 'publishing':
      case 'analytics':
        return (
          <div className="p-12 text-center border rounded-lg bg-gray-50 dark:bg-gray-900 border-dashed">
            <Info className="w-8 h-8 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Future Extension Point</h3>
            <p className="text-gray-500 mt-2">This module is planned for a future release and is not yet available.</p>
          </div>
        );
      default: return <BasicInfoSection template={template} />;
    }
  };

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-[1400px]'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/admin/templates'
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </Link>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Template Editor</h1>
            <p className='text-muted-foreground'>
              Manage your template configuration across multiple domains.
            </p>
          </div>
        </div>
        {/* Primary CTA: Go to Assembly */}
        <Link href='/admin/assembly'>
          <Button className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white'>
            <ClipboardList className='w-4 h-4' />
            Generate Test Assembly
            <ArrowRight className='w-4 h-4' />
          </Button>
        </Link>
      </div>

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
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'>
                      {template.difficultyLevel ?? template.difficulty ?? 'MEDIUM'}
                    </span>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'>
                      {template.isActive ? 'Active' : 'Draft'}
                    </span>
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
              
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Future Modules</h3>
              {futureSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SectionType)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors opacity-60 ${
                    activeSection === section.id
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
