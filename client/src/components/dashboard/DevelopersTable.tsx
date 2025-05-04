import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { DeveloperSummary } from "@shared/schema";

interface DevelopersTableProps {
  developers: DeveloperSummary[];
  className?: string;
}

export default function DevelopersTable({ developers, className }: DevelopersTableProps) {
  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardHeader className="border-b border-gray-700 px-4 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Top Performing Developers</CardTitle>
          <Link href="/developers">
            <div className="flex items-center text-sm text-gray-400 hover:text-white cursor-pointer">
              <span>View All</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Developer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Commits
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Lines Changed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  PR Completion
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {developers.map((developer) => (
                <tr key={developer.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={developer.avatarUrl || `https://ui-avatars.com/api/?name=${developer.name}&background=random`}
                          alt={`${developer.name} avatar`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${developer.name}&background=random`;
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{developer.name}</div>
                        <div className="text-sm text-gray-400">@{developer.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{developer.commits}</div>
                    <div className={cn(
                      "text-sm",
                      developer.commitsChange > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {developer.commitsChange > 0 ? "+" : ""}{developer.commitsChange.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{developer.linesAdded + developer.linesRemoved}</div>
                    <div className="flex items-center">
                      <span className="text-xs text-green-500">+{developer.linesAdded}</span>
                      <span className="text-xs text-red-500 ml-2">-{developer.linesRemoved}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={cn(
                          "h-2.5 rounded-full",
                          developer.pullRequestCompletion.percentage >= 80 ? "bg-green-500" :
                          developer.pullRequestCompletion.percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${developer.pullRequestCompletion.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {developer.pullRequestCompletion.percentage}% ({developer.pullRequestCompletion.completed}/{developer.pullRequestCompletion.total})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/developers/${developer.id}`}>
                      <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 cursor-pointer inline-block">
                        Details
                      </div>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
