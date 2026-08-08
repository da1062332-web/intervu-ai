'use client';

import { useState } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Cpu,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Power,
  X,
  Loader2,
  Plus,
  Play,
} from 'lucide-react';
import {
  useCodingOracles,
  useToggleCodingOracleStatus,
  useUpdateCodingOracle,
  useCreateCodingOracle,
  useSyncCodingOracles,
} from '@/services/coding-oracles/hooks';
import { CodingOracleItem } from '@/services/coding-oracles/api';

const EMPTY_CREATE_FORM = {
  key: '',
  name: '',
  category: 'GENERAL',
  description: '',
  parameterSchema: '{}',
  isActive: true,
};

const EMPTY_EDIT_FORM = {
  name: '',
  category: 'GENERAL',
  description: '',
  parameterSchema: '{}',
  isActive: true,
};

export default function AdminOracleLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [editingOracle, setEditingOracle] = useState<CodingOracleItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeFilter = selectedStatus === 'ALL' ? undefined : selectedStatus === 'ACTIVE';
  const categoryFilter = selectedCategory === 'ALL' ? undefined : selectedCategory;

  const { data, isLoading } = useCodingOracles(categoryFilter, activeFilter, search);
  const toggleMutation = useToggleCodingOracleStatus();
  const updateMutation = useUpdateCodingOracle();
  const createMutation = useCreateCodingOracle();
  const syncMutation = useSyncCodingOracles();

  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState('');

  // ── Edit handlers ──────────────────────────────────────────────
  const handleOpenEdit = (oracle: CodingOracleItem) => {
    setEditingOracle(oracle);
    setEditForm({
      name: oracle.name,
      category: oracle.category || 'GENERAL',
      description: oracle.description || '',
      parameterSchema: JSON.stringify(oracle.parameterSchema || {}, null, 2),
      isActive: oracle.isActive,
    });
  };

  const handleCloseEdit = () => setEditingOracle(null);

  const handleSaveEdit = async () => {
    if (!editingOracle) return;
    try {
      await updateMutation.mutateAsync({
        idOrKey: editingOracle.id,
        payload: {
          name: editForm.name,
          category: editForm.category,
          description: editForm.description,
          parameterSchema: JSON.parse(editForm.parameterSchema || '{}'),
          isActive: editForm.isActive,
        },
      });
      handleCloseEdit();
    } catch (err: any) {
      alert(`Failed to save oracle metadata: ${err.message}`);
    }
  };

  // ── Create handlers ────────────────────────────────────────────
  const handleOpenCreate = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError('');
    setIsCreating(true);
  };

  const handleCloseCreate = () => setIsCreating(false);

  const handleSaveCreate = async () => {
    setCreateError('');
    if (!createForm.key.trim()) {
      setCreateError('Oracle key is required.');
      return;
    }
    if (!createForm.name.trim()) {
      setCreateError('Display name is required.');
      return;
    }
    try {
      JSON.parse(createForm.parameterSchema || '{}');
    } catch {
      setCreateError('Parameter Schema is not valid JSON.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        key: createForm.key.toUpperCase().trim(),
        name: createForm.name.trim(),
        category: createForm.category,
        description: createForm.description || undefined,
        parameterSchema: JSON.parse(createForm.parameterSchema || '{}'),
        isActive: createForm.isActive,
      });
      handleCloseCreate();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create oracle.');
    }
  };

  // ── Toggle & Sync ──────────────────────────────────────────────
  const handleToggle = async (idOrKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleMutation.mutateAsync(idOrKey);
    } catch (err: any) {
      alert(`Toggle status failed: ${err.message}`);
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncMutation.mutateAsync();
      alert(
        `Oracle sync successful! Synced ${res.syncedCount} of ${res.totalCount} backend Oracles.`,
      );
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  const oracles = data?.items || [];

  const columns: ColumnDef<CodingOracleItem>[] = [
    {
      header: 'Oracle Engine & Key',
      cell: (item) => (
        <div>
          <div className='font-semibold text-foreground flex items-center gap-2'>
            <Cpu className='w-4 h-4 text-primary' />
            {item.name}
            <Badge
              variant='outline'
              className='font-mono text-[10px] bg-primary/5 text-primary border-primary/20'
            >
              {item.category}
            </Badge>
            <Badge
              variant='secondary'
              className='font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            >
              v{item.version || 1}
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground font-mono mt-0.5'>
            Key: <span className='font-bold'>{item.key}</span>
          </div>
          {item.description && (
            <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-md'>
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Backend Provider Status',
      cell: (item) => (
        <div>
          {item.isProviderAvailable ? (
            <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 border gap-1'>
              <CheckCircle2 className='w-3 h-3 text-emerald-500' /> Provider Ready
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 border gap-1'
            >
              <AlertTriangle className='w-3 h-3 text-amber-500' /> Provider Missing
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Active Status',
      cell: (item) => (
        <Button
          size='sm'
          variant={item.isActive ? 'default' : 'secondary'}
          onClick={(e) => handleToggle(item.id, e)}
          disabled={toggleMutation.isPending}
          className='gap-1.5 h-7 text-xs font-mono'
        >
          <Power
            className={`w-3.5 h-3.5 ${item.isActive ? 'text-emerald-300' : 'text-slate-400'}`}
          />
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Button>
      ),
    },
    {
      header: 'Provider Status',
      cell: (item) => (
        <Badge
          variant='outline'
          className={`font-mono text-xs ${
            item.isProviderAvailable
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
          }`}
        >
          {item.isProviderAvailable ? 'Provider Ready' : 'No Provider Registered'}
        </Badge>
      ),
    },
    {
      header: 'Linked Patterns',
      cell: (item) => (
        <div className='flex items-center gap-1.5 flex-wrap'>
          <Badge variant='outline' className='font-mono text-xs'>
            {item.patternCount} pattern(s)
          </Badge>
          {!item.isActive && item.patternCount > 0 && (
            <Badge variant='destructive' className='text-[10px] py-0 font-mono'>
              ⚠️ Patterns Blocked
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            asChild
            className='gap-1 text-xs'
          >
            <Link href={`/admin/coding-oracles/${item.id}/playground`}>
              <Play className='w-3.5 h-3.5 text-primary' /> Playground
            </Link>
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleOpenEdit(item)}
            className='gap-1 text-xs'
          >
            <Edit2 className='w-3.5 h-3.5' /> Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto pb-24'>
      <SectionHeader
        title='Coding Oracle Library'
        description='Manage problem Oracles, database definitions, execution provider readiness, and active statuses.'
        actions={
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={handleOpenCreate} className='gap-2 shadow-sm'>
              <Plus className='w-4 h-4' />
              New Oracle
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className='gap-2 shadow-sm'
            >
              {syncMutation.isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <RefreshCw className='w-4 h-4' />
              )}
              Sync Backend Providers
            </Button>
          </div>
        }
      />

      {/* Filter Header */}
      <div className='flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm flex-wrap'>
        <div className='relative flex-1 min-w-[240px]'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search Oracles by name, key, or category...'
            className='pl-9 bg-background'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className='flex items-center gap-3'>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Categories</SelectItem>
              <SelectItem value='ARRAY'>ARRAY</SelectItem>
              <SelectItem value='STRING'>STRING</SelectItem>
              <SelectItem value='MATH'>MATH</SelectItem>
              <SelectItem value='SEARCHING'>SEARCHING</SelectItem>
              <SelectItem value='SORTING'>SORTING</SelectItem>
              <SelectItem value='GENERAL'>GENERAL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Active Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Statuses</SelectItem>
              <SelectItem value='ACTIVE'>Active Only</SelectItem>
              <SelectItem value='INACTIVE'>Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className='bg-card rounded-xl border shadow-sm overflow-hidden'>
        <DataTable columns={columns} data={oracles} isLoading={isLoading} />
      </div>

      {/* ── Create Oracle Modal ─────────────────────────────────────── */}
      {isCreating && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pb-12'>
          <div className='bg-card border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 mt-4 sm:mt-8 flex flex-col max-h-[88vh]'>
            <div className='flex items-center justify-between border-b p-4 bg-muted/30 shrink-0'>
              <div>
                <h3 className='font-semibold text-lg flex items-center gap-2'>
                  <Plus className='w-5 h-5 text-primary' /> Create New Oracle
                </h3>
                <p className='text-xs text-muted-foreground'>
                  Registers a new Oracle DB record. A matching backend TypeScript provider must
                  exist for question generation to work.
                </p>
              </div>
              <Button variant='ghost' size='sm' onClick={handleCloseCreate}>
                <X className='w-4 h-4' />
              </Button>
            </div>

            <div className='p-6 space-y-4 overflow-y-auto flex-1'>
              {createError && (
                <div className='text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg px-3 py-2'>
                  {createError}
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>
                    Oracle Key <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='e.g. ARRAY_ROTATION_ORACLE'
                    value={createForm.key}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, key: e.target.value.toUpperCase() }))
                    }
                    className='font-mono'
                  />
                  <p className='text-[10px] text-muted-foreground'>
                    Unique identifier. Must match the backend provider key exactly.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label>
                    Display Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='e.g. Array Rotation'
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Category</Label>
                  <Select
                    value={createForm.category}
                    onValueChange={(val: any) =>
                      setCreateForm((prev) => ({ ...prev, category: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GENERAL'>GENERAL</SelectItem>
                      <SelectItem value='ARRAY'>ARRAY</SelectItem>
                      <SelectItem value='STRING'>STRING</SelectItem>
                      <SelectItem value='MATH'>MATH</SelectItem>
                      <SelectItem value='SEARCHING'>SEARCHING</SelectItem>
                      <SelectItem value='SORTING'>SORTING</SelectItem>
                      <SelectItem value='TREES'>TREES</SelectItem>
                      <SelectItem value='GRAPHS'>GRAPHS</SelectItem>
                      <SelectItem value='DP'>DP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Input
                    placeholder='Brief description of what this Oracle does'
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Parameter Schema Defaults (JSON)</Label>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='140px'
                    defaultLanguage='json'
                    value={createForm.parameterSchema}
                    onChange={(val?: string) =>
                      setCreateForm((prev) => ({ ...prev, parameterSchema: val || '' }))
                    }
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>

              <div className='flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900'>
                <div className='space-y-0.5'>
                  <div className='text-sm font-semibold'>Active for Pattern Creation</div>
                  <div className='text-xs text-muted-foreground'>
                    When active, admins can select this Oracle when building coding patterns.
                  </div>
                </div>
                <Button
                  size='sm'
                  type='button'
                  variant={createForm.isActive ? 'default' : 'secondary'}
                  onClick={() => setCreateForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className='gap-1.5 font-mono text-xs'
                >
                  <Power
                    className={`w-3.5 h-3.5 ${createForm.isActive ? 'text-emerald-300' : 'text-slate-400'}`}
                  />
                  {createForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Button>
              </div>

              <div className='text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg px-3 py-2'>
                ⚠️ Creating a DB record alone does <strong>not</strong> enable question generation.
                A matching TypeScript backend provider class with the same key must be registered in
                the <code>OracleRegistry</code> by a developer.
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 p-4 border-t bg-muted/30 shrink-0'>
              <Button variant='outline' onClick={handleCloseCreate}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCreate}
                disabled={createMutation.isPending}
                className='gap-2'
              >
                {createMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                Create Oracle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Oracle Metadata Modal ──────────────────────────────── */}
      {editingOracle && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pb-12'>
          <div className='bg-card border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 mt-4 sm:mt-8 flex flex-col max-h-[88vh]'>
            <div className='flex items-center justify-between border-b p-4 bg-muted/30 shrink-0'>
              <div>
                <h3 className='font-semibold text-lg flex items-center gap-2'>
                  <Cpu className='w-5 h-5 text-primary' /> Edit Oracle: {editingOracle.name}
                </h3>
                <p className='text-xs text-muted-foreground font-mono'>Key: {editingOracle.key}</p>
              </div>
              <Button variant='ghost' size='sm' onClick={handleCloseEdit}>
                <X className='w-4 h-4' />
              </Button>
            </div>

            <div className='p-6 space-y-4 overflow-y-auto flex-1'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Display Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Category</Label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Parameter Schema Defaults (JSON)</Label>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='160px'
                    defaultLanguage='json'
                    value={editForm.parameterSchema}
                    onChange={(val?: string) =>
                      setEditForm((prev) => ({ ...prev, parameterSchema: val || '' }))
                    }
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>

              <div className='flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900'>
                <div className='space-y-0.5'>
                  <div className='text-sm font-semibold'>Active for Pattern Creation</div>
                  <div className='text-xs text-muted-foreground'>
                    When active, admins can select this Oracle when building coding patterns.
                  </div>
                </div>
                <Button
                  size='sm'
                  type='button'
                  variant={editForm.isActive ? 'default' : 'secondary'}
                  onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className='gap-1.5 font-mono text-xs'
                >
                  <Power
                    className={`w-3.5 h-3.5 ${editForm.isActive ? 'text-emerald-300' : 'text-slate-400'}`}
                  />
                  {editForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Button>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 p-4 border-t bg-muted/30 shrink-0'>
              <Button variant='outline' onClick={handleCloseEdit}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className='gap-2'
              >
                {updateMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
