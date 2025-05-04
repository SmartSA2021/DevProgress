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
      const summary = await storage.getDashboardSummary(timeRange);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Get all developers
  app.get('/api/developers', async (req: Request, res: Response) => {
    try {
      const developers = await storage.getAllDevelopers();
      res.json(developers);
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
      const repositories = await storage.getAllRepositories();
      res.json(repositories);
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
