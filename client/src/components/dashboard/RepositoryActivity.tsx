import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { RepositorySummary } from "@shared/schema";

interface RepositoryActivityProps {
  chartLabels: string[];
  datasets: { name: string; data: number[] }[];
  repositories: RepositorySummary[];
  className?: string;
}

export default function RepositoryActivity({
  chartLabels,
  datasets,
  repositories,
  className,
}: RepositoryActivityProps) {
  const [selectedRepo, setSelectedRepo] = useState("all");

  // Transform the data to be used by Recharts
  const chartData = chartLabels.map((label, index) => {
    const data: { [key: string]: number | string } = { name: label };
    datasets.forEach((dataset) => {
      data[dataset.name] = dataset.data[index];
    });
    return data;
  });

  // Colors for the lines
  const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardHeader className="border-b border-gray-700 p-4 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Repository Activity</CardTitle>
        <div className="relative">
          <select
            className="bg-gray-700 text-sm text-gray-300 border-none focus:ring-0 py-1 px-3 pr-8 rounded-md appearance-none"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <option value="all">All Repositories</option>
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.name}>
                {repo.name}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              <Legend
                wrapperStyle={{
                  paddingTop: "10px",
                }}
              />
              {datasets.map((dataset, index) => (
                <Line
                  key={dataset.name}
                  type="monotone"
                  dataKey={dataset.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={dataset.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {repositories.map((repo) => (
            <div key={repo.id} className="bg-gray-750 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{repo.name}</div>
                <div className={cn(
                  "px-2 py-1 text-xs rounded",
                  repo.commits > 40 ? "bg-blue-900 text-blue-300" :
                  repo.commits > 30 ? "bg-green-900 text-green-300" :
                  repo.commits > 20 ? "bg-purple-900 text-purple-300" : "bg-yellow-900 text-yellow-300"
                )}>
                  {repo.commits} commits
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{repo.contributors} contributors</span>
                <span>•</span>
                <span>{repo.openIssues} open issues</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
