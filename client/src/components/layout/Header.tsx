import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Menu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeRange } from "@shared/schema";
import { timeRangeToText } from "@/lib/githubAPI";

interface HeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export default function Header({ timeRange, onTimeRangeChange }: HeaderProps) {
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getPageTitle = () => {
    if (location === "/") return "Dashboard Overview";
    if (location.startsWith("/developers") && location !== "/developers") return "Developer Details";
    if (location === "/developers") return "All Developers";
    if (location === "/repositories") return "Repositories";
    if (location === "/settings") return "Settings";
    return "DevTrack";
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-white">{getPageTitle()}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {(location === "/" || location.startsWith("/developers/")) && (
            <div className="relative">
              <div className="flex items-center">
                <Select
                  value={timeRange}
                  onValueChange={onTimeRangeChange}
                >
                  <SelectTrigger className="bg-gray-700 text-gray-300 border-none focus:ring-0 py-1 px-3 w-40">
                    <SelectValue placeholder={timeRangeToText(timeRange as TimeRange)} />
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
            </div>
          )}
          <button type="button" className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none">
            <Bell className="h-6 w-6" />
          </button>
          <button 
            type="button" 
            className="flex items-center text-sm bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 p-1"
          >
            <img 
              className="h-8 w-8 rounded-full" 
              src="https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&q=80" 
              alt="User profile" 
            />
          </button>
        </div>
      </div>
    </header>
  );
}
