import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDeveloper, fetchDeveloperSummary, fetchDeveloperActivities } from "@/lib/githubAPI";
import { TimeRange } from "@shared/schema";
import DateRangeSelector from "@/components/common/DateRangeSelector";
import { useState } from "react";
import { 
  GitCommit, 
  GitPullRequest, 
  GitBranch, 
  GitMerge,
  FileCode,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";

export default function DeveloperDetail() {
  const [, params] = useRoute("/developers/:id");
  const developerId = params?.id ? parseInt(params.id) : 0;
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");

  const { data: developer, isLoading: isLoadingDeveloper } = useQuery({
    queryKey: [`/api/developers/${developerId}`],
    enabled: !!developerId,
  });

  const { data: developerSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: [`/api/developers/${developerId}/summary`, timeRange],
    queryFn: () => fetchDeveloperSummary(developerId, timeRange),
    enabled: !!developerId,
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: [`/api/developers/${developerId}/activities`],
    queryFn: () => fetchDeveloperActivities(developerId),
    enabled: !!developerId,
  });

  const isLoading = isLoadingDeveloper || isLoadingSummary || isLoadingActivities;

  if (isLoading) {
    return <DeveloperDetailSkeleton />;
  }

  // Sample data for charts
  const commitActivityData = [
    { name: "Week 1", commits: 32 },
    { name: "Week 2", commits: 45 },
    { name: "Week 3", commits: 38 },
    { name: "Week 4", commits: 52 },
    { name: "Week 5", commits: 47 },
    { name: "Week 6", commits: 65 },
    { name: "Week 7", commits: 58 },
    { name: "Week 8", commits: 42 },
  ];

  const codeDistributionData = [
    { name: "JavaScript", value: 45 },
    { name: "TypeScript", value: 30 },
    { name: "CSS", value: 15 },
    { name: "HTML", value: 10 },
  ];

  const workTimeDistributionData = [
    { name: "Morning (6-12)", value: 35 },
    { name: "Afternoon (12-18)", value: 45 },
    { name: "Evening (18-24)", value: 15 },
    { name: "Night (0-6)", value: 5 },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Avatar className="h-16 w-16 mr-4">
              <AvatarImage 
                src={developer?.avatarUrl || `https://ui-avatars.com/api/?name=${developer?.name}&background=random`} 
                alt={developer?.name || "Developer"} 
              />
              <AvatarFallback>{(developer?.name || "").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{developer?.name}</h1>
              <p className="text-gray-400">@{developer?.username}</p>
            </div>
          </div>
          <DateRangeSelector 
            value={timeRange} 
            onChange={(value) => setTimeRange(value as TimeRange)} 
          />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center mr-3">
                  <GitCommit className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Commits</p>
                  <p className="text-xl font-semibold">{developerSummary?.commits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-purple-500 bg-opacity-10 flex items-center justify-center mr-3">
                  <GitPullRequest className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pull Requests</p>
                  <p className="text-xl font-semibold">{developerSummary?.pullRequestCompletion.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-500 bg-opacity-10 flex items-center justify-center mr-3">
                  <FileCode className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Lines Changed</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-semibold">{developerSummary?.linesAdded + developerSummary?.linesRemoved}</span>
                    <div className="flex items-center text-xs">
                      <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800 mr-1">
                        <ArrowUp className="h-3 w-3 mr-1" /> {developerSummary?.linesAdded}
                      </Badge>
                      <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-800">
                        <ArrowDown className="h-3 w-3 mr-1" /> {developerSummary?.linesRemoved}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-yellow-500 bg-opacity-10 flex items-center justify-center mr-3">
                  <GitMerge className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">PR Completion</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-semibold">{developerSummary?.pullRequestCompletion.percentage}%</span>
                  </div>
                </div>
              </div>
              <Progress 
                value={developerSummary?.pullRequestCompletion.percentage} 
                className="h-2 mt-2 bg-gray-700" 
              />
              <p className="text-xs text-gray-500 mt-1">
                {developerSummary?.pullRequestCompletion.completed}/{developerSummary?.pullRequestCompletion.total} completed
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center mr-3">
                  <Clock className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg. Activity</p>
                  <p className="text-xl font-semibold">4.8 hrs</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Most active during weekdays</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="mb-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="patterns">Work Patterns</TabsTrigger>
            <TabsTrigger value="repos">Repositories</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700 col-span-2">
                <CardHeader>
                  <CardTitle>Commit Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={commitActivityData}>
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
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="commits"
                          stroke="#3B82F6"
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
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  <div className="space-y-4">
                    {activities?.slice(0, 5).map((activity, index) => (
                      <div key={index} className="bg-gray-750 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm">{activity.type}</div>
                          <div className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{activity.action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="code">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Language Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={codeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {codeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            borderColor: "#374151",
                            color: "#F9FAFB",
                          }}
                          itemStyle={{ color: "#E5E7EB" }}
                          labelStyle={{ color: "#F9FAFB" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Code Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Added", value: developerSummary?.linesAdded || 0, fill: "#10B981" },
                          { name: "Deleted", value: developerSummary?.linesRemoved || 0, fill: "#EF4444" },
                          { name: "Changed", value: (developerSummary?.linesAdded || 0) + (developerSummary?.linesRemoved || 0), fill: "#3B82F6" },
                        ]}
                      >
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
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Lines" radius={[4, 4, 0, 0]}>
                          {[
                            { name: "Added", fill: "#10B981" },
                            { name: "Deleted", fill: "#EF4444" },
                            { name: "Changed", fill: "#3B82F6" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="patterns">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Work Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workTimeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {workTimeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            borderColor: "#374151",
                            color: "#F9FAFB",
                          }}
                          itemStyle={{ color: "#E5E7EB" }}
                          labelStyle={{ color: "#F9FAFB" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Weekly Activity Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Mon", commits: 12 },
                          { name: "Tue", commits: 15 },
                          { name: "Wed", commits: 18 },
                          { name: "Thu", commits: 22 },
                          { name: "Fri", commits: 17 },
                          { name: "Sat", commits: 5 },
                          { name: "Sun", commits: 3 },
                        ]}
                      >
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
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="repos">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Top Repositories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Frontend", commits: 45, issues: 12, lastActive: "2 days ago" },
                      { name: "Backend API", commits: 37, issues: 8, lastActive: "1 day ago" },
                      { name: "Mobile App", commits: 28, issues: 5, lastActive: "3 days ago" },
                      { name: "Documentation", commits: 15, issues: 3, lastActive: "5 days ago" },
                      { name: "Design System", commits: 22, issues: 7, lastActive: "4 days ago" },
                      { name: "DevOps", commits: 18, issues: 4, lastActive: "1 week ago" },
                    ].map((repo, index) => (
                      <Card key={index} className="bg-gray-750 border-gray-700">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-lg mb-2">{repo.name}</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-400">Commits</p>
                              <p className="font-semibold">{repo.commits}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Issues</p>
                              <p className="font-semibold">{repo.issues}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-400 mt-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Last active {repo.lastActive}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function DeveloperDetailSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Skeleton className="h-16 w-16 rounded-full bg-gray-700 mr-4" />
            <div>
              <Skeleton className="h-7 w-48 bg-gray-700 mb-2" />
              <Skeleton className="h-4 w-32 bg-gray-700" />
            </div>
          </div>
          <Skeleton className="h-9 w-36 bg-gray-700 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-gray-700 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-10 w-80 bg-gray-700 rounded-lg mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full bg-gray-700 rounded-lg col-span-2" />
          <Skeleton className="h-96 w-full bg-gray-700 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
