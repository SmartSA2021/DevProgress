import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  BarChart2, 
  Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { checkGitHubStatus } from "@/lib/githubAPI";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: githubStatus } = useQuery({
    queryKey: ['/api/github/status'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="mr-3 text-lg" />,
    },
    {
      name: "Developers",
      path: "/developers",
      icon: <Users className="mr-3 text-lg" />,
    },
    {
      name: "Repositories",
      path: "/repositories",
      icon: <GitBranch className="mr-3 text-lg" />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart2 className="mr-3 text-lg" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="mr-3 text-lg" />,
    },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-500">DevTrack</h1>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                    location === item.path
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden mr-2">
                {githubStatus?.connected ? (
                  <img 
                    src={`https://github.com/${githubStatus.username}.png`} 
                    alt="GitHub avatar" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://avatars.githubusercontent.com/u/9919?s=200&v=4"; // GitHub octocat fallback
                    }}
                  />
                ) : (
                  <GitBranch className="text-gray-400" size={16} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {githubStatus?.connected ? "GitHub Connected" : "Not Connected"}
                </p>
                <p className="text-xs text-gray-400">
                  {githubStatus?.connected ? `@${githubStatus.username}` : "Connect in Settings"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
