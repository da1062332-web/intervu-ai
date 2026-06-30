import { useState, useCallback, useEffect } from 'react';
import { WorkflowDashboardItem, WorkflowStatusDetails, WorkflowStep } from '../types';
import { apiClient } from '@/services/api/client'; 

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<WorkflowDashboardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async (page = 1, limit = 10, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, any> = { page, limit };
      if (status) query.status = status;
      
      const response = await apiClient.request<{ items: WorkflowDashboardItem[]; total: number }>('/workflows', {
        method: 'GET',
        query,
        skipErrorToast: true,
      });
      setWorkflows(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workflows,
    total,
    loading,
    error,
    fetchWorkflows,
  };
};

export const useWorkflowDetails = (examId: string) => {
  const [details, setDetails] = useState<WorkflowStatusDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!examId) return;
    try {
      const response = await apiClient.request<WorkflowStatusDetails>(`/workflows/${examId}`, {
        method: 'GET',
        skipErrorToast: true,
      });
      setDetails(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow details');
    }
  }, [examId]);

  useEffect(() => {
    setLoading(true);
    fetchDetails().finally(() => setLoading(false));
  }, [fetchDetails]);

  // Polling for auto-refresh — only poll while actively IN_PROGRESS
  useEffect(() => {
    if (details?.status === 'IN_PROGRESS') {
      const interval = setInterval(fetchDetails, 8000); // 8 second polling
      return () => clearInterval(interval);
    }
    // No polling for COMPLETED, FAILED, BLOCKED, or NOT_STARTED
  }, [details?.status, fetchDetails]);

  const advanceWorkflow = async () => {
    try {
      await apiClient.request(`/workflows/${examId}/advance`, { method: 'PATCH' });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to advance workflow');
    }
  };

  const publishWorkflow = async () => {
    try {
      await apiClient.request(`/workflows/${examId}/publish`, { method: 'POST' });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to publish workflow');
    }
  };

  const startGeneration = async () => {
    try {
      await apiClient.request(`/workflows/${examId}/generate`, { method: 'POST' });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to start generation');
    }
  };

  const startAssembly = async () => {
    try {
      await apiClient.request(`/workflows/${examId}/assemble`, { method: 'POST' });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to start assembly');
    }
  };

  const rollbackWorkflow = async (reason?: string) => {
    try {
      await apiClient.request(`/workflows/${examId}/rollback`, {
        method: 'PATCH',
        body: { reason },
      });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to rollback workflow');
    }
  };

  const retryWorkflow = async (step: WorkflowStep) => {
    try {
      await apiClient.request(`/workflows/${examId}/retry`, {
        method: 'POST',
        body: { step },
      });
      await fetchDetails();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to retry workflow');
    }
  };

  return {
    details,
    loading,
    error,
    fetchDetails,
    advanceWorkflow,
    publishWorkflow,
    startGeneration,
    startAssembly,
    rollbackWorkflow,
    retryWorkflow,
  };
};

export const useAdminInsights = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.request<any>('/workflows/insights', {
        method: 'GET',
        skipErrorToast: true,
      });
      setInsights(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, error, fetchInsights };
};

export const useWorkflowOverview = (examId: string) => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await apiClient.request<any>(`/workflows/${examId}/overview`, {
        method: 'GET',
        skipErrorToast: true,
      });
      setOverview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { overview, loading, error, refetch: fetch };
};

export const useWorkflowQuestions = (examId: string, statusFilter?: string) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page = 1, limit = 100, status?: string) => {
    if (!examId) return;
    setLoading(true);
    try {
      const query: any = { page, limit };
      if (status) query.status = status;
      const res = await apiClient.request<any>(`/workflows/${examId}/questions`, {
        method: 'GET',
        query,
        skipErrorToast: true,
      });
      setQuestions(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { fetch(1, 100, statusFilter); }, [fetch, statusFilter]);

  const approveQuestion = async (questionId: string) => {
    await apiClient.request(`/workflows/${examId}/questions/${questionId}/approve`, { method: 'PATCH' });
    await fetch(1, 100, statusFilter);
  };

  const rejectQuestion = async (questionId: string, reason?: string) => {
    await apiClient.request(`/workflows/${examId}/questions/${questionId}/reject`, {
      method: 'PATCH',
      body: { reason },
    });
    await fetch(1, 100, statusFilter);
  };

  const bulkApprove = async (questionIds: string[]) => {
    await apiClient.request(`/workflows/${examId}/questions/bulk-approve`, {
      method: 'POST',
      body: { questionIds },
    });
    await fetch(1, 100, statusFilter);
  };

  return { questions, total, loading, error, refetch: fetch, approveQuestion, rejectQuestion, bulkApprove };
};

