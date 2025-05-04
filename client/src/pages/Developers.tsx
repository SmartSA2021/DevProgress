import { useQuery } from "@tanstack/react-query";
import { fetchDevelopers } from "@/lib/githubAPI";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SortOption = "name" | "commits" | "activity";
type SortDirection = "asc" | "desc";

export default function Developers() {
  const { data: developers, isLoading, error } = useQuery({
    queryKey: ['/api/developers'],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("commits");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (isLoading) {
    return <DevelopersSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-900/20 border border-red-800 text-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Error Loading Developers</h3>
          <p>
            Failed to load developers data. Please try again or check your connectivity.
          </p>
        </div>
      </div>
    );
  }

  const filteredDevelopers = developers
    ?.filter(developer =>
      developer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      developer.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
      } else if (sortBy === "activity") {
        return sortDirection === "asc" 
          ? new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime()
          : new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
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

  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">All Developers</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search developers..."
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
                    className={cn(sortBy === "activity" && "bg-gray-700")}
                    onClick={() => handleSort("activity")}
                  >
                    <span>Activity</span>
                    {sortBy === "activity" && (
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers?.map(developer => (
            <Link href={`/developers/${developer.id}`} key={developer.id}>
              <div className="block cursor-pointer">
                <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage 
                          src={developer.avatarUrl || `https://ui-avatars.com/api/?name=${developer.name}&background=random`} 
                          alt={developer.name} 
                        />
                        <AvatarFallback>{(developer.name || "").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">{developer.name}</h3>
                        <p className="text-sm text-gray-400">@{developer.username}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-auto",
                          developer.isActive 
                            ? "border-green-600 text-green-500" 
                            : "border-gray-600 text-gray-400"
                        )}
                      >
                        {developer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Commits</span>
                          <span>{developer.stats?.commits || 0}</span>
                        </div>
                        <Progress 
                          value={Math.min((developer.stats?.commits || 0) / 2, 100)} 
                          className="h-2 bg-gray-700" 
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">PRs Completed</span>
                          <span>{developer.stats?.prsCompleted || 0}/{developer.stats?.prsTotal || 0}</span>
                        </div>
                        <Progress 
                          value={developer.stats?.prsTotal ? (developer.stats.prsCompleted / developer.stats.prsTotal) * 100 : 0} 
                          className="h-2 bg-gray-700" 
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Lines Changed</span>
                          <span>{developer.stats?.linesChanged || 0}</span>
                        </div>
                        <Progress 
                          value={Math.min((developer.stats?.linesChanged || 0) / 100, 100)} 
                          className="h-2 bg-gray-700" 
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                      <div>Last active: {developer.lastActive ? new Date(developer.lastActive).toLocaleDateString() : 'N/A'}</div>
                      <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-400">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>
          ))}
        </div>

        {filteredDevelopers?.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No developers found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </main>
  );
}

function DevelopersSkeleton() {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
