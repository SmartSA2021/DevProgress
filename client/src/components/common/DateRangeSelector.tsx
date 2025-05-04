import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeRange } from "@shared/schema";
import { timeRangeToText } from "@/lib/githubAPI";

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-gray-700 text-gray-300 border-none focus:ring-0 py-1 px-3 w-40">
          <SelectValue placeholder={timeRangeToText(value as TimeRange)} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="7days">Last 7 days</SelectItem>
          <SelectItem value="14days">Last 14 days</SelectItem>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last quarter</SelectItem>
          <SelectItem value="180days">Last 6 months</SelectItem>
          <SelectItem value="365days">Last year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
