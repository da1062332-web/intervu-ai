import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useTemplates } from '@/services/templates/hooks';
import { type ConceptMapping } from '@/services/concept-mapping';
import { toast } from 'sonner';

interface TemplateMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept: ConceptMapping | null;
}

export function TemplateMappingModal({ isOpen, onClose, concept }: TemplateMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // We fetch page 1, large limit for now to support search/filter until API supports proper search
  const { data, isLoading, isError } = useTemplates(1, 100);
  const templates = data?.data || data || []; // Adjust based on actual API response structure

  const filteredTemplates = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return [];
    if (!searchQuery.trim()) return templates;
    
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t: any) =>
        (t.name || '').toLowerCase().includes(query) ||
        (t.templateKey || '').toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Mock saving the assignment
  const handleSave = async () => {
    if (!concept) return;
    setIsSaving(true);
    
    try {
      // TODO: Replace with real API call once Backend completes Phase 0 implementation
      // await conceptMappingApi.assignTemplates(concept.id, Array.from(selectedTemplateIds));
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
      toast.success(`Assigned ${selectedTemplateIds.size} templates to ${concept.name || concept.conceptName}`);
      
      // Update local storage for demo purposes if needed, but for now we just show success
      onClose();
    } catch (error) {
      toast.error('Failed to assign templates');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (templateId: string) => {
    setSelectedTemplateIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  if (!concept) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Map Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assign templates to concept: <strong>{concept.name || concept.conceptName}</strong>
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="border rounded-md min-h-[300px] max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-48 text-red-500">
              Failed to load templates.
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex justify-center items-center h-48 text-muted-foreground">
              No templates found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-12">
                    {/* Select All Checkbox could go here */}
                  </th>
                  <th className="px-4 py-3">Template Name</th>
                  <th className="px-4 py-3">Key / ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTemplates.map((template: any) => {
                  const id = template.id || template.templateKey;
                  const isSelected = selectedTemplateIds.has(id);
                  return (
                    <tr 
                      key={id} 
                      className={`hover:bg-muted/30 cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleSelection(id)}
                    >
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={isSelected}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {template.name || 'Unnamed Template'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {template.templateKey || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {template.isActive !== false ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedTemplateIds.size} templates selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Assignments
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
