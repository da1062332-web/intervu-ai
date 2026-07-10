import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useTemplates, useTemplatesByConcept } from '@/services/templates/hooks';
import { type ConceptMapping } from '@/services/concept-mapping';
import { conceptMappingApi } from '@/services/concept-mapping/api';
import { toast } from 'sonner';

interface TemplateMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept: ConceptMapping | null;
}

export function TemplateMappingModal({ isOpen, onClose, concept }: TemplateMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch all templates to allow mapping
  const { data, isLoading, isError } = useTemplates(1, 100);
  const templates = data?.items || data?.data || (Array.isArray(data) ? data : []);

  // Fetch already assigned templates for this concept
  const { data: assignedData, isLoading: isAssignedLoading } = useTemplatesByConcept(
    concept?.code || concept?.conceptCode || '',
    1,
    100
  );

  // Initialize selectedTemplateIds with assigned templates when they load
  React.useEffect(() => {
    if (isOpen && assignedData?.items) {
      const assignedIds = assignedData.items.map((t: any) => t.id || t.templateKey);
      setSelectedTemplateIds(new Set(assignedIds));
    }
  }, [assignedData, isOpen]);

  const filteredTemplates = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return [];
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t: any) =>
        (t.name || '').toLowerCase().includes(query) ||
        (t.templateKey || '').toLowerCase().includes(query),
    );
  }, [templates, searchQuery]);

  const handleToggleMapping = async (templateId: string, isMapped: boolean) => {
    if (!concept) return;
    
    setProcessingId(templateId);
    const newMappedIds = Array.from(selectedTemplateIds);
    if (isMapped) {
      // Remove template
      const index = newMappedIds.indexOf(templateId);
      if (index > -1) newMappedIds.splice(index, 1);
    } else {
      // Add template
      if (!newMappedIds.includes(templateId)) {
        newMappedIds.push(templateId);
      }
    }

    try {
      await conceptMappingApi.assignTemplates(concept.id, newMappedIds);
      setSelectedTemplateIds(new Set(newMappedIds));
      toast.success(isMapped ? 'Template unmapped successfully' : 'Template mapped successfully');
    } catch (error) {
      toast.error(isMapped ? 'Failed to unmap template' : 'Failed to map template');
    } finally {
      setProcessingId(null);
    }
  };

  if (!concept) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-3xl'>
      <div className='space-y-6'>
        <div>
          <h2 className='text-lg font-semibold'>Map Templates</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Assign templates to concept: <strong>{concept.name || concept.conceptName}</strong>
          </p>
        </div>

        <div className='relative'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search templates...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='border rounded-md min-h-[300px] max-h-[400px] overflow-y-auto'>
          {isLoading ? (
            <div className='flex justify-center items-center h-48'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : isError ? (
            <div className='flex justify-center items-center h-48 text-red-500'>
              Failed to load templates.
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className='flex justify-center items-center h-48 text-muted-foreground'>
              No templates found.
            </div>
          ) : (
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground bg-muted/50 sticky top-0'>
                <tr>
                  <th className='px-4 py-3'>Template Name</th>
                  <th className='px-4 py-3'>Key / ID</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filteredTemplates.map((template: any) => {
                  const id = template.id || template.templateKey;
                  const isSelected = selectedTemplateIds.has(id);
                  return (
                    <tr
                      key={id}
                      className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className='px-4 py-3 font-medium'>
                        {template.name || 'Unnamed Template'}
                      </td>
                      <td className='px-4 py-3 font-mono text-xs text-muted-foreground'>
                        {template.templateKey || '-'}
                      </td>
                      <td className='px-4 py-3'>
                        {isSelected ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Already Mapped
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            Available
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <Button 
                          variant={isSelected ? "destructive" : "default"}
                          size="sm"
                          disabled={processingId === id}
                          onClick={() => handleToggleMapping(id, isSelected)}
                        >
                          {processingId === id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          {processingId === id 
                            ? (isSelected ? 'Unmapping...' : 'Mapping...') 
                            : (isSelected ? 'Unmap' : 'Map')
                          }
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className='flex justify-between items-center'>
          <div className='text-sm text-muted-foreground'>
            {selectedTemplateIds.size} templates mapped to this concept
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
