import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/Dashboard";
import DeveloperDetail from "@/pages/DeveloperDetail";
import Developers from "@/pages/Developers";
import Repositories from "@/pages/Repositories";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useState } from "react";

function Router() {
  const [timeRange, setTimeRange] = useState<string>("30days");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={() => <Dashboard timeRange={timeRange} />} />
            <Route path="/developers" component={Developers} />
            <Route path="/developers/:id" component={() => <DeveloperDetail timeRange={timeRange} />} />
            <Route path="/repositories" component={Repositories} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
