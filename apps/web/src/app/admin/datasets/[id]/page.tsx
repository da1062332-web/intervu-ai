'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Upload, Trash2, Database, Download, FileSpreadsheet, Code, CheckCircle, AlertCircle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { 
  useDataset, 
  useUpdateDataset, 
  useAddDatasetItem, 
  useBulkAddDatasetItems, 
  useDeleteDatasetItem,
  useUpdateDatasetItem
} from '@/services/datasets/hooks';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
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
type BulkTab = 'file' | 'json';

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
  const { mutate: updateDatasetItem, isPending: isUpdatingItem } = useUpdateDatasetItem();

  // Basic Info Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [topicId, setTopicId] = useState('');
  const [conceptId, setConceptId] = useState('');

  // Main Dataset Table Edit Item Modal State
  const [editingServerItem, setEditingServerItem] = useState<any | null>(null);
  const [isEditServerItemOpen, setIsEditServerItemOpen] = useState(false);
  const [editServerItemForm, setEditServerItemForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    selectedCorrect: 0,
    difficulty: 'MEDIUM',
    explanation: '',
  });

  const handleOpenEditServerItem = (row: any) => {
    setEditingServerItem(row);
    const opts = row.options && row.options.length > 0 ? [...row.options] : ['', '', '', ''];
    while (opts.length < 4) opts.push('');

    let correctIdx = opts.findIndex(o => o && o.trim().toLowerCase() === (row.answer || '').trim().toLowerCase());
    if (correctIdx === -1) correctIdx = 0;

    setEditServerItemForm({
      questionText: row.questionText || row.content || '',
      options: opts,
      selectedCorrect: correctIdx,
      difficulty: row.difficulty || 'MEDIUM',
      explanation: row.explanation || '',
    });
    setIsEditServerItemOpen(true);
  };

  const handleSaveServerItemEdit = () => {
    if (!editingServerItem) return;
    const cleanOptions = editServerItemForm.options.filter(o => o && o.trim() !== '');
    const answer = editServerItemForm.options[editServerItemForm.selectedCorrect] || editServerItemForm.options[0] || '';

    if (cleanOptions.length > 0 && answer) {
      const match = cleanOptions.some(o => o.trim().toLowerCase() === answer.trim().toLowerCase());
      if (!match) {
        setBulkError('The selected correct answer must match one of the option choices.');
        return;
      }
    }

    updateDatasetItem({
      itemId: editingServerItem.id,
      datasetId: id,
      payload: {
        questionText: editServerItemForm.questionText,
        content: editServerItemForm.questionText,
        options: cleanOptions,
        answer: answer,
        difficulty: editServerItemForm.difficulty,
        explanation: editServerItemForm.explanation,
      }
    }, {
      onSuccess: () => {
        setIsEditServerItemOpen(false);
        setEditingServerItem(null);
      }
    });
  };

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(topicId, true);
  
  // Sync state when dataset loads
  if (dataset && name === '' && !isLoading) {
    setName(dataset.name || '');
    setDescription(dataset.description || '');
    setType(dataset.type || '');
    setTopicId(dataset.topicId || '');
    setConceptId(dataset.conceptId || '');
  }

  // Single Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemQuestionText, setItemQuestionText] = useState('');
  const [itemOptions, setItemOptions] = useState<string[]>(['', '', '', '']);
  const [itemSelectedCorrect, setItemSelectedCorrect] = useState<number>(0);
  const [itemDifficulty, setItemDifficulty] = useState('MEDIUM');
  const [itemExplanation, setItemExplanation] = useState('');

  // Bulk Upload Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<BulkTab>('file');
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [parsedPreviewItems, setParsedPreviewItems] = useState<any[]>([]);

  // Edit Preview Item Modal State
  const [editingPreviewIdx, setEditingPreviewIdx] = useState<number | null>(null);
  const [editPreviewModalOpen, setEditPreviewModalOpen] = useState(false);
  const [editPreviewData, setEditPreviewData] = useState({
    questionText: '',
    options: ['', '', '', ''],
    selectedCorrect: 0,
    difficulty: 'MEDIUM',
    explanation: '',
  });

  const handleOpenEditPreview = (idx: number) => {
    const item = parsedPreviewItems[idx];
    if (!item) return;
    const opts = item.options && item.options.length > 0 ? [...item.options] : ['', '', '', ''];
    while (opts.length < 4) opts.push('');
    
    let correctIdx = opts.findIndex(o => o && o.trim().toLowerCase() === (item.answer || '').trim().toLowerCase());
    if (correctIdx === -1) correctIdx = 0;

    setEditingPreviewIdx(idx);
    setEditPreviewData({
      questionText: item.questionText || item.content || '',
      options: opts,
      selectedCorrect: correctIdx,
      difficulty: item.difficulty || 'MEDIUM',
      explanation: item.explanation || '',
    });
    setEditPreviewModalOpen(true);
  };

  const handleSavePreviewEdit = () => {
    if (editingPreviewIdx === null) return;
    const cleanOptions = editPreviewData.options.filter(o => o && o.trim() !== '');
    const answer = editPreviewData.options[editPreviewData.selectedCorrect] || editPreviewData.options[0] || '';
    
    const isAnswerValid = cleanOptions.length === 0 || !answer || cleanOptions.some(o => o.trim().toLowerCase() === answer.trim().toLowerCase());

    const updated = [...parsedPreviewItems];
    updated[editingPreviewIdx] = {
      ...updated[editingPreviewIdx],
      questionText: editPreviewData.questionText,
      content: editPreviewData.questionText,
      options: cleanOptions,
      answer: answer,
      difficulty: editPreviewData.difficulty,
      explanation: editPreviewData.explanation,
      isValid: isAnswerValid,
      validationError: isAnswerValid ? undefined : `Correct answer "${answer}" does not match any option choice`,
    };

    setParsedPreviewItems(updated);
    setEditPreviewModalOpen(false);
    setEditingPreviewIdx(null);

    // Clear bulkError if all items are now valid
    if (!updated.some(i => !i.isValid)) {
      setBulkError('');
    }
  };

  const handleUpdate = () => {
    updateDataset({ 
      id, 
      payload: { 
        name, 
        description, 
        type, 
        topicId: topicId || undefined, 
        conceptId: conceptId || undefined 
      } 
    });
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...itemOptions];
    updated[idx] = val;
    setItemOptions(updated);
  };

  const handleAddItem = () => {
    const cleanOptions = itemOptions.filter(o => o && o.trim() !== '');
    const answer = itemOptions[itemSelectedCorrect] || itemOptions[0] || '';

    if (cleanOptions.length > 0 && answer) {
      const match = cleanOptions.some(o => o.trim().toLowerCase() === answer.trim().toLowerCase());
      if (!match) {
        setBulkError('The selected correct answer must match one of the option choices.');
        return;
      }
    }

    addItem({
      datasetId: id,
      payload: {
        questionText: itemQuestionText,
        content: itemQuestionText,
        options: cleanOptions,
        answer: answer,
        explanation: itemExplanation,
        difficulty: itemDifficulty,
        topicId: dataset?.topicId || undefined,
        conceptId: dataset?.conceptId || undefined,
        topic: 'General',
        tags: [],
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setItemQuestionText('');
        setItemOptions(['', '', '', '']);
        setItemSelectedCorrect(0);
        setItemDifficulty('MEDIUM');
        setItemExplanation('');
      }
    });
  };

  // CSV Parsing Helper Function
  const parseCsvText = (csvText: string) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const items: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split respecting CSV strings
      const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || !cols[0]) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || '';
      });

      const questionText = obj['question text'] || obj['questiontext'] || obj['content'] || obj['question'] || cols[0];
      const optA = obj['option a'] || obj['optiona'] || obj['option 1'] || cols[1] || '';
      const optB = obj['option b'] || obj['optionb'] || obj['option 2'] || cols[2] || '';
      const optC = obj['option c'] || obj['optionc'] || obj['option 3'] || cols[3] || '';
      const optD = obj['option d'] || obj['optiond'] || obj['option 4'] || cols[4] || '';
      const options = [optA, optB, optC, optD].filter(Boolean);
      const answer = obj['correct answer'] || obj['answer'] || cols[5] || optA || '';

      const isAnswerValid = options.length === 0 || !answer || options.some(o => o.trim().toLowerCase() === answer.trim().toLowerCase());

      items.push({
        topic: 'General',
        topicId: dataset?.topicId || undefined,
        conceptId: dataset?.conceptId || undefined,
        difficulty: (obj['difficulty'] || cols[6] || 'MEDIUM').toUpperCase(),
        questionText: questionText,
        content: questionText,
        options: options,
        answer: answer,
        explanation: obj['explanation'] || cols[7] || '',
        tags: [],
        isValid: isAnswerValid,
        validationError: isAnswerValid ? undefined : `Correct answer "${answer}" does not match any option choice`,
      });
    }

    return items;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvText(text);
        const invalidCount = parsed.filter(i => !i.isValid).length;
        if (parsed.length === 0) {
          setBulkError('No valid items found in CSV file. Please check column headers.');
        } else if (invalidCount > 0) {
          setBulkError(`Warning: ${invalidCount} item(s) contain answers that do not match their option choices.`);
        }
        setParsedPreviewItems(parsed);
      } catch (err) {
        setBulkError('Failed to parse file. Please upload a valid CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleCsv = `Question Text,Option A,Option B,Option C,Option D,Correct Answer,Difficulty,Explanation
What is the time complexity of searching in an unsorted array?,O(1),O(N),O(N log N),O(N^2),O(N),MEDIUM,Searching an unsorted array requires checking each element sequentially.
Which keyword declares a block-scoped variable in modern JS?,var,let,const,static,let,EASY,let creates block-scoped variables.`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dataset_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = () => {
    setBulkError('');
    let itemsToUpload: any[] = [];

    if (bulkTab === 'file') {
      if (parsedPreviewItems.length === 0) {
        setBulkError('Please upload a valid CSV file first.');
        return;
      }
      const invalidItems = parsedPreviewItems.filter(i => !i.isValid);
      if (invalidItems.length > 0) {
        setBulkError(`Cannot upload: ${invalidItems.length} item(s) have answers that do not match any of their 4 option choices.`);
        return;
      }
      itemsToUpload = parsedPreviewItems.map(item => ({
        ...item,
        topicId: item.topicId || dataset?.topicId || undefined,
        conceptId: item.conceptId || dataset?.conceptId || undefined,
      }));
    } else {
      try {
        const parsed = JSON.parse(bulkJson);
        if (!Array.isArray(parsed)) {
          setBulkError('JSON must be an array of item objects.');
          return;
        }

        for (let idx = 0; idx < parsed.length; idx++) {
          const item = parsed[idx];
          const opts = Array.isArray(item.options) ? item.options : [];
          const ans = item.answer || item.correctAnswer || '';
          if (opts.length > 0 && ans) {
            const matches = opts.some((o: string) => o.trim().toLowerCase() === ans.trim().toLowerCase());
            if (!matches) {
              setBulkError(`Item ${idx + 1}: Correct answer "${ans}" does not match any of its option choices [${opts.join(', ')}]`);
              return;
            }
          }
        }

        itemsToUpload = parsed.map(item => ({
          topic: item.topic || 'General',
          topicId: item.topicId || dataset?.topicId || undefined,
          conceptId: item.conceptId || dataset?.conceptId || undefined,
          difficulty: item.difficulty || 'MEDIUM',
          questionText: item.questionText || item.content || JSON.stringify(item),
          content: item.content || item.questionText || JSON.stringify(item),
          options: Array.isArray(item.options) ? item.options : [],
          answer: item.answer || item.correctAnswer || '',
          explanation: item.explanation || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          metadata: item
        }));
      } catch (e) {
        setBulkError('Invalid JSON format.');
        return;
      }
    }

    bulkAddItems({ datasetId: id, payload: itemsToUpload }, {
      onSuccess: () => {
        setIsBulkOpen(false);
        setBulkJson('');
        setParsedPreviewItems([]);
        setBulkError('');
      }
    });
  };

  const itemColumns: ColumnDef<any>[] = [
    {
      header: 'Question / Content',
      cell: (row) => (
        <span className="max-w-[320px] truncate block font-medium text-foreground" title={row.questionText || row.content}>
          {row.questionText || row.content}
        </span>
      ),
    },
    {
      header: 'Options',
      cell: (row) => {
        const opts = row.options || [];
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs font-mono">
              {opts.length > 0 ? `${opts.length} Options` : 'N/A'}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Answer',
      cell: (row) => (
        <span className="max-w-[150px] truncate block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {row.answer || '-'}
        </span>
      ),
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
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end items-center gap-1'>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Edit Item"
            onClick={() => handleOpenEditServerItem(row)}
          >
            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Topic (Optional)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={topicId}
                      onChange={(e) => {
                        setTopicId(e.target.value);
                        setConceptId('');
                      }}
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
                      value={conceptId}
                      onChange={(e) => setConceptId(e.target.value)}
                      disabled={!topicId || isLoadingConcepts}
                    >
                      <option value="">
                        {!topicId
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

      {/* Add Single Item MCQ Dialog */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Add Dataset Item (MCQ)</h2>
          <p className="text-sm text-muted-foreground">Add a new structured multiple choice question item to this dataset.</p>
        </div>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <Textarea 
              className="min-h-[90px]"
              value={itemQuestionText}
              onChange={e => setItemQuestionText(e.target.value)}
              placeholder="Enter the question statement..."
            />
          </div>

          {/* MCQ 4 Options & Correct Answer Radio */}
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border">
            <Label className="text-sm font-semibold">MCQ Options & Correct Answer *</Label>
            <p className="text-xs text-muted-foreground mb-2">Provide 4 choices and select the radio button for the correct answer.</p>
            {itemOptions.map((optVal, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="itemCorrectOption"
                  checked={itemSelectedCorrect === idx}
                  onChange={() => setItemSelectedCorrect(idx)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <Input
                  value={optVal}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={itemDifficulty}
                onChange={e => setItemDifficulty(e.target.value)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Input 
                value={itemExplanation}
                onChange={e => setItemExplanation(e.target.value)}
                placeholder="Brief explanation..."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} disabled={!itemQuestionText || isAdding}>
            {isAdding ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </Modal>

      {/* Dual-Mode Bulk Upload Dialog */}
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Bulk Upload Dataset Items</h2>
          <p className="text-sm text-muted-foreground">Upload an Excel/CSV file or paste raw JSON to import multiple items in bulk.</p>
        </div>

        {/* Bulk Tab Switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
          <button
            onClick={() => setBulkTab('file')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              bulkTab === 'file'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel / CSV File Upload
          </button>
          <button
            onClick={() => setBulkTab('json')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              bulkTab === 'json'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Code className="w-4 h-4" />
            Raw JSON Paste
          </button>
        </div>

        <div className="space-y-4 py-2">
          {bulkError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {bulkError}
            </div>
          )}

          {bulkTab === 'file' && (
            <div className="space-y-4">
              {/* Sample Template Download Box */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Need a format template?</h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                    Download our sample CSV template pre-filled with required headers (`Topic`, `Question Text`, `Option A-D`, `Correct Answer`).
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownloadSampleTemplate} className="gap-2 shrink-0">
                  <Download className="w-4 h-4" /> Download Sample
                </Button>
              </div>

              {/* Drag & Drop File Input */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Drag & drop your CSV file here, or browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports `.csv` files</p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="mt-4 mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {/* Live Preview Table */}
              {parsedPreviewItems.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Live Preview ({parsedPreviewItems.length} items parsed)
                    </span>
                    {parsedPreviewItems.some(i => !i.isValid) && (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {parsedPreviewItems.filter(i => !i.isValid).length} Invalid Items
                      </span>
                    )}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto border rounded bg-background">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 border-b">Question</th>
                          <th className="p-2 border-b">Options</th>
                          <th className="p-2 border-b">Answer</th>
                          <th className="p-2 border-b">Difficulty</th>
                          <th className="p-2 border-b">Validation</th>
                          <th className="p-2 border-b text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreviewItems.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className={`border-b last:border-0 ${
                              !item.isValid ? 'bg-red-50/60 dark:bg-red-950/30 text-red-900 dark:text-red-300' : ''
                            }`}
                          >
                            <td className="p-2 truncate max-w-[180px]" title={item.questionText}>{item.questionText}</td>
                            <td className="p-2 font-mono">{item.options?.length || 0} opts</td>
                            <td className={`p-2 font-semibold truncate max-w-[100px] ${item.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {item.answer || '-'}
                            </td>
                            <td className="p-2">{item.difficulty}</td>
                            <td className="p-2">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium" title={item.validationError}>
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Answer mismatch
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleOpenEditPreview(idx)}
                                title="Edit Question & Options"
                              >
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {bulkTab === 'json' && (
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-3 rounded-md text-xs">
                <p>Provide a JSON array of objects. Example structure:</p>
                <pre className="mt-2 text-xs opacity-70">
{`[
  {
    "topic": "Math",
    "difficulty": "EASY",
    "questionText": "What is 2+2?",
    "options": ["2", "3", "4", "5"],
    "answer": "4"
  }
]`}
                </pre>
              </div>
              <Label>JSON Data</Label>
              <Textarea 
                className="min-h-[220px] font-mono text-xs"
                value={bulkJson}
                onChange={e => setBulkJson(e.target.value)}
                placeholder="[\n  { ... }\n]"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkSubmit} 
            disabled={
              isBulkAdding || 
              (bulkTab === 'file' && (parsedPreviewItems.length === 0 || parsedPreviewItems.some(i => !i.isValid))) || 
              (bulkTab === 'json' && !bulkJson)
            }
            title={
              bulkTab === 'file' && parsedPreviewItems.some(i => !i.isValid)
                ? 'Fix invalid items (answer mismatch) in file before uploading'
                : ''
            }
          >
            {isBulkAdding ? 'Uploading...' : 'Confirm & Upload Items'}
          </Button>
        </div>
      </Modal>

      {/* Edit Single Preview Item Popup */}
      <Modal isOpen={editPreviewModalOpen} onClose={() => setEditPreviewModalOpen(false)} className="max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Edit Preview Question</h2>
          <p className="text-sm text-muted-foreground">Fix question text, options, or select the correct answer.</p>
        </div>
        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea
              className="min-h-[80px]"
              value={editPreviewData.questionText}
              onChange={(e) => setEditPreviewData({ ...editPreviewData, questionText: e.target.value })}
            />
          </div>

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border">
            <Label className="text-xs font-semibold">Options & Correct Answer Choice</Label>
            {editPreviewData.options.map((optVal, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="editPreviewCorrectOption"
                  checked={editPreviewData.selectedCorrect === idx}
                  onChange={() => setEditPreviewData({ ...editPreviewData, selectedCorrect: idx })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <Input
                  value={optVal}
                  onChange={(e) => {
                    const updated = [...editPreviewData.options];
                    updated[idx] = e.target.value;
                    setEditPreviewData({ ...editPreviewData, options: updated });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editPreviewData.difficulty}
                onChange={(e) => setEditPreviewData({ ...editPreviewData, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Explanation</Label>
              <Input
                value={editPreviewData.explanation}
                onChange={(e) => setEditPreviewData({ ...editPreviewData, explanation: e.target.value })}
                placeholder="Optional explanation..."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setEditPreviewModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreviewEdit}>
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Edit Existing Dataset Item Modal */}
      <Modal isOpen={isEditServerItemOpen} onClose={() => setIsEditServerItemOpen(false)} className="max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Edit Dataset Item</h2>
          <p className="text-sm text-muted-foreground">Update question text, options, correct answer choice, or difficulty.</p>
        </div>
        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <Textarea
              className="min-h-[85px]"
              value={editServerItemForm.questionText}
              onChange={(e) => setEditServerItemForm({ ...editServerItemForm, questionText: e.target.value })}
            />
          </div>

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border">
            <Label className="text-xs font-semibold">MCQ Options & Correct Answer *</Label>
            <p className="text-xs text-muted-foreground mb-2">Select the radio button next to the correct choice.</p>
            {editServerItemForm.options.map((optVal, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="editServerItemCorrectOption"
                  checked={editServerItemForm.selectedCorrect === idx}
                  onChange={() => setEditServerItemForm({ ...editServerItemForm, selectedCorrect: idx })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <Input
                  value={optVal}
                  onChange={(e) => {
                    const updated = [...editServerItemForm.options];
                    updated[idx] = e.target.value;
                    setEditServerItemForm({ ...editServerItemForm, options: updated });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editServerItemForm.difficulty}
                onChange={(e) => setEditServerItemForm({ ...editServerItemForm, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Input
                value={editServerItemForm.explanation}
                onChange={(e) => setEditServerItemForm({ ...editServerItemForm, explanation: e.target.value })}
                placeholder="Brief explanation..."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setIsEditServerItemOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveServerItemEdit} disabled={!editServerItemForm.questionText || isUpdatingItem}>
            {isUpdatingItem ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
