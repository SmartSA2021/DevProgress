import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ActivitySummary } from "@shared/schema";
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  AlertCircle,
  PenSquare, 
  Zap 
} from "lucide-react";

interface ActivityFeedProps {
  activities: ActivitySummary[];
  className?: string;
}

export default function ActivityFeed({ activities, className }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return (
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-blue-500 border-2 border-gray-800 flex items-center justify-center">
            <GitCommit className="h-2 w-2 text-white" />
          </div>
        );
      case 'pullRequest':
        return (
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-purple-500 border-2 border-gray-800 flex items-center justify-center">
            <GitMerge className="h-2 w-2 text-white" />
          </div>
        );
      case 'issue':
        return (
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-yellow-500 border-2 border-gray-800 flex items-center justify-center">
            <AlertCircle className="h-2 w-2 text-white" />
          </div>
        );
      case 'deployment':
        return (
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-red-500 border-2 border-gray-800 flex items-center justify-center">
            <Zap className="h-2 w-2 text-white" />
          </div>
        );
      default:
        return (
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-800 flex items-center justify-center">
            <PenSquare className="h-2 w-2 text-white" />
          </div>
        );
    }
  };

  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardHeader className="border-b border-gray-700 px-4 py-4">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[448px] overflow-y-auto">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 timeline-item">
              {getActivityIcon(activity.type)}
              <div className="bg-gray-750 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{activity.developerName}</div>
                  <div className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-sm text-gray-300">{activity.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
