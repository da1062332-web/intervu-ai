import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionCard } from './SectionCard';
import { SectionFormModal } from './SectionFormModal';
import { DeleteSectionDialog } from './DeleteSectionDialog';
import { TopicMappingModal } from './TopicMappingModal';
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from '@/services/exam-sections/hooks';
import { useConfigWizardStore } from '@/features/admin/configs/components/wizard-store';
import { useBlueprints, useBlueprint } from '@/services/blueprints/hooks';
import type { ExamSection, CreateSectionPayload } from '@/services/exam-sections/types';

interface SectionBuilderProps {
  configId: string;
}

export function SectionBuilder({ configId }: SectionBuilderProps) {
  const { data: sections, isLoading, isError, error, refetch } = useSections(configId);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));
  const { data: blueprints } = useBlueprints();
  const selectedBlueprint = blueprints?.find((b) => b.id === selectedBlueprintId);
  const { data: blueprintDetail } = useBlueprint(selectedBlueprintId || '');

  const bpRawSections = (blueprintDetail as any)?.sections || (selectedBlueprint as any)?.sections;

  const displaySections: ExamSection[] = (selectedBlueprintId && Array.isArray(bpRawSections) && bpRawSections.length > 0)
    ? bpRawSections.map((sec: any, idx: number) => ({
        id: sec.sectionId || sec.id || `bp_sec_${idx}`,
        name: sec.displayName || sec.name || `Section ${idx + 1}`,
        code: sec.sectionKey || sec.code || `SEC_${idx + 1}`,
        questionCount: sec.questionCount || 10,
        sectionOrder: idx + 1,
        sectionDurationMinutes: sec.sectionDurationMinutes || 15,
        isRequired: true,
        createdAt: sec.createdAt || new Date().toISOString(),
        updatedAt: sec.updatedAt || new Date().toISOString(),
        examConfigId: configId,
      }))
    : (sections || []);

  const createSection = useCreateSection(configId);
  const updateSection = useUpdateSection(configId);
  const deleteSection = useDeleteSection(configId);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ExamSection | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedSection(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (section: ExamSection) => {
    setSelectedSection(section);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteDialog = (section: ExamSection) => {
    setSelectedSection(section);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenTopicModal = (section: ExamSection) => {
    setSelectedSection(section);
    setIsTopicModalOpen(true);
  };

  const handleFormSubmit = (payload: CreateSectionPayload) => {
    if (selectedSection) {
      updateSection.mutate(
        { sectionId: selectedSection.id, payload },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
          },
        },
      );
    } else {
      createSection.mutate(payload, {
        onSuccess: () => {
          setIsFormModalOpen(false);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSection) {
      deleteSection.mutate(selectedSection.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
        },
      });
    }
  };

  if (isError) {
    let errorTitle = 'Unable to load sections.';
    let errorDesc = 'There was an error while fetching the sections.';

    // The error object thrown by react-query comes from apiClient, which normalizes it to NormalizedApiError
    const queryError = error as { status?: number }; // Cast to access custom status property
    const status = queryError?.status;

    if (status === 400) {
      errorTitle = 'Invalid Configuration ID';
      errorDesc = 'The configuration ID provided is invalid.';
    } else if (status === 403) {
      errorTitle = 'Permission Denied';
      errorDesc = 'You do not have permission to access this configuration.';
    } else if (status === 404) {
      errorTitle = 'Configuration not found';
      errorDesc = 'The configuration you are looking for does not exist.';
    } else if (status === 500) {
      errorTitle = 'Server error while loading sections';
      errorDesc = 'An internal server error occurred. Please try again later.';
    } else if (status) {
      errorTitle = `Error ${status}`;
      errorDesc = 'An unexpected error occurred while loading sections.';
    }

    return (
      <EmptyState
        title={errorTitle}
        description={errorDesc}
        actionLabel='Try again'
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8 py-4'>
      {selectedBlueprintId && (
        <div className='p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm'>
              🔒
            </div>
            <div>
              <h4 className='text-sm font-semibold text-indigo-950 dark:text-indigo-200'>
                Pre-configured by Blueprint: {selectedBlueprint?.name || selectedBlueprint?.displayName || 'Selected Blueprint'}
              </h4>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Sections and question allocations are loaded directly from the blueprint rules in Read-Only Inspection Mode.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h3 className='text-2xl font-semibold tracking-tight'>Exam Sections</h3>
          <p className='text-muted-foreground'>
            {selectedBlueprintId
              ? 'View the pre-configured section structure for this blueprint.'
              : 'Create and manage the sections that will make up your examination structure.'}
          </p>
        </div>
        {!selectedBlueprintId && (
          <Button onClick={handleOpenCreateModal} className='shadow-sm shrink-0'>+ Add Section</Button>
        )}
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-lg' />
          ))}
        </div>
      ) : displaySections && displaySections.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {displaySections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onEdit={selectedBlueprintId ? undefined : handleOpenEditModal}
              onDelete={selectedBlueprintId ? undefined : handleOpenDeleteDialog}
              onManageTopics={selectedBlueprintId ? undefined : handleOpenTopicModal}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title='No Sections Added Yet'
          description='Create your first section.'
          actionLabel='+ Add Section'
          onAction={handleOpenCreateModal}
        />
      )}

      <SectionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedSection}
        isLoading={createSection.isPending || updateSection.isPending}
      />

      <DeleteSectionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteSection.isPending}
      />

      <TopicMappingModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        section={selectedSection}
      />
    </div>
  );
}
