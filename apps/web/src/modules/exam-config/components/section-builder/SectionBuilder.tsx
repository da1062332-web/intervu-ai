import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { SectionCard } from './SectionCard';
import { SectionFormModal } from './SectionFormModal';
import { DeleteSectionDialog } from './DeleteSectionDialog';
import { 
  useSections, 
  useCreateSection, 
  useUpdateSection, 
  useDeleteSection 
} from '@/services/exam-sections/hooks';
import type { ExamSection, CreateSectionPayload } from '@/services/exam-sections/types';

interface SectionBuilderProps {
  configId: string;
}

export function SectionBuilder({ configId }: SectionBuilderProps) {
  const { data: sections, isLoading, isError, error, refetch } = useSections(configId);
  
  const createSection = useCreateSection(configId);
  const updateSection = useUpdateSection(configId);
  const deleteSection = useDeleteSection(configId);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleFormSubmit = (payload: CreateSectionPayload) => {
    if (selectedSection) {
      updateSection.mutate(
        { sectionId: selectedSection.id, payload },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
          },
        }
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
    let errorTitle = "Unable to load sections.";
    let errorDesc = "There was an error while fetching the sections.";

    // The error object thrown by react-query comes from apiClient, which normalizes it to NormalizedApiError
    const queryError = error as any; // Cast to access custom status property
    const status = queryError?.status;

    if (status === 400) {
      errorTitle = "Invalid Configuration ID";
      errorDesc = "The configuration ID provided is invalid.";
    } else if (status === 403) {
      errorTitle = "Permission Denied";
      errorDesc = "You do not have permission to access this configuration.";
    } else if (status === 404) {
      errorTitle = "Configuration not found";
      errorDesc = "The configuration you are looking for does not exist.";
    } else if (status === 500) {
      errorTitle = "Server error while loading sections";
      errorDesc = "An internal server error occurred. Please try again later.";
    } else if (status) {
      errorTitle = `Error ${status}`;
      errorDesc = "An unexpected error occurred while loading sections.";
    }

    return (
      <EmptyState
        title={errorTitle}
        description={errorDesc}
        actionLabel="Try again"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sections</h2>
        <Button onClick={handleOpenCreateModal}>Add Section</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : sections && sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Sections Added Yet"
          description="Create your first section."
          actionLabel="+ Add Section"
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
    </div>
  );
}
