'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to InterVu AI. Start creating interview assessments.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create Assessment</CardTitle>
            <CardDescription>
              Build a new interview assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              New Assessment
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>
              View and manage your assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No assessments yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              View performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No data available
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
