import { Recommendation } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowUpCircle, MinusCircle, ArrowDownCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (!recommendations || recommendations.length === 0) return null;

  const PriorityIcon = ({ priority }: { priority: Recommendation['priority'] }) => {
    switch (priority) {
      case 'HIGH':
        return <ArrowUpCircle className="w-4 h-4 text-destructive" />;
      case 'MEDIUM':
        return <MinusCircle className="w-4 h-4 text-orange-500" />;
      case 'LOW':
        return <ArrowDownCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const PriorityBadge = ({ priority }: { priority: Recommendation['priority'] }) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive" className="text-[10px]">HIGH PRIORITY</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200 bg-orange-50">MEDIUM PRIORITY</Badge>;
      case 'LOW':
        return <Badge variant="secondary" className="text-[10px]">LOW PRIORITY</Badge>;
    }
  };

  // Sort: High -> Medium -> Low
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sortedRecs = [...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Actionable Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRecs.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <PriorityIcon priority={rec.priority} />
                  <span>{rec.title}</span>
                </div>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
