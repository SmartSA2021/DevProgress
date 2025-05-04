import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface DeveloperComparisonChartProps {
  labels: string[];
  commits: number[];
  pullRequests: number[];
  className?: string;
}

export default function DeveloperComparisonChart({
  labels,
  commits,
  pullRequests,
  className,
}: DeveloperComparisonChartProps) {
  // Transform the data to be used by Recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    commits: commits[index],
    pullRequests: pullRequests[index],
  }));

  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Developer Comparison</h3>
          <button className="flex items-center text-sm text-gray-400 hover:text-white">
            <span>More</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              <Bar dataKey="commits" fill="#3B82F6" name="Commits" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pullRequests" fill="#8B5CF6" name="Pull Requests" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
