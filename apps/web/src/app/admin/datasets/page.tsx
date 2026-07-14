'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Database, Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useDatasets, useCreateDataset, useDeleteDataset } from '@/services/datasets/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import type { Dataset } from '@/services/datasets/api';

export default function DatasetsPage() {
  const { data: datasets, isLoading } = useDatasets();
  const { mutate: createDataset, isPending: isCreating } = useCreateDataset();
  const { mutate: deleteDataset } = useDeleteDataset();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDataset, setNewDataset] = useState({ name: '', description: '', type: 'STANDARD' });

  const filteredDatasets = datasets?.filter((ds: Dataset) => 
    ds.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ds.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    createDataset(newDataset, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewDataset({ name: '', description: '', type: 'STANDARD' });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      deleteDataset(id);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
          <p className="text-muted-foreground">
            Manage your datasets and question items.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Dataset
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-950 p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search datasets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Description</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-center">Items</th>
              <th className="px-6 py-3 font-medium text-gray-500">Created At</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading datasets...</td>
              </tr>
            ) : filteredDatasets?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No datasets found.</td>
              </tr>
            ) : (
              filteredDatasets?.map((ds: Dataset) => (
                <tr key={ds.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-md">
                        <Database className="w-4 h-4" />
                      </div>
                      <Link href={`/admin/datasets/${ds.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        {ds.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-[300px] truncate">
                    {ds.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {ds._count?.items ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(ds.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/datasets/${ds.id}`} className="flex items-center cursor-pointer">
                            <Eye className="w-4 h-4 mr-2 text-gray-500" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(ds.id)} className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            <textarea 
              className="w-full flex min-h-[80px] rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDataset.description}
              onChange={(e) => setNewDataset({...newDataset, description: e.target.value})}
              placeholder="Brief description..."
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select 
              className="w-full flex h-10 rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newDataset.type}
              onChange={(e) => setNewDataset({...newDataset, type: e.target.value})}
            >
              <option value="STANDARD">Standard</option>
              <option value="SCENARIO">Scenario-based</option>
            </select>
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
