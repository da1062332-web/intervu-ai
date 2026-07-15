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

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem({ itemId, datasetId: id });
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;
  }

  if (!dataset) {
    return <div className="p-8 text-center text-gray-500">Dataset not found.</div>;
  }

  return (
    <div className="container mx-auto py-6 max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/datasets" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              <h1 className="text-2xl font-bold tracking-tight">{dataset.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Manage dataset details and items.</p>
          </div>
        </div>
      </div>

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
                  <textarea 
                    className="w-full flex min-h-[100px] rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    className="w-full flex h-10 rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="SCENARIO">Scenario-based</option>
                  </select>
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
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-500">ID</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Content</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Topic</th>
                      <th className="px-6 py-3 font-medium text-gray-500 text-center">Difficulty</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Created</th>
                      <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {dataset.items?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No items in this dataset. Add one or use bulk upload.
                        </td>
                      </tr>
                    ) : (
                      dataset.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.id.slice(0, 8)}...</td>
                          <td className="px-6 py-4 max-w-[300px] truncate text-gray-700 dark:text-gray-300">
                            {item.content}
                          </td>
                          <td className="px-6 py-4">{item.topic}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800">
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
            <select 
              className="w-full flex h-10 rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItem.difficulty}
              onChange={e => setNewItem({...newItem, difficulty: e.target.value})}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <textarea 
              className="w-full flex min-h-[100px] rounded-md border border-gray-300 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <textarea 
              className="w-full flex min-h-[250px] font-mono rounded-md border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
