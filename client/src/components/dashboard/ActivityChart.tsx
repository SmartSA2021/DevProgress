import { Card, CardContent } from "@/components/ui/card";
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

interface ActivityChartProps {
  title: string;
  labels: string[];
  data: number[];
  className?: string;
}

export default function ActivityChart({ title, labels, data, className }: ActivityChartProps) {
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Transform the data to be used by Recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    commits: data[index],
  }));

  return (
    <Card className={cn("bg-gray-800 shadow border-gray-700", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="flex space-x-2">
            <button 
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md",
                activeView === 'daily' 
                  ? "bg-gray-700 text-white" 
                  : "bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white"
              )}
              onClick={() => setActiveView('daily')}
            >
              Daily
            </button>
            <button 
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md",
                activeView === 'weekly' 
                  ? "bg-gray-700 text-white" 
                  : "bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white"
              )}
              onClick={() => setActiveView('weekly')}
            >
              Weekly
            </button>
            <button 
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md",
                activeView === 'monthly' 
                  ? "bg-gray-700 text-white" 
                  : "bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white"
              )}
              onClick={() => setActiveView('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-[240px]">
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
              <Line
                type="monotone"
                dataKey="commits"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Commits"
                fill="rgba(59, 130, 246, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
