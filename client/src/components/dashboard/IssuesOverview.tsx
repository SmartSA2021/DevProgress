import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { IssueSummary } from "@shared/schema";

interface IssuesOverviewProps {
  openCount: number;
  inProgressCount: number;
  closedCount: number;
  recentIssues: IssueSummary[];
  className?: string;
}

export default function IssuesOverview({
  openCount,
  inProgressCount,
  closedCount,
  recentIssues,
  className,
}: IssuesOverviewProps) {
  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardHeader className="border-b border-gray-700 p-4 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Issues Overview</CardTitle>
        <button className="text-sm text-blue-500 hover:text-blue-400">Create Issue</button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 bg-gray-750 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-400">Open</div>
              <div className="text-xs text-red-500">+12.5%</div>
            </div>
            <div className="text-2xl font-semibold">{openCount}</div>
          </div>
          <div className="flex-1 bg-gray-750 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-400">In Progress</div>
              <div className="text-xs text-green-500">+4.8%</div>
            </div>
            <div className="text-2xl font-semibold">{inProgressCount}</div>
          </div>
          <div className="flex-1 bg-gray-750 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-400">Closed</div>
              <div className="text-xs text-green-500">+28.3%</div>
            </div>
            <div className="text-2xl font-semibold">{closedCount}</div>
          </div>
        </div>

        <div className="space-y-3">
          {recentIssues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center p-3 bg-gray-750 rounded-lg hover:bg-gray-700"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mr-3",
                  issue.priority === "high" ? "bg-red-500" :
                  issue.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                )}
              ></div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  #{issue.number} {issue.title}
                </div>
                <div className="text-xs text-gray-400">
                  Opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })} by {issue.createdBy.name}
                </div>
              </div>
              <div
                className={cn(
                  "px-2 py-1 text-xs rounded",
                  issue.priority === "high" ? "bg-red-900 text-red-300" :
                  issue.priority === "medium" ? "bg-yellow-900 text-yellow-300" : "bg-green-900 text-green-300"
                )}
              >
                {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
