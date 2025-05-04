import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TimeRange } from "@shared/schema";
import axios from "axios";

// GitHub API helper functions
const githubApi = {
  async getUser(token: string) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  },
  
  async getRepositories(token: string, organization?: string) {
    try {
      let url = 'https://api.github.com/user/repos';
      if (organization) {
        url = `https://api.github.com/orgs/${organization}/repos`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 100
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  },
  
  async getCommits(token: string, owner: string, repo: string) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard summary
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
      const githubToken = process.env.GITHUB_TOKEN;
      const organization = process.env.GITHUB_ORGANIZATION;
      
      if (!githubToken) {
        return res.json(await storage.getDashboardSummary(timeRange));
      }
      
      try {
        // Get repositories from GitHub
        let reposUrl = 'https://api.github.com/user/repos';
        if (organization) {
          reposUrl = `https://api.github.com/orgs/${organization}/repos`;
        }
        
        const reposResponse = await axios.get(reposUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'updated',
            per_page: 100
          }
        });
        
        const repositories = reposResponse.data;
        
        // Count number of active contributors across repos
        const allDevelopers = new Map();
        let totalCommits = 0;
        let totalPRs = 0;
        let totalIssues = 0;
        
        // Get data for top repositories (limit to 5 for rate limiting)
        const repoDetails = [];
        for (let i = 0; i < Math.min(repositories.length, 5); i++) {
          const repo = repositories[i];
          try {
            // Get commit activity
            const statsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/commit_activity`;
            const statsResponse = await axios.get(statsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              }
            });
            
            // Get contributors
            const contributorsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contributors`;
            const contributorsResponse = await axios.get(contributorsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                per_page: 100
              }
            });
            
            // Count total commits from this repo's contributors
            let repoCommits = 0;
            for (const contributor of contributorsResponse.data) {
              repoCommits += contributor.contributions;
              
              // Add to global contributors map
              if (!allDevelopers.has(contributor.id)) {
                allDevelopers.set(contributor.id, {
                  id: contributor.id,
                  username: contributor.login,
                  avatarUrl: contributor.avatar_url,
                  commits: contributor.contributions
                });
              } else {
                const existing = allDevelopers.get(contributor.id);
                existing.commits += contributor.contributions;
                allDevelopers.set(contributor.id, existing);
              }
            }
            
            totalCommits += repoCommits;
            
            // Get pull requests count
            const prUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`;
            const prResponse = await axios.get(prUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                state: 'all',
                per_page: 1
              }
            });
            
            // Estimate PR count from pagination
            let prCount = 0;
            const prLinkHeader = prResponse.headers.link || '';
            const lastPrPageMatch = prLinkHeader.match(/page=([0-9]+)>; rel="last"/);
            if (lastPrPageMatch) {
              prCount = parseInt(lastPrPageMatch[1]);
            } else {
              prCount = prResponse.data.length;
            }
            
            totalPRs += prCount;
            
            // Track open issues
            totalIssues += repo.open_issues_count || 0;
            
            // Add to repo details array
            repoDetails.push({
              id: repo.id,
              name: repo.name,
              commits: repoCommits,
              contributors: contributorsResponse.data.length,
              openIssues: repo.open_issues_count || 0
            });
            
          } catch (repoError) {
            console.error(`Error fetching data for repo ${repo.name}:`, repoError);
          }
        }
        
        // Build dashboard summary
        const summary = {
          totalCommits: totalCommits,
          totalCommitsChange: Math.floor(Math.random() * 20), // Mock for demo
          activeDevelopers: allDevelopers.size,
          activeDevelopersChange: Math.floor(Math.random() * 10), // Mock for demo
          pullRequests: totalPRs,
          pullRequestsChange: Math.floor(Math.random() * 15), // Mock for demo
          openIssues: totalIssues,
          openIssuesChange: Math.floor(Math.random() * 10), // Mock for demo
          
          // Commit activity over time (last 7 days)
          commitActivity: {
            labels: Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - 6 + i);
              return date.toLocaleDateString('en-US', { weekday: 'short' });
            }),
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30 + 5))
          },
          
          // Top developers
          topDevelopers: Array.from(allDevelopers.values())
            .sort((a, b) => b.commits - a.commits)
            .slice(0, 5)
            .map(dev => ({
              id: dev.id,
              username: dev.username,
              name: dev.username, // We don't have full name from contributors API
              avatarUrl: dev.avatarUrl,
              commits: dev.commits,
              commitsChange: Math.floor(Math.random() * 30 - 10), // Mock for demo
              linesAdded: dev.commits * 10, // Estimate
              linesRemoved: dev.commits * 5, // Estimate
              pullRequestCompletion: {
                completed: Math.floor(dev.commits / 3), // Estimate
                total: Math.floor(dev.commits / 2), // Estimate
                percentage: Math.floor(Math.random() * 40 + 60) // Mock for demo
              }
            })),
            
          // Recent activities (sample)
          recentActivities: repositories.slice(0, 5).map((repo, index) => ({
            id: index + 1,
            type: index % 2 === 0 ? 'commit' : (index % 3 === 0 ? 'pullRequest' : 'issue'),
            developerName: Array.from(allDevelopers.values())[index % allDevelopers.size]?.username || 'unknown',
            developerUsername: Array.from(allDevelopers.values())[index % allDevelopers.size]?.username || 'unknown',
            message: index % 2 === 0 
              ? `Update ${repo.name} repository` 
              : (index % 3 === 0 ? `Merge PR for ${repo.name}` : `Fixed issue in ${repo.name}`),
            resourceId: `${repo.full_name}/${index}`,
            timestamp: new Date(new Date().getTime() - (index * 12 * 60 * 60 * 1000)).toISOString() // Last 48 hours
          })),
          
          // Repository activity
          repositoryActivity: {
            labels: repositories.slice(0, 5).map(repo => repo.name),
            datasets: [
              {
                name: 'Commits',
                data: repositories.slice(0, 5).map(() => Math.floor(Math.random() * 100 + 20))
              },
              {
                name: 'Pull Requests',
                data: repositories.slice(0, 5).map(() => Math.floor(Math.random() * 40 + 5))
              }
            ]
          },
          
          // Top repositories
          topRepositories: repoDetails,
          
          // Issues overview
          issuesOverview: {
            open: totalIssues,
            inProgress: Math.floor(totalIssues * 0.3), // Estimate
            closed: Math.floor(totalIssues * 1.5), // Estimate
            recentIssues: Array.from({ length: 5 }, (_, i) => ({
              id: i + 1,
              number: Math.floor(Math.random() * 100 + 1),
              title: `Issue in ${repositories[i % repositories.length]?.name || 'repository'}`,
              state: i % 3 === 0 ? 'open' : (i % 3 === 1 ? 'in_progress' : 'closed'),
              priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
              createdAt: new Date(new Date().getTime() - (i * 24 * 60 * 60 * 1000)).toISOString(), // Last 5 days
              createdBy: {
                username: Array.from(allDevelopers.values())[i % allDevelopers.size]?.username || 'unknown',
                name: Array.from(allDevelopers.values())[i % allDevelopers.size]?.username || 'unknown'
              }
            }))
          },
          
          // Developer comparison
          developerComparison: {
            labels: Array.from(allDevelopers.values()).slice(0, 5).map(dev => dev.username),
            commits: Array.from(allDevelopers.values()).slice(0, 5).map(dev => dev.commits),
            pullRequests: Array.from(allDevelopers.values()).slice(0, 5).map(dev => Math.floor(dev.commits / 3))
          }
        };
        
        res.json(summary);
      } catch (githubError) {
        console.error('Error fetching GitHub dashboard data:', githubError);
        // Fallback to sample data if GitHub API fails
        return res.json(await storage.getDashboardSummary(timeRange));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Get all developers
  app.get('/api/developers', async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const organization = process.env.GITHUB_ORGANIZATION;
      
      if (!githubToken) {
        return res.json(await storage.getAllDevelopers());
      }
      
      try {
        // Get the list of contributors from repositories
        let url = 'https://api.github.com/user/repos';
        if (organization) {
          url = `https://api.github.com/orgs/${organization}/repos`;
        }
        
        const reposResponse = await axios.get(url, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'updated',
            per_page: 100
          }
        });
        
        const repositories = reposResponse.data;
        const allContributors = new Map();
        
        // Get contributors for each repo
        for (const repo of repositories.slice(0, 5)) { // Limit to 5 repos to avoid rate limiting
          try {
            const contributorsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contributors`;
            const contributorsResponse = await axios.get(contributorsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                per_page: 100
              }
            });
            
            for (const contributor of contributorsResponse.data) {
              if (!allContributors.has(contributor.id)) {
                // Get details for each user
                const userResponse = await axios.get(contributor.url, {
                  headers: {
                    Authorization: `token ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json'
                  }
                });
                
                const userData = userResponse.data;
                const lastCommitDate = new Date();
                lastCommitDate.setDate(lastCommitDate.getDate() - Math.floor(Math.random() * 30)); // Random within last 30 days
                
                allContributors.set(contributor.id, {
                  id: contributor.id,
                  githubId: contributor.id,
                  username: contributor.login,
                  name: userData.name || contributor.login,
                  email: userData.email || `${contributor.login}@example.com`,
                  avatarUrl: contributor.avatar_url,
                  bio: userData.bio || '',
                  location: userData.location || '',
                  company: userData.company || '',
                  websiteUrl: userData.blog || '',
                  twitterUsername: userData.twitter_username || '',
                  isActive: true,
                  lastActive: lastCommitDate,
                  stats: {
                    commits: contributor.contributions,
                    prsCompleted: Math.floor(contributor.contributions / 3),
                    prsTotal: Math.floor(contributor.contributions / 2),
                    linesChanged: contributor.contributions * 10
                  }
                });
              }
            }
          } catch (repoError) {
            console.error(`Error fetching contributors for ${repo.name}:`, repoError);
          }
        }
        
        return res.json(Array.from(allContributors.values()));
      } catch (githubError) {
        console.error('Error fetching GitHub developers:', githubError);
        return res.json(await storage.getAllDevelopers());
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
      res.status(500).json({ message: 'Failed to fetch developers' });
    }
  });

  // Get developer by ID
  app.get('/api/developers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const developer = await storage.getDeveloper(id);
      
      if (!developer) {
        return res.status(404).json({ message: 'Developer not found' });
      }
      
      res.json(developer);
    } catch (error) {
      console.error('Error fetching developer:', error);
      res.status(500).json({ message: 'Failed to fetch developer' });
    }
  });

  // Get developer summary by ID
  app.get('/api/developers/:id/summary', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
      const summary = await storage.getDeveloperSummary(id, timeRange);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching developer summary:', error);
      res.status(500).json({ message: 'Failed to fetch developer summary' });
    }
  });

  // Get developer activities
  app.get('/api/developers/:id/activities', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const activities = await storage.getActivitiesByDeveloper(id);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching developer activities:', error);
      res.status(500).json({ message: 'Failed to fetch developer activities' });
    }
  });

  // Get all repositories
  app.get('/api/repositories', async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const organization = process.env.GITHUB_ORGANIZATION;
      
      if (!githubToken) {
        return res.json(await storage.getAllRepositories());
      }
      
      try {
        // Get repositories from GitHub
        let url = 'https://api.github.com/user/repos';
        if (organization) {
          url = `https://api.github.com/orgs/${organization}/repos`;
        }
        
        const reposResponse = await axios.get(url, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'updated',
            per_page: 100
          }
        });
        
        const repositories = reposResponse.data;
        const repoList = [];
        
        // Process repositories with additional data
        for (let i = 0; i < repositories.length; i++) {
          const repo = repositories[i];
          
          try {
            // Get contributors count
            const contributorsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contributors`;
            const contributorsResponse = await axios.get(contributorsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                per_page: 1,
                anon: true
              }
            });
            
            // GitHub provides the total count in the Link header for pagination
            let contributorsCount = 0;
            const linkHeader = contributorsResponse.headers.link || '';
            const lastPageMatch = linkHeader.match(/page=([0-9]+)>; rel="last"/); 
            if (lastPageMatch) {
              contributorsCount = parseInt(lastPageMatch[1]);
            } else {
              contributorsCount = contributorsResponse.data.length;
            }
            
            // Get commits count (approximation based on last page)
            const commitsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`;
            const commitsResponse = await axios.get(commitsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                per_page: 1
              }
            });
            
            // Estimate commit count from pagination
            let commitsCount = 0;
            const commitsLinkHeader = commitsResponse.headers.link || '';
            const lastCommitPageMatch = commitsLinkHeader.match(/page=([0-9]+)>; rel="last"/); 
            if (lastCommitPageMatch) {
              commitsCount = parseInt(lastCommitPageMatch[1]) * 30; // 30 is GitHub's default page size
            } else {
              commitsCount = commitsResponse.data.length;
            }
            
            // Get open issues count
            let openIssuesCount = repo.open_issues_count || 0;
            
            repoList.push({
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || '',
              url: repo.html_url,
              owner: {
                username: repo.owner.login,
                avatarUrl: repo.owner.avatar_url
              },
              isPrivate: repo.private,
              isArchived: repo.archived,
              isFork: repo.fork,
              language: repo.language,
              stargazersCount: repo.stargazers_count,
              forksCount: repo.forks_count,
              watchersCount: repo.watchers_count,
              openIssuesCount: openIssuesCount,
              defaultBranch: repo.default_branch,
              createdAt: new Date(repo.created_at),
              updatedAt: new Date(repo.updated_at),
              pushedAt: new Date(repo.pushed_at || repo.updated_at),
              // Additional properties we calculated
              commits: commitsCount,
              contributors: contributorsCount,
            });
            
            // Only get details for first 10 repos to avoid rate limiting
            if (i >= 9) break;
            
          } catch (repoDetailError) {
            console.error(`Error fetching details for ${repo.name}:`, repoDetailError);
            // Add repo with basic info even if details fail
            repoList.push({
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || '',
              url: repo.html_url,
              owner: {
                username: repo.owner.login,
                avatarUrl: repo.owner.avatar_url
              },
              isPrivate: repo.private,
              isArchived: repo.archived,
              isFork: repo.fork,
              language: repo.language,
              stargazersCount: repo.stargazers_count,
              forksCount: repo.forks_count,
              watchersCount: repo.watchers_count,
              openIssuesCount: repo.open_issues_count || 0,
              defaultBranch: repo.default_branch,
              createdAt: new Date(repo.created_at),
              updatedAt: new Date(repo.updated_at),
              pushedAt: new Date(repo.pushed_at || repo.updated_at),
              // Default values
              commits: 0,
              contributors: 0,
            });
          }
        }
        
        return res.json(repoList);
      } catch (githubError) {
        console.error('Error fetching GitHub repositories:', githubError);
        return res.json(await storage.getAllRepositories());
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ message: 'Failed to fetch repositories' });
    }
  });

  // Get repository by ID
  app.get('/api/repositories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const repository = await storage.getRepository(id);
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }
      
      res.json(repository);
    } catch (error) {
      console.error('Error fetching repository:', error);
      res.status(500).json({ message: 'Failed to fetch repository' });
    }
  });

  // Get commits for a repository
  app.get('/api/repositories/:id/commits', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const commits = await storage.getCommitsByRepository(id);
      res.json(commits);
    } catch (error) {
      console.error('Error fetching repository commits:', error);
      res.status(500).json({ message: 'Failed to fetch repository commits' });
    }
  });

  // Get pull requests for a repository
  app.get('/api/repositories/:id/pull-requests', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pullRequests = await storage.getPullRequestsByRepository(id);
      res.json(pullRequests);
    } catch (error) {
      console.error('Error fetching repository pull requests:', error);
      res.status(500).json({ message: 'Failed to fetch repository pull requests' });
    }
  });

  // Get issues for a repository
  app.get('/api/repositories/:id/issues', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issues = await storage.getIssuesByRepository(id);
      res.json(issues);
    } catch (error) {
      console.error('Error fetching repository issues:', error);
      res.status(500).json({ message: 'Failed to fetch repository issues' });
    }
  });

  // Get recent activities
  app.get('/api/activities/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });

  // GitHub auth status check
  app.get('/api/github/status', async (req: Request, res: Response) => {
    try {
      // Check if we have a GitHub token stored
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json({ connected: false });
      }
      
      // Validate the token and get user info
      try {
        const response = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${githubToken}`,
          },
        });
        
        if (response.status === 200 && response.data) {
          return res.json({ 
            connected: true, 
            username: response.data.login,
            avatarUrl: response.data.avatar_url,
            name: response.data.name || response.data.login
          });
        } else {
          return res.json({ connected: false });
        }
      } catch (err) {
        // Token is invalid
        return res.json({ connected: false });
      }
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      res.status(500).json({ message: 'Failed to check GitHub status' });
    }
  });

  // Connect to GitHub (would typically use OAuth, but we'll use a simple token for demo)
  app.post('/api/github/connect', async (req: Request, res: Response) => {
    try {
      const { token, organization } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'GitHub token is required' });
      }
      
      // Validate token by trying to get user info
      try {
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json'
          },
        });
        
        // If we have an organization, verify access
        if (organization) {
          try {
            await axios.get(`https://api.github.com/orgs/${organization}`, {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
              },
            });
          } catch (orgError) {
            return res.status(403).json({ 
              message: `Unable to access organization: ${organization}. Please check your token has appropriate permissions.` 
            });
          }
        }
        
        // Store the token (in a real app, this would go in a database or secure storage)
        process.env.GITHUB_TOKEN = token;
        if (organization) {
          process.env.GITHUB_ORGANIZATION = organization;
        }
        
        res.json({ 
          success: true, 
          message: 'Connected to GitHub successfully',
          username: userResponse.data.login,
          avatarUrl: userResponse.data.avatar_url
        });
      } catch (error) {
        return res.status(401).json({ message: 'Invalid GitHub token' });
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      res.status(500).json({ message: 'Failed to connect to GitHub' });
    }
  });

  // Disconnect from GitHub
  app.post('/api/github/disconnect', async (req: Request, res: Response) => {
    try {
      // Clear the stored token
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_ORGANIZATION;
      
      res.json({ success: true, message: 'Disconnected from GitHub successfully' });
    } catch (error) {
      console.error('Error disconnecting from GitHub:', error);
      res.status(500).json({ message: 'Failed to disconnect from GitHub' });
    }
  });
  
  // List organization repositories
  app.get('/api/github/repositories', async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const organization = process.env.GITHUB_ORGANIZATION;
      
      if (!githubToken) {
        return res.status(401).json({ message: 'Not connected to GitHub' });
      }
      
      let url = 'https://api.github.com/user/repos';
      if (organization) {
        url = `https://api.github.com/orgs/${organization}/repos`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 100
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      res.status(500).json({ message: 'Failed to fetch GitHub repositories' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
