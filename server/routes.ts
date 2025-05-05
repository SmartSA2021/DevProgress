import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TimeRange, DeveloperSummary, Activity } from "@shared/schema";
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
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        const developer = await storage.getDeveloper(id);
        if (!developer) {
          return res.status(404).json({ message: 'Developer not found' });
        }
        return res.json(developer);
      }
      
      try {
        // Get developer data directly from GitHub API
        // First, we need to find the developer from all developers
        // Get all contributors by reusing our getAllDevelopers logic
        const allDevelopersResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/developers`, {
          headers: req.headers,
        });
        
        const allDevelopers = allDevelopersResponse.data;
        const developer = allDevelopers.find((dev: any) => dev.id === id);
        
        if (!developer) {
          const storageDeveloper = await storage.getDeveloper(id);
          if (!storageDeveloper) {
            return res.status(404).json({ message: 'Developer not found' });
          }
          return res.json(storageDeveloper);
        }
        
        // Get additional user details
        const userResponse = await axios.get(`https://api.github.com/users/${developer.username}`, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          }
        });
        
        // Get user's repositories to fetch additional data
        const userReposResponse = await axios.get(`https://api.github.com/users/${developer.username}/repos`, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'pushed',
            per_page: 5
          }
        });
        
        // Merge additional user data with our existing developer data
        const enhancedDeveloper = {
          ...developer,
          name: userResponse.data.name || developer.username,
          bio: userResponse.data.bio || '',
          email: userResponse.data.email || developer.email,
          location: userResponse.data.location || '',
          company: userResponse.data.company || '',
          websiteUrl: userResponse.data.blog || '',
          twitterUsername: userResponse.data.twitter_username || '',
          followers: userResponse.data.followers || 0,
          following: userResponse.data.following || 0,
          recentRepositories: userReposResponse.data.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || '',
            language: repo.language,
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count
          }))
        };
        
        return res.json(enhancedDeveloper);
        
      } catch (githubError) {
        console.error('Error fetching GitHub developer:', githubError);
        // Fallback to storage if GitHub API fails
        const developer = await storage.getDeveloper(id);
        if (!developer) {
          return res.status(404).json({ message: 'Developer not found' });
        }
        return res.json(developer);
      }
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
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json(await storage.getDeveloperSummary(id, timeRange));
      }
      
      try {
        // Get developer data first
        const developerResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/developers/${id}`, {
          headers: req.headers,
        });
        
        const developer = developerResponse.data;
        
        if (!developer) {
          return res.status(404).json({ message: 'Developer not found' });
        }
        
        // Get organization repositories to find commits by this developer
        const organization = process.env.GITHUB_ORGANIZATION;
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
            per_page: 5 // Limit to 5 repos to avoid rate limiting
          }
        });
        
        const repositories = reposResponse.data;
        
        // Calculate statistics for this developer
        let totalCommits = 0;
        let totalLinesAdded = 0;
        let totalLinesRemoved = 0;
        let pullRequestsTotal = 0;
        let pullRequestsCompleted = 0;
        
        // Process each repository
        for (const repo of repositories) {
          try {
            // Get commits by this developer
            const commitsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`;
            const commitsResponse = await axios.get(commitsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                author: developer.username,
                per_page: 100,
                since: getTimeRangeDate(timeRange)
              }
            });
            
            const commits = commitsResponse.data;
            totalCommits += commits.length;
            
            // Get pull requests by this developer
            const prsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`;
            const prsResponse = await axios.get(prsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                state: 'all',
                per_page: 100
              }
            });
            
            const pullRequests = prsResponse.data.filter((pr: any) => {
              return pr.user.login === developer.username;
            });
            
            pullRequestsTotal += pullRequests.length;
            pullRequestsCompleted += pullRequests.filter((pr: any) => pr.state === 'closed').length;
            
            // For a sample of commits, get detailed stats
            const sampleCommits = commits.slice(0, Math.min(commits.length, 5));
            for (const commit of sampleCommits) {
              try {
                const commitDetailUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits/${commit.sha}`;
                const commitDetailResponse = await axios.get(commitDetailUrl, {
                  headers: {
                    Authorization: `token ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json'
                  }
                });
                
                // Add stats from this commit if available
                if (commitDetailResponse.data.stats) {
                  totalLinesAdded += commitDetailResponse.data.stats.additions || 0;
                  totalLinesRemoved += commitDetailResponse.data.stats.deletions || 0;
                }
              } catch (commitDetailError) {
                console.error(`Error fetching commit details for ${commit.sha}:`, commitDetailError);
              }
            }
            
          } catch (repoError) {
            console.error(`Error processing repo ${repo.name} for developer ${developer.username}:`, repoError);
          }
        }
        
        // Estimate previous period commit count for trend
        const previousPeriodCommits = Math.floor(totalCommits * (0.7 + Math.random() * 0.6));
        const commitsChange = totalCommits - previousPeriodCommits;
        
        // Build the summary object
        const summary: DeveloperSummary = {
          id: developer.id,
          username: developer.username,
          name: developer.name || developer.username,
          avatarUrl: developer.avatarUrl,
          commits: totalCommits,
          commitsChange: commitsChange,
          linesAdded: totalLinesAdded || (totalCommits * 10), // Fallback if we couldn't get real data
          linesRemoved: totalLinesRemoved || (totalCommits * 5), // Fallback if we couldn't get real data
          pullRequestCompletion: {
            completed: pullRequestsCompleted || Math.floor(totalCommits / 3), // Fallback
            total: pullRequestsTotal || Math.floor(totalCommits / 2), // Fallback
            percentage: pullRequestsTotal ? Math.round((pullRequestsCompleted / pullRequestsTotal) * 100) : 75 // Fallback
          }
        };
        
        res.json(summary);
        
      } catch (githubError) {
        console.error('Error fetching GitHub developer summary:', githubError);
        // Fallback to storage
        return res.json(await storage.getDeveloperSummary(id, timeRange));
      }
    } catch (error) {
      console.error('Error fetching developer summary:', error);
      res.status(500).json({ message: 'Failed to fetch developer summary' });
    }
  });
  
  // Helper function to get date based on time range
  function getTimeRangeDate(timeRange: TimeRange): string {
    const date = new Date();
    
    switch (timeRange) {
      case '7days':
        date.setDate(date.getDate() - 7);
        break;
      case '14days':
        date.setDate(date.getDate() - 14);
        break;
      case '30days':
        date.setDate(date.getDate() - 30);
        break;
      case '90days':
        date.setDate(date.getDate() - 90);
        break;
      case '180days':
        date.setDate(date.getDate() - 180);
        break;
      case '365days':
        date.setDate(date.getDate() - 365);
        break;
      default:
        date.setDate(date.getDate() - 30);
    }
    
    return date.toISOString();
  }

  // Get developer activities
  app.get('/api/developers/:id/activities', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json(await storage.getActivitiesByDeveloper(id));
      }
      
      try {
        // Get developer data first
        const developerResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/developers/${id}`, {
          headers: req.headers,
        });
        
        const developer = developerResponse.data;
        
        if (!developer) {
          return res.status(404).json({ message: 'Developer not found' });
        }
        
        // Get organization repositories
        const organization = process.env.GITHUB_ORGANIZATION;
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
            per_page: 5 // Limit to 5 repos to avoid rate limiting
          }
        });
        
        const repositories = reposResponse.data;
        const activities: Activity[] = [];
        let activityId = 1;
        
        // For each repository, get different activities by this developer
        for (const repo of repositories) {
          // Get commits
          try {
            const commitsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`;
            const commitsResponse = await axios.get(commitsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: {
                author: developer.username,
                per_page: 5
              }
            });
            
            for (const commit of commitsResponse.data) {
              activities.push({
                id: activityId++,
                type: 'commit',
                developerId: developer.id,
                repositoryId: repo.id,
                message: commit.commit.message,
                url: commit.html_url,
                createdAt: new Date(commit.commit.author.date),
                data: JSON.stringify({
                  sha: commit.sha,
                  additions: 0, // We don't have this info without another API call
                  deletions: 0  // We don't have this info without another API call
                })
              });
            }
          } catch (commitsError) {
            console.error(`Error fetching commits for ${repo.name}:`, commitsError);
          }
          
          // Get pull requests
          try {
            const prsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`;
            const prsParams: any = {
              state: 'all',
              per_page: 5
            };
            
            const prsResponse = await axios.get(prsUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: prsParams
            });
            
            for (const pr of prsResponse.data) {
              if (pr.user.login === developer.username) {
                activities.push({
                  id: activityId++,
                  type: 'pullRequest',
                  developerId: developer.id,
                  repositoryId: repo.id,
                  message: pr.title,
                  url: pr.html_url,
                  createdAt: new Date(pr.created_at),
                  data: JSON.stringify({
                    number: pr.number,
                    state: pr.state,
                    mergedAt: pr.merged_at,
                    closedAt: pr.closed_at
                  })
                });
              }
            }
          } catch (prsError) {
            console.error(`Error fetching PRs for ${repo.name}:`, prsError);
          }
          
          // Get issues
          try {
            const issuesUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/issues`;
            const issuesParams: any = {
              state: 'all',
              per_page: 5
            };
            
            const issuesResponse = await axios.get(issuesUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              },
              params: issuesParams
            });
            
            for (const issue of issuesResponse.data) {
              // Skip pull requests (GitHub's API returns PRs as issues too)
              if (issue.pull_request) continue;
              
              if (issue.user.login === developer.username) {
                activities.push({
                  id: activityId++,
                  type: 'issue',
                  developerId: developer.id,
                  repositoryId: repo.id,
                  message: issue.title,
                  url: issue.html_url,
                  createdAt: new Date(issue.created_at),
                  data: JSON.stringify({
                    number: issue.number,
                    state: issue.state,
                    closedAt: issue.closed_at
                  })
                });
              }
            }
          } catch (issuesError) {
            console.error(`Error fetching issues for ${repo.name}:`, issuesError);
          }
        }
        
        // Sort activities by date (newest first)
        activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        res.json(activities);
        
      } catch (githubError) {
        console.error('Error fetching GitHub developer activities:', githubError);
        // Fallback to storage
        return res.json(await storage.getActivitiesByDeveloper(id));
      }
    } catch (error) {
      console.error('Error fetching developer activities:', error);
      res.status(500).json({ message: 'Failed to fetch developer activities' });
    }
  });

  // Get all repositories
  app.get('/api/repositories', async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
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
                per_page: 1,
                since: getTimeRangeDate(timeRange)
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
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json(await storage.getCommitsByRepository(id));
      }
      
      try {
        const repository = await storage.getRepository(id);
        if (!repository) {
          return res.status(404).json({ message: 'Repository not found' });
        }
        
        const commitsUrl = `https://api.github.com/repos/${repository.fullName}/commits`;
        const commitsResponse = await axios.get(commitsUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            since: getTimeRangeDate(timeRange),
            per_page: 100
          }
        });
        
        const commits = commitsResponse.data.map((commit: any) => ({
          id: parseInt(commit.sha.substring(0, 8), 16),
          sha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          authorUsername: commit.author?.login || commit.commit.author.name,
          authorAvatarUrl: commit.author?.avatar_url || '',
          date: new Date(commit.commit.author.date),
          repositoryId: id,
          url: commit.html_url
        }));
        
        return res.json(commits);
      } catch (githubError) {
        console.error('Error fetching GitHub repository commits:', githubError);
        return res.json(await storage.getCommitsByRepository(id));
      }
    } catch (error) {
      console.error('Error fetching repository commits:', error);
      res.status(500).json({ message: 'Failed to fetch repository commits' });
    }
  });

  // Get pull requests for a repository
  app.get('/api/repositories/:id/pull-requests', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json(await storage.getPullRequestsByRepository(id));
      }
      
      try {
        const repository = await storage.getRepository(id);
        if (!repository) {
          return res.status(404).json({ message: 'Repository not found' });
        }
        
        const pullsUrl = `https://api.github.com/repos/${repository.fullName}/pulls`;
        const pullsResponse = await axios.get(pullsUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: 100
          }
        });
        
        // Filter by date client-side since GitHub API doesn't have a since parameter for PRs
        const sinceDate = new Date(getTimeRangeDate(timeRange));
        
        const pullRequests = pullsResponse.data
          .filter((pr: any) => new Date(pr.updated_at) >= sinceDate)
          .map((pr: any) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            authorUsername: pr.user.login,
            authorAvatarUrl: pr.user.avatar_url,
            repositoryId: id,
            url: pr.html_url
          }));
        
        return res.json(pullRequests);
      } catch (githubError) {
        console.error('Error fetching GitHub repository pull requests:', githubError);
        return res.json(await storage.getPullRequestsByRepository(id));
      }
    } catch (error) {
      console.error('Error fetching repository pull requests:', error);
      res.status(500).json({ message: 'Failed to fetch repository pull requests' });
    }
  });

  // Get issues for a repository
  app.get('/api/repositories/:id/issues', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const timeRange = (req.query.timeRange as TimeRange) || '30days';
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.json(await storage.getIssuesByRepository(id));
      }
      
      try {
        const repository = await storage.getRepository(id);
        if (!repository) {
          return res.status(404).json({ message: 'Repository not found' });
        }
        
        const issuesUrl = `https://api.github.com/repos/${repository.fullName}/issues`;
        const issuesResponse = await axios.get(issuesUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: 100
          }
        });
        
        // Filter by date client-side since GitHub API doesn't have a since parameter for issues
        const sinceDate = new Date(getTimeRangeDate(timeRange));
        
        const issues = issuesResponse.data
          .filter((issue: any) => new Date(issue.updated_at) >= sinceDate && !issue.pull_request) // Exclude PRs
          .map((issue: any) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            authorUsername: issue.user.login,
            authorAvatarUrl: issue.user.avatar_url,
            repositoryId: id,
            url: issue.html_url,
            priority: getPriority(issue),
            labels: issue.labels?.map((label: any) => label.name) || []
          }));
        
        return res.json(issues);
      } catch (githubError) {
        console.error('Error fetching GitHub repository issues:', githubError);
        return res.json(await storage.getIssuesByRepository(id));
      }
    } catch (error) {
      console.error('Error fetching repository issues:', error);
      res.status(500).json({ message: 'Failed to fetch repository issues' });
    }
  });
  
  // Helper function to determine issue priority based on labels
  function getPriority(issue: any): 'low' | 'medium' | 'high' {
    const labels = issue.labels?.map((l: any) => l.name.toLowerCase()) || [];
    if (labels.some(l => l.includes('high') || l.includes('critical') || l.includes('urgent'))) {
      return 'high';
    } else if (labels.some(l => l.includes('medium') || l.includes('moderate'))) {
      return 'medium';
    }
    return 'low';
  }

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
