'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Eye, Search, Filter } from 'lucide-react';

interface CandidateReport {
  id: string;
  candidate: { id: string; fullName: string; email: string };
  assessment: { id: string; displayName: string };
  score: number;
  completedAt: string;
}

export default function AdminCandidateReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<CandidateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState('completedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
          search: searchTerm,
          sortBy,
          sortOrder,
          limit: '50'
        });
        const res = await fetch(`/api/v1/admin/reports/candidates?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a simple debounce for searching
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, sortBy, sortOrder]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Candidate Reports Explorer</h1>
        <p className="text-sm text-gray-500">View and filter candidate assessment results</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search candidates or assessments..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loading /></div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('candidate')}>
                      Candidate {sortBy === 'candidate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('assessment')}>
                      Assessment {sortBy === 'assessment' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('score')}>
                      Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('completedAt')}>
                      Completed Date {sortBy === 'completedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.length > 0 ? (
                    reports.map(report => (
                      <tr key={report.id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{report.candidate.fullName || 'Candidate'}</p>
                          <p className="text-xs text-gray-500">{report.candidate.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{report.assessment.displayName}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-indigo-600">{report.score}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{new Date(report.completedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/admin/results/${report.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No reports found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
