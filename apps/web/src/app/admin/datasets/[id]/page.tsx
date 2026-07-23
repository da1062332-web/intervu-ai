'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Upload, Trash2, Database } from 'lucide-react';
import { format } from 'date-fns';
import { 
  useDataset, 
  useUpdateDataset, 
  useAddDatasetItem, 
  useBulkAddDatasetItems, 
  useDeleteDatasetItem 
} from '@/services/datasets/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
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

type Tab = 'basic' | 'items';

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  
  const { data: dataset, isLoading } = useDataset(id);
  const { mutate: updateDataset, isPending: isUpdating } = useUpdateDataset();
  const { mutate: addItem, isPending: isAdding } = useAddDatasetItem();
  const { mutate: bulkAddItems, isPending: isBulkAdding } = useBulkAddDatasetItems();
  const { mutate: deleteItem } = useDeleteDatasetItem();

  // Basic Info Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  
  // Initialize form when data loads
  useState(() => {
    if (dataset) {
      setName(dataset.name || '');
      setDescription(dataset.description || '');
      setType(dataset.type || '');
    }
  });

  // Since useState initial state only runs once, we use this to sync:
  if (dataset && name === '' && !isLoading) {
    setName(dataset.name || '');
    setDescription(dataset.description || '');
    setType(dataset.type || '');
  }

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // New Item State
  const [newItem, setNewItem] = useState({ topic: '', difficulty: 'MEDIUM', content: '', tags: '' });
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState('');

  const handleUpdate = () => {
    updateDataset({ id, payload: { name, description, type } });
  };

  const handleAddItem = () => {
    addItem({
      datasetId: id,
      payload: {
        topic: newItem.topic,
        difficulty: newItem.difficulty,
        content: newItem.content,
        tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewItem({ topic: '', difficulty: 'MEDIUM', content: '', tags: '' });
      }
    });
  };

  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        setBulkError('JSON must be an array of objects.');
        return;
      }
      
      const payload = parsed.map(item => ({
        topic: item.topic || 'General',
        difficulty: item.difficulty || 'MEDIUM',
        content: typeof item === 'object' && !item.content ? JSON.stringify(item) : (item.content || JSON.stringify(item)),
        tags: Array.isArray(item.tags) ? item.tags : [],
        metadata: item
      }));

      bulkAddItems({ datasetId: id, payload }, {
        onSuccess: () => {
          setIsBulkOpen(false);
          setBulkJson('');
          setBulkError('');
        }
      });
    } catch (e) {
      setBulkError('Invalid JSON format.');
    }
  };

  const itemColumns: ColumnDef<any>[] = [
    {
      header: 'ID',
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}...</span>,
    },
    {
      header: 'Content',
      cell: (row) => <span className="max-w-[300px] truncate block text-foreground">{row.content}</span>,
    },
    {
      header: 'Topic',
      id: 'topic', cell: (row: any) => row.topic,
    },
    {
      header: 'Difficulty',
      className: 'text-center',
      cell: (row) => (
        <Badge variant={row.difficulty === 'HARD' ? 'destructive' : row.difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
          {row.difficulty}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      cell: (row) => <span className="text-muted-foreground">{format(new Date(row.createdAt), 'MMM d, yyyy')}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end'>
          <ConfirmationDialog
            title="Delete Item"
            description="Are you sure you want to delete this dataset item?"
            confirmLabel="Delete"
            destructive
            onConfirm={() => deleteItem({ itemId: row.id, datasetId: id })}
            trigger={
              <Button variant="ghost" size="icon" title="Delete Item">
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <DetailPageSkeleton />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex-1 p-8">
        <EmptyState title="Dataset Not Found" description="The dataset you're looking for does not exist." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <SectionHeader
        title={dataset.name}
        description="Manage dataset details and items."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Datasets', href: '/admin/datasets' },
          { label: dataset.name },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-gray-900 border rounded-lg p-2 shadow-sm">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('basic')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'basic'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'items'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Dataset Items
                <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {dataset.items?.length || 0}
                </span>
              </button>
            </nav>
          </div>
        </div>

        <div className="md:col-span-9">
          {activeTab === 'basic' && (
            <div className="border rounded-lg bg-white dark:bg-gray-900 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Basic Information</h2>
                <p className="text-sm text-gray-500">Update dataset details.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label>Dataset Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    className="min-h-[100px]"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="SCENARIO">Scenario-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdate} disabled={isUpdating || !name}>
                  {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="border rounded-lg bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Dataset Items</h2>
                  <p className="text-sm text-gray-500">Manage the individual records in this dataset.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" /> Bulk Upload
                  </Button>
                  <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
              </div>
              
              <div className="p-0 border-t">
                <DataTable
                  columns={itemColumns}
                  data={dataset.items || []}
                  emptyState={
                    <EmptyState
                      title="No Dataset Items"
                      description="No items in this dataset. Add one or use bulk upload."
                      className="py-12 border-0"
                    />
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Single Item Dialog */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Add Dataset Item</h2>
        </div>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input 
              value={newItem.topic}
              onChange={e => setNewItem({...newItem, topic: e.target.value})}
              placeholder="e.g. JavaScript Arrays"
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={newItem.difficulty} onValueChange={(val: string) => setNewItem({...newItem, difficulty: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea 
              className="min-h-[100px]"
              value={newItem.content}
              onChange={e => setNewItem({...newItem, content: e.target.value})}
              placeholder="The actual data content..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input 
              value={newItem.tags}
              onChange={e => setNewItem({...newItem, tags: e.target.value})}
              placeholder="e.g. frontend, react"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} disabled={!newItem.content || isAdding}>
            {isAdding ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </Modal>

      {/* Bulk Upload Dialog */}
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} className="max-w-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Bulk Upload Items</h2>
        </div>
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm">
            <p>Provide a JSON array of objects. Each object represents an item.</p>
            <pre className="mt-2 text-xs opacity-70">
{`[
  {
    "topic": "Math",
    "difficulty": "EASY",
    "content": "What is 2+2?",
    "tags": ["math", "addition"],
    "answer": "4"
  }
]`}
            </pre>
          </div>
          {bulkError && <div className="text-red-500 text-sm font-medium">{bulkError}</div>}
          <div className="space-y-2">
            <Label>JSON Data</Label>
            <Textarea 
              className="min-h-[250px] font-mono"
              value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
              placeholder="[\n  { ... }\n]"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkUpload} disabled={!bulkJson || isBulkAdding}>
            {isBulkAdding ? 'Uploading...' : 'Upload Items'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
