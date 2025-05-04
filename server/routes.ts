import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TimeRange } from "@shared/schema";
import axios from "axios";

// Validate GitHub token
const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    return false;
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
      // In a real app, you would check the user's session for a GitHub token
      // For now, we'll just return a mock status
      res.json({ connected: true, username: 'github_user' });
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      res.status(500).json({ message: 'Failed to check GitHub status' });
    }
  });

  // Connect to GitHub (would typically use OAuth, but we'll use a simple token for demo)
  app.post('/api/github/connect', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'GitHub token is required' });
      }
      
      const isValid = await validateToken(token);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid GitHub token' });
      }
      
      // In a real app, you would store this token in the user's session
      // and use it to make authenticated requests to the GitHub API
      
      res.json({ success: true, message: 'Connected to GitHub successfully' });
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      res.status(500).json({ message: 'Failed to connect to GitHub' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
