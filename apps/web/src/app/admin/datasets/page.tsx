'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Database, Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useDatasets, useCreateDataset, useDeleteDataset } from '@/services/datasets/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Dataset } from '@/services/datasets/api';

import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

export default function DatasetsPage() {
  const { data: datasets, isLoading } = useDatasets();
  const { mutate: createDataset, isPending: isCreating } = useCreateDataset();
  const { mutate: deleteDataset } = useDeleteDataset();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDataset, setNewDataset] = useState({ name: '', description: '', type: 'STANDARD', topicId: '', conceptId: '' });

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(newDataset.topicId, true);

  const filteredDatasets = datasets?.filter((ds: Dataset) => 
    ds.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ds.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    createDataset({
      name: newDataset.name,
      description: newDataset.description,
      type: newDataset.type,
      topicId: newDataset.topicId || undefined,
      conceptId: newDataset.conceptId || undefined,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewDataset({ name: '', description: '', type: 'STANDARD', topicId: '', conceptId: '' });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteDataset(id);
  };

  const columns: ColumnDef<Dataset>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-md">
            <Database className="w-4 h-4" />
          </div>
          <Link href={`/admin/datasets/${row.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      header: 'Description',
      cell: (row) => (
        <span className="text-muted-foreground max-w-[300px] truncate block">
          {row.description || '-'}
        </span>
      ),
    },
    {
      header: 'Items',
      className: 'text-center',
      cell: (row) => (
        <Badge variant="secondary">
          {row._count?.items ?? 0}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      cell: (row) => (
        <span className="text-muted-foreground">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end gap-2'>
          <Link href={`/admin/datasets/${row.id}`}>
            <Button variant="ghost" size="icon" title="View Details">
              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </Link>
          <ConfirmationDialog
            title="Delete Dataset"
            description="Are you sure you want to delete this dataset? This action cannot be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button variant="ghost" size="icon" title="Delete Dataset">
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <SectionHeader
        title="Datasets"
        description="Manage your datasets and question items."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Datasets' }]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="w-4 h-4" />
            Create Dataset
          </Button>
        }
      />

      <div className="border rounded-xl bg-card shadow-sm">
          <DataTable
            columns={columns}
            data={filteredDatasets || []}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            search={
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search datasets..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-card"
                />
              </div>
            }
            emptyState={
              <EmptyState
                title="No Datasets Found"
                description={
                  searchTerm
                    ? 'No datasets matched your search.'
                    : 'Get started by creating your first dataset.'
                }
                actionLabel={searchTerm ? 'Clear Search' : 'Create Dataset'}
                onactions={searchTerm ? () => setSearchTerm('') : () => setIsCreateOpen(true)}
                className="py-12 border-0"
              />
            }
          />
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create Dataset</h2>
        </div>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Dataset Name</Label>
            <Input 
              value={newDataset.name}
              onChange={(e) => setNewDataset({...newDataset, name: e.target.value})}
              placeholder="e.g. Frontend Interview Questions"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              className="min-h-[80px]"
              value={newDataset.description}
              onChange={(e) => setNewDataset({...newDataset, description: e.target.value})}
              placeholder="Brief description..."
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={newDataset.type}
              onValueChange={(val: string) => setNewDataset({...newDataset, type: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="SCENARIO">Scenario-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic (Optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newDataset.topicId}
                onChange={(e) => setNewDataset({ ...newDataset, topicId: e.target.value, conceptId: '' })}
                disabled={isLoadingTopics}
              >
                <option value="">{isLoadingTopics ? 'Loading topics...' : 'Select Topic...'}</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Concept (Optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newDataset.conceptId}
                onChange={(e) => setNewDataset({ ...newDataset, conceptId: e.target.value })}
                disabled={!newDataset.topicId || isLoadingConcepts}
              >
                <option value="">
                  {!newDataset.topicId
                    ? 'Select a topic first'
                    : isLoadingConcepts
                      ? 'Loading concepts...'
                      : 'Select Concept...'}
                </option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.conceptName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!newDataset.name || isCreating}>
            {isCreating ? 'Creating...' : 'Create Dataset'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
