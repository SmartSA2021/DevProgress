import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  changeValue?: number;
  changeDirection?: "up" | "down";
  icon: React.ReactNode;
  iconColor: string;
  iconBgColor: string;
}

export default function KpiCard({
  title,
  value,
  changeValue,
  changeDirection,
  icon,
  iconColor,
  iconBgColor,
}: KpiCardProps) {
  return (
    <Card className="bg-gray-800 shadow border-gray-700">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-end space-x-2">
              <p className="text-2xl font-semibold">{value}</p>
              {changeValue !== undefined && changeDirection && (
                <p 
                  className={cn(
                    "text-sm flex items-center",
                    changeDirection === "up" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {changeDirection === "up" ? (
                    <ArrowUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-0.5" />
                  )}
                  <span>{Math.abs(changeValue).toFixed(1)}%</span>
                </p>
              )}
            </div>
          </div>
          <div 
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              iconBgColor
            )}
          >
            {icon}
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Compared to previous period</p>
      </CardContent>
    </Card>
  );
}
