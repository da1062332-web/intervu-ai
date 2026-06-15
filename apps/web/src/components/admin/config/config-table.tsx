import { Button } from '@/components/ui/button';
import { Eye, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ExamConfig {
  id: string;
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
  createdAt?: string;
}

interface ConfigTableProps {
  configs: ExamConfig[];
}

export function ConfigTable({ configs }: ConfigTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-md border mt-6">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Config Name</th>
            <th scope="col" className="px-4 py-3 font-medium">Role</th>
            <th scope="col" className="px-4 py-3 font-medium hidden sm:table-cell">Duration</th>
            <th scope="col" className="px-4 py-3 font-medium hidden md:table-cell">Questions</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium hidden lg:table-cell">Created At</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr key={config.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 font-medium">{config.name}</td>
              <td className="px-4 py-3">{config.role}</td>
              <td className="px-4 py-3 hidden sm:table-cell">{config.durationMinutes}m</td>
              <td className="px-4 py-3 hidden md:table-cell">{config.totalQuestions}</td>
              <td className="px-4 py-3">
                <Badge variant={config.status === 'Draft' ? 'secondary' : 'default'}>
                  {config.status}
                </Badge>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" aria-label="View">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {configs.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No configurations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
