import { useQuery } from "@tanstack/react-query";
import { fetchRepositories } from "@/lib/githubAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ArrowUpDown, GitFork, Star, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TimeRange } from "@shared/schema";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

type SortOption = "name" | "commits" | "issues";
type SortDirection = "asc" | "desc";

interface RepositoriesProps {
  timeRange?: string;
}

export default function Repositories({ timeRange = "30days" }: RepositoriesProps) {
  const { data: repositories, isLoading, error } = useQuery({
    queryKey: ['/api/repositories', timeRange],
    queryFn: () => fetchRepositories(timeRange as TimeRange),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("commits");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (isLoading) {
    return <RepositoriesSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-900/20 border border-red-800 text-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Error Loading Repositories</h3>
          <p>
            Failed to load repository data. Please try again or check your connectivity.
          </p>
        </div>
      </div>
    );
  }

  const filteredRepositories = repositories
    ?.filter(repo =>
      repo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "commits") {
        return sortDirection === "asc" 
          ? (a.stats?.commits || 0) - (b.stats?.commits || 0)
          : (b.stats?.commits || 0) - (a.stats?.commits || 0);
      } else if (sortBy === "issues") {
        return sortDirection === "asc" 
          ? (a.stats?.openIssues || 0) - (b.stats?.openIssues || 0)
          : (b.stats?.openIssues || 0) - (a.stats?.openIssues || 0);
      }
      return 0;
    });

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("desc");
    }
  };

  // Top repositories overview and stats
  const topRepos = repositories?.slice(0, 5) || [];
  
  // Sample data for activity timeline
  const activityTimelineData = [
    { name: "Jan", Frontend: 35, Backend: 42, Mobile: 28, Documentation: 15 },
    { name: "Feb", Frontend: 48, Backend: 38, Mobile: 32, Documentation: 20 },
    { name: "Mar", Frontend: 42, Backend: 45, Mobile: 25, Documentation: 18 },
    { name: "Apr", Frontend: 58, Backend: 30, Mobile: 30, Documentation: 25 },
    { name: "May", Frontend: 65, Backend: 35, Mobile: 28, Documentation: 22 },
    { name: "Jun", Frontend: 45, Backend: 38, Mobile: 32, Documentation: 19 },
  ];

  // Repo contribution data for the bar chart
  const repoContributionData = topRepos.map(repo => ({
    name: repo.name,
    commits: repo.stats?.commits || 0,
    contributors: repo.stats?.contributors || 0,
  }));

  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Repositories</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search repositories..."
                className="pl-9 bg-gray-800 border-gray-700 text-gray-300 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className={cn(sortBy === "name" && "bg-gray-700")}
                    onClick={() => handleSort("name")}
                  >
                    <span>Name</span>
                    {sortBy === "name" && (
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={cn(sortBy === "commits" && "bg-gray-700")}
                    onClick={() => handleSort("commits")}
                  >
                    <span>Commits</span>
                    {sortBy === "commits" && (
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={cn(sortBy === "issues" && "bg-gray-700")}
                    onClick={() => handleSort("issues")}
                  >
                    <span>Issues</span>
                    {sortBy === "issues" && (
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Repository Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Repository Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                        color: "#F9FAFB",
                      }}
                      itemStyle={{ color: "#E5E7EB" }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Frontend"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Backend"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Mobile"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Documentation"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Repository Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repoContributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                        color: "#F9FAFB",
                      }}
                      itemStyle={{ color: "#E5E7EB" }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Bar dataKey="commits" fill="#3B82F6" name="Commits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="contributors" fill="#10B981" name="Contributors" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repository List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredRepositories?.map(repo => (
            <Card key={repo.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{repo.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-2",
                          repo.isPrivate 
                            ? "border-yellow-600 text-yellow-500" 
                            : "border-blue-600 text-blue-500"
                        )}
                      >
                        {repo.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{repo.fullName}</p>
                    {repo.description && (
                      <p className="text-sm text-gray-300 mt-2">{repo.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <GitFork className="h-4 w-4 mr-1" />
                      <span>{repo.stats?.forks || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Star className="h-4 w-4 mr-1" />
                      <span>{repo.stats?.stars || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{repo.stats?.watchers || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Commits</span>
                      <span>{repo.stats?.commits || 0}</span>
                    </div>
                    <Progress 
                      value={Math.min((repo.stats?.commits || 0) / 1.5, 100)} 
                      className="h-2 bg-gray-700" 
                    />
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Contributors</span>
                        <span>{repo.stats?.contributors || 0}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(repo.stats?.contributors || 0, 5) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="h-8 w-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs"
                          >
                            {i + 1}
                          </div>
                        ))}
                        {(repo.stats?.contributors || 0) > 5 && (
                          <div className="h-8 w-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs">
                            +{(repo.stats?.contributors || 0) - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Pull Requests</span>
                      <span>{repo.stats?.pullRequests || 0}</span>
                    </div>
                    <Progress 
                      value={Math.min((repo.stats?.pullRequests || 0) * 2, 100)} 
                      className="h-2 bg-gray-700" 
                    />
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div>
                        <div className="text-xs text-gray-400">Open</div>
                        <div className="text-sm">{repo.stats?.openPRs || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Merged</div>
                        <div className="text-sm">{repo.stats?.mergedPRs || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Issues</span>
                      <span>{repo.stats?.openIssues || 0}</span>
                    </div>
                    <Progress 
                      value={Math.min((repo.stats?.openIssues || 0) * 3, 100)} 
                      className="h-2 bg-gray-700" 
                    />
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div>
                        <div className="text-xs text-gray-400">Open</div>
                        <div className="text-sm">{repo.stats?.openIssues || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">In Progress</div>
                        <div className="text-sm">{repo.stats?.inProgressIssues || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Closed</div>
                        <div className="text-sm">{repo.stats?.closedIssues || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRepositories?.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No repositories found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </main>
  );
}

function RepositoriesSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-64 bg-gray-700" />
            <Skeleton className="h-9 w-20 bg-gray-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-96 w-full bg-gray-700 rounded-lg" />
          <Skeleton className="h-96 w-full bg-gray-700 rounded-lg" />
        </div>

        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
