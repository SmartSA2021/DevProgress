import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/githubAPI";
import { TimeRange } from "@shared/schema";
import KpiCard from "@/components/dashboard/KpiCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import DeveloperComparisonChart from "@/components/dashboard/DeveloperComparisonChart";
import DevelopersTable from "@/components/dashboard/DevelopersTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RepositoryActivity from "@/components/dashboard/RepositoryActivity";
import IssuesOverview from "@/components/dashboard/IssuesOverview";
import { GitCommit, Users, GitPullRequest, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  timeRange: string;
}

export default function Dashboard({ timeRange }: DashboardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', timeRange],
    queryFn: () => fetchDashboardData(timeRange as TimeRange),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-900/20 border border-red-800 text-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
          <p>
            Failed to load dashboard data. Please try again or check your connectivity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* KPI Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Commits"
            value={data.totalCommits.toLocaleString()}
            changeValue={data.totalCommitsChange}
            changeDirection={data.totalCommitsChange > 0 ? "up" : "down"}
            icon={<GitCommit className="text-primary-500 text-2xl" />}
            iconColor="text-primary-500"
            iconBgColor="bg-blue-500 bg-opacity-10"
          />
          <KpiCard
            title="Active Developers"
            value={data.activeDevelopers}
            changeValue={data.activeDevelopersChange}
            changeDirection={data.activeDevelopersChange > 0 ? "up" : "down"}
            icon={<Users className="text-green-500 text-2xl" />}
            iconColor="text-green-500"
            iconBgColor="bg-green-500 bg-opacity-10"
          />
          <KpiCard
            title="Pull Requests"
            value={data.pullRequests}
            changeValue={data.pullRequestsChange}
            changeDirection={data.pullRequestsChange > 0 ? "up" : "down"}
            icon={<GitPullRequest className="text-purple-500 text-2xl" />}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500 bg-opacity-10"
          />
          <KpiCard
            title="Open Issues"
            value={data.openIssues}
            changeValue={data.openIssuesChange}
            changeDirection={data.openIssuesChange > 0 ? "up" : "down"}
            icon={<AlertCircle className="text-red-500 text-2xl" />}
            iconColor="text-red-500"
            iconBgColor="bg-red-500 bg-opacity-10"
          />
        </div>

        {/* Activity Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ActivityChart
            title="Commit Activity"
            labels={data.commitActivity.labels}
            data={data.commitActivity.data}
          />
          <DeveloperComparisonChart
            labels={data.developerComparison.labels}
            commits={data.developerComparison.commits}
            pullRequests={data.developerComparison.pullRequests}
          />
        </div>

        {/* Top Developers Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <DevelopersTable
            developers={data.topDevelopers}
            className="col-span-1 lg:col-span-2"
          />
          <ActivityFeed
            activities={data.recentActivities}
          />
        </div>

        {/* Repository and Issue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RepositoryActivity
            chartLabels={data.repositoryActivity.labels}
            datasets={data.repositoryActivity.datasets}
            repositories={data.topRepositories}
          />
          <IssuesOverview
            openCount={data.issuesOverview.open}
            inProgressCount={data.issuesOverview.inProgress}
            closedCount={data.issuesOverview.closed}
            recentIssues={data.issuesOverview.recentIssues}
          />
        </div>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* KPI Overview Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
              </div>
              <Skeleton className="h-3 w-32 mt-2 bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Chart Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-6 w-32 bg-gray-700" />
                <div className="flex space-x-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-6 w-12 bg-gray-700 rounded-md" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-[240px] w-full bg-gray-700 rounded-md" />
            </div>
          ))}
        </div>

        {/* Tables Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-700 flex justify-between">
              <Skeleton className="h-6 w-40 bg-gray-700" />
              <Skeleton className="h-6 w-20 bg-gray-700" />
            </div>
            <div className="p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-700 mr-4" />
                    <div>
                      <Skeleton className="h-4 w-24 bg-gray-700 mb-2" />
                      <Skeleton className="h-3 w-16 bg-gray-700" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 bg-gray-700 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-700">
              <Skeleton className="h-6 w-32 bg-gray-700" />
            </div>
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <Skeleton className="h-20 w-full bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
