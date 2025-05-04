import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { checkGitHubStatus, connectToGitHub } from "@/lib/githubAPI";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Bell, Mail, Shield, MoonStar, Sun, AlertOctagon, RotateCcw, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const githubTokenSchema = z.object({
  token: z.string().min(1, "GitHub token is required")
});

export default function Settings() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: githubStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['/api/github/status'],
  });

  const form = useForm<z.infer<typeof githubTokenSchema>>({
    resolver: zodResolver(githubTokenSchema),
    defaultValues: {
      token: "",
    },
  });

  const connectMutation = useMutation({
    mutationFn: connectToGitHub,
    onSuccess: () => {
      toast({
        title: "Connected to GitHub",
        description: "Your GitHub account has been successfully connected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
      form.reset();
      setIsConnecting(false);
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: "Failed to connect to GitHub. Please check your token and try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  const onSubmit = (data: z.infer<typeof githubTokenSchema>) => {
    setIsConnecting(true);
    connectMutation.mutate(data.token);
  };

  const disconnectGitHub = () => {
    toast({
      title: "GitHub disconnected",
      description: "Your GitHub account has been disconnected.",
    });
    // In a real app, we would call an API to revoke the token
    // For now, just invalidate the query to refresh the UI
    queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="account" className="mb-6">
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>GitHub Integration</CardTitle>
                  <CardDescription>Connect your GitHub account to track developer activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {githubStatus?.connected ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="bg-green-500/10 text-green-500 p-2 rounded-full mr-4">
                          <GitHubLogoIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">Connected to GitHub</p>
                          <p className="text-sm text-gray-400">@{githubStatus.username}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-750 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Authorization Scope</h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Read access to repositories</span>
                          </div>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Read access to user information</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-900/20 border border-blue-800 text-blue-100 p-4 rounded-lg">
                        <div className="flex items-start mb-2">
                          <AlertOctagon className="h-5 w-5 mr-2 flex-shrink-0 text-blue-400" />
                          <p className="text-sm">
                            Connect your GitHub account to start tracking developer activity. You'll need to generate a personal access token with <strong>repo</strong> and <strong>user</strong> scopes.
                          </p>
                        </div>
                        <a 
                          href="https://github.com/settings/tokens/new" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Generate a token on GitHub
                        </a>
                      </div>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GitHub Personal Access Token</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="ghp_..." 
                                    className="bg-gray-750 border-gray-600"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-gray-400">
                                  Your token is stored securely and used only for accessing GitHub data.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            disabled={isConnecting}
                            className="w-full"
                          >
                            {isConnecting ? "Connecting..." : "Connect to GitHub"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}
                </CardContent>
                {githubStatus?.connected && (
                  <CardFooter className="flex justify-end border-t border-gray-700 pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={disconnectGitHub}
                    >
                      Disconnect
                    </Button>
                  </CardFooter>
                )}
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" className="bg-gray-750 border-gray-600" defaultValue="Administrator" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" className="bg-gray-750 border-gray-600" defaultValue="admin@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue="admin">
                      <SelectTrigger id="role" className="bg-gray-750 border-gray-600">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-700 pt-4">
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Email Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="email-commits">Developer commits summary</Label>
                    </div>
                    <Switch id="email-commits" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="email-prs">Pull request activity</Label>
                    </div>
                    <Switch id="email-prs" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="email-issues">Issue updates</Label>
                    </div>
                    <Switch id="email-issues" defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">In-App Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="app-commits">Developer commits</Label>
                    </div>
                    <Switch id="app-commits" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="app-prs">Pull request activity</Label>
                    </div>
                    <Switch id="app-prs" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="app-issues">Issue updates</Label>
                    </div>
                    <Switch id="app-issues" defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Notification Frequency</h3>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Summary reports frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger id="frequency" className="bg-gray-750 border-gray-600">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-gray-700 pt-4">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how DevTrack looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-primary-500 rounded-lg p-3 bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <MoonStar className="h-4 w-4 mr-2 text-primary-500" />
                          <span className="text-sm">Dark</span>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                      </div>
                      <div className="w-full h-10 bg-gray-800 rounded-md border border-gray-700"></div>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">Light</span>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                      </div>
                      <div className="w-full h-10 bg-gray-750 rounded-md border border-gray-700"></div>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <RotateCcw className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">System</span>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                      </div>
                      <div className="w-full h-10 bg-gray-750 rounded-md border border-gray-700"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400">Accent Color</h3>
                    <div className="h-6 w-6 rounded-full bg-primary-500"></div>
                  </div>
                  <div className="flex space-x-2">
                    {["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"].map((color, index) => (
                      <div 
                        key={index}
                        className="h-6 w-6 rounded-full cursor-pointer border border-gray-600"
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Chart Colors</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="chartColors">Color Brightness</Label>
                      <span className="text-sm text-gray-400">75%</span>
                    </div>
                    <Slider 
                      id="chartColors" 
                      defaultValue={[75]} 
                      max={100} 
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Layout Options</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compactTables">Compact tables</Label>
                    <Switch id="compactTables" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animatedCharts">Animated charts</Label>
                    <Switch id="animatedCharts" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sidebarCollapsed">Collapsed sidebar by default</Label>
                    <Switch id="sidebarCollapsed" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-gray-700 pt-4">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Data Synchronization</CardTitle>
                  <CardDescription>Configure how data is synced from GitHub</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="syncInterval">Sync Interval</Label>
                    <Select defaultValue="15">
                      <SelectTrigger id="syncInterval" className="bg-gray-750 border-gray-600">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="360">Every 6 hours</SelectItem>
                        <SelectItem value="720">Every 12 hours</SelectItem>
                        <SelectItem value="1440">Once a day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="syncActive">Active Synchronization</Label>
                      <Switch id="syncActive" defaultChecked />
                    </div>
                    <p className="text-sm text-gray-400">Enable or disable automatic synchronization with GitHub</p>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" className="border-gray-700 text-gray-300 w-full">
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Export your data for backup or analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Export Format</Label>
                    <Select defaultValue="json">
                      <SelectTrigger id="exportFormat" className="bg-gray-750 border-gray-600">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exportData">Data to Export</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="exportData" className="bg-gray-750 border-gray-600">
                        <SelectValue placeholder="Select data" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Data</SelectItem>
                        <SelectItem value="developers">Developers Only</SelectItem>
                        <SelectItem value="repositories">Repositories Only</SelectItem>
                        <SelectItem value="commits">Commits Only</SelectItem>
                        <SelectItem value="prs">Pull Requests Only</SelectItem>
                        <SelectItem value="issues">Issues Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" className="border-gray-700 text-gray-300 w-full">
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-red-500">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border border-red-900 rounded-lg p-4 bg-red-900/10">
                    <h3 className="text-sm font-medium text-red-400 mb-2">Reset All Data</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      This will permanently delete all tracked data including commits, pull requests, and issues.
                    </p>
                    <Button variant="destructive" size="sm">
                      Reset Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
