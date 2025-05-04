import {
  Developer,
  InsertDeveloper,
  Repository,
  InsertRepository,
  Commit,
  InsertCommit,
  PullRequest,
  InsertPullRequest,
  Issue,
  InsertIssue,
  Activity,
  InsertActivity,
  GithubUser,
  InsertGithubUser,
  DashboardSummary,
  DeveloperSummary,
  RepositorySummary,
  ActivitySummary,
  IssueSummary,
  TimeRange
} from "@shared/schema";

export interface IStorage {
  // GitHub user operations
  getGithubUser(userId: number): Promise<GithubUser | undefined>;
  getGithubUserByUsername(username: string): Promise<GithubUser | undefined>;
  createGithubUser(user: InsertGithubUser): Promise<GithubUser>;
  updateGithubUser(id: number, user: Partial<InsertGithubUser>): Promise<GithubUser | undefined>;

  // Developer operations
  getDeveloper(id: number): Promise<Developer | undefined>;
  getDeveloperByUsername(username: string): Promise<Developer | undefined>;
  getAllDevelopers(): Promise<Developer[]>;
  createDeveloper(developer: InsertDeveloper): Promise<Developer>;
  updateDeveloper(id: number, developer: Partial<InsertDeveloper>): Promise<Developer | undefined>;

  // Repository operations
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoryByFullName(fullName: string): Promise<Repository | undefined>;
  getAllRepositories(): Promise<Repository[]>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined>;

  // Commit operations
  getCommit(id: number): Promise<Commit | undefined>;
  getCommitBySha(sha: string): Promise<Commit | undefined>;
  getCommitsByDeveloper(developerId: number): Promise<Commit[]>;
  getCommitsByRepository(repositoryId: number): Promise<Commit[]>;
  createCommit(commit: InsertCommit): Promise<Commit>;

  // Pull request operations
  getPullRequest(id: number): Promise<PullRequest | undefined>;
  getPullRequestsByDeveloper(developerId: number): Promise<PullRequest[]>;
  getPullRequestsByRepository(repositoryId: number): Promise<PullRequest[]>;
  createPullRequest(pullRequest: InsertPullRequest): Promise<PullRequest>;
  updatePullRequest(id: number, pullRequest: Partial<InsertPullRequest>): Promise<PullRequest | undefined>;

  // Issue operations
  getIssue(id: number): Promise<Issue | undefined>;
  getIssuesByDeveloper(developerId: number): Promise<Issue[]>;
  getIssuesByRepository(repositoryId: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByDeveloper(developerId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard operations
  getDashboardSummary(timeRange: TimeRange): Promise<DashboardSummary>;
  getDeveloperSummary(developerId: number, timeRange: TimeRange): Promise<DeveloperSummary>;
}

export class MemStorage implements IStorage {
  private githubUsers: Map<number, GithubUser>;
  private developers: Map<number, Developer>;
  private repositories: Map<number, Repository>;
  private commits: Map<number, Commit>;
  private pullRequests: Map<number, PullRequest>;
  private issues: Map<number, Issue>;
  private activities: Map<number, Activity>;

  private githubUserIdCounter: number;
  private developerIdCounter: number;
  private repositoryIdCounter: number;
  private commitIdCounter: number;
  private pullRequestIdCounter: number;
  private issueIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.githubUsers = new Map();
    this.developers = new Map();
    this.repositories = new Map();
    this.commits = new Map();
    this.pullRequests = new Map();
    this.issues = new Map();
    this.activities = new Map();

    this.githubUserIdCounter = 1;
    this.developerIdCounter = 1;
    this.repositoryIdCounter = 1;
    this.commitIdCounter = 1;
    this.pullRequestIdCounter = 1;
    this.issueIdCounter = 1;
    this.activityIdCounter = 1;

    // Initialize with sample data for development
    this.initializeWithSampleData();
  }

  // GitHub user operations
  async getGithubUser(id: number): Promise<GithubUser | undefined> {
    return this.githubUsers.get(id);
  }

  async getGithubUserByUsername(username: string): Promise<GithubUser | undefined> {
    return [...this.githubUsers.values()].find(user => user.username === username);
  }

  async createGithubUser(user: InsertGithubUser): Promise<GithubUser> {
    const id = this.githubUserIdCounter++;
    const newUser: GithubUser = { ...user, id };
    this.githubUsers.set(id, newUser);
    return newUser;
  }

  async updateGithubUser(id: number, user: Partial<InsertGithubUser>): Promise<GithubUser | undefined> {
    const existingUser = this.githubUsers.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.githubUsers.set(id, updatedUser);
    return updatedUser;
  }

  // Developer operations
  async getDeveloper(id: number): Promise<Developer | undefined> {
    return this.developers.get(id);
  }

  async getDeveloperByUsername(username: string): Promise<Developer | undefined> {
    return [...this.developers.values()].find(developer => developer.username === username);
  }

  async getAllDevelopers(): Promise<Developer[]> {
    return [...this.developers.values()];
  }

  async createDeveloper(developer: InsertDeveloper): Promise<Developer> {
    const id = this.developerIdCounter++;
    const newDeveloper: Developer = { ...developer, id, lastActive: new Date() };
    this.developers.set(id, newDeveloper);
    return newDeveloper;
  }

  async updateDeveloper(id: number, developer: Partial<InsertDeveloper>): Promise<Developer | undefined> {
    const existingDeveloper = this.developers.get(id);
    if (!existingDeveloper) return undefined;
    
    const updatedDeveloper = { ...existingDeveloper, ...developer };
    this.developers.set(id, updatedDeveloper);
    return updatedDeveloper;
  }

  // Repository operations
  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByFullName(fullName: string): Promise<Repository | undefined> {
    return [...this.repositories.values()].find(repo => repo.fullName === fullName);
  }

  async getAllRepositories(): Promise<Repository[]> {
    return [...this.repositories.values()];
  }

  async createRepository(repository: InsertRepository): Promise<Repository> {
    const id = this.repositoryIdCounter++;
    const newRepository: Repository = { ...repository, id };
    this.repositories.set(id, newRepository);
    return newRepository;
  }

  async updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined> {
    const existingRepository = this.repositories.get(id);
    if (!existingRepository) return undefined;
    
    const updatedRepository = { ...existingRepository, ...repository };
    this.repositories.set(id, updatedRepository);
    return updatedRepository;
  }

  // Commit operations
  async getCommit(id: number): Promise<Commit | undefined> {
    return this.commits.get(id);
  }

  async getCommitBySha(sha: string): Promise<Commit | undefined> {
    return [...this.commits.values()].find(commit => commit.sha === sha);
  }

  async getCommitsByDeveloper(developerId: number): Promise<Commit[]> {
    return [...this.commits.values()].filter(commit => commit.developerId === developerId);
  }

  async getCommitsByRepository(repositoryId: number): Promise<Commit[]> {
    return [...this.commits.values()].filter(commit => commit.repositoryId === repositoryId);
  }

  async createCommit(commit: InsertCommit): Promise<Commit> {
    const id = this.commitIdCounter++;
    const newCommit: Commit = { ...commit, id };
    this.commits.set(id, newCommit);
    return newCommit;
  }

  // Pull request operations
  async getPullRequest(id: number): Promise<PullRequest | undefined> {
    return this.pullRequests.get(id);
  }

  async getPullRequestsByDeveloper(developerId: number): Promise<PullRequest[]> {
    return [...this.pullRequests.values()].filter(pr => pr.developerId === developerId);
  }

  async getPullRequestsByRepository(repositoryId: number): Promise<PullRequest[]> {
    return [...this.pullRequests.values()].filter(pr => pr.repositoryId === repositoryId);
  }

  async createPullRequest(pullRequest: InsertPullRequest): Promise<PullRequest> {
    const id = this.pullRequestIdCounter++;
    const newPullRequest: PullRequest = { ...pullRequest, id };
    this.pullRequests.set(id, newPullRequest);
    return newPullRequest;
  }

  async updatePullRequest(id: number, pullRequest: Partial<InsertPullRequest>): Promise<PullRequest | undefined> {
    const existingPullRequest = this.pullRequests.get(id);
    if (!existingPullRequest) return undefined;
    
    const updatedPullRequest = { ...existingPullRequest, ...pullRequest };
    this.pullRequests.set(id, updatedPullRequest);
    return updatedPullRequest;
  }

  // Issue operations
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }

  async getIssuesByDeveloper(developerId: number): Promise<Issue[]> {
    return [...this.issues.values()].filter(issue => issue.developerId === developerId);
  }

  async getIssuesByRepository(repositoryId: number): Promise<Issue[]> {
    return [...this.issues.values()].filter(issue => issue.repositoryId === repositoryId);
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const id = this.issueIdCounter++;
    const newIssue: Issue = { ...issue, id };
    this.issues.set(id, newIssue);
    return newIssue;
  }

  async updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined> {
    const existingIssue = this.issues.get(id);
    if (!existingIssue) return undefined;
    
    const updatedIssue = { ...existingIssue, ...issue };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByDeveloper(developerId: number): Promise<Activity[]> {
    return [...this.activities.values()]
      .filter(activity => activity.developerId === developerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return [...this.activities.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const newActivity: Activity = { ...activity, id };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Dashboard operations
  async getDashboardSummary(timeRange: TimeRange): Promise<DashboardSummary> {
    // This would normally calculate actual statistics based on the time range
    // For now, returning a default structure with basic data
    return {
      totalCommits: 1254,
      totalCommitsChange: 12.4,
      activeDevelopers: 18,
      activeDevelopersChange: 2.8,
      pullRequests: 86,
      pullRequestsChange: -5.2,
      openIssues: 32,
      openIssuesChange: 8.7,
      commitActivity: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [42, 85, 68, 92, 75, 35, 29],
      },
      developerComparison: {
        labels: ['Alex J.', 'Sarah C.', 'Michael R.', 'Emily W.', 'David K.'],
        commits: [142, 118, 95, 87, 64],
        pullRequests: [23, 20, 18, 18, 12],
      },
      topDevelopers: this.getTopDevelopers(5),
      recentActivities: this.getRecentActivitiesSummary(5),
      repositoryActivity: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { name: 'Frontend', data: [35, 48, 42, 58, 65, 45] },
          { name: 'Backend API', data: [42, 38, 45, 30, 35, 38] },
          { name: 'Mobile App', data: [28, 32, 25, 30, 28, 32] },
          { name: 'Documentation', data: [15, 20, 18, 25, 22, 19] },
        ],
      },
      topRepositories: this.getTopRepositories(4),
      issuesOverview: {
        open: 32,
        inProgress: 18,
        closed: 67,
        recentIssues: this.getRecentIssues(5),
      },
    };
  }

  async getDeveloperSummary(developerId: number, timeRange: TimeRange): Promise<DeveloperSummary> {
    const developer = this.developers.get(developerId);
    if (!developer) {
      throw new Error(`Developer with ID ${developerId} not found`);
    }

    // This would normally calculate actual statistics for the developer based on the time range
    return {
      id: developer.id,
      username: developer.username,
      name: developer.name || '',
      avatarUrl: developer.avatarUrl || '',
      commits: 142,
      commitsChange: 23.5,
      linesAdded: 3458,
      linesRemoved: 482,
      pullRequestCompletion: {
        completed: 21,
        total: 23,
        percentage: 91,
      },
    };
  }

  // Helper methods to generate summary data
  private getTopDevelopers(limit: number): DeveloperSummary[] {
    // Sample data for demonstration
    return [
      {
        id: 1,
        username: 'alexjohnson',
        name: 'Alex Johnson',
        avatarUrl: '',
        commits: 142,
        commitsChange: 23.5,
        linesAdded: 3458,
        linesRemoved: 482,
        pullRequestCompletion: {
          completed: 21,
          total: 23,
          percentage: 91,
        },
      },
      {
        id: 2,
        username: 'sarahc',
        name: 'Sarah Chen',
        avatarUrl: '',
        commits: 118,
        commitsChange: 17.2,
        linesAdded: 2874,
        linesRemoved: 340,
        pullRequestCompletion: {
          completed: 17,
          total: 20,
          percentage: 85,
        },
      },
      {
        id: 3,
        username: 'mrivera',
        name: 'Michael Rivera',
        avatarUrl: '',
        commits: 95,
        commitsChange: -3.8,
        linesAdded: 2145,
        linesRemoved: 630,
        pullRequestCompletion: {
          completed: 13,
          total: 18,
          percentage: 72,
        },
      },
      {
        id: 4,
        username: 'emwatson',
        name: 'Emily Watson',
        avatarUrl: '',
        commits: 87,
        commitsChange: 5.1,
        linesAdded: 1985,
        linesRemoved: 217,
        pullRequestCompletion: {
          completed: 16,
          total: 18,
          percentage: 89,
        },
      },
    ].slice(0, limit);
  }

  private getRecentActivitiesSummary(limit: number): ActivitySummary[] {
    // Sample data for demonstration
    return [
      {
        id: 1,
        type: 'pullRequest',
        developerName: 'Alex Johnson',
        developerUsername: 'alexjohnson',
        message: 'Merged pull request #482: "Fix authentication workflow"',
        resourceId: '482',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'pullRequest',
        developerName: 'Sarah Chen',
        developerUsername: 'sarahc',
        message: 'Created pull request #485: "Implement new dashboard features"',
        resourceId: '485',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: 'commit',
        developerName: 'Michael Rivera',
        developerUsername: 'mrivera',
        message: 'Pushed 7 commits to feature/api-enhancements',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        type: 'issue',
        developerName: 'Emily Watson',
        developerUsername: 'emwatson',
        message: 'Created issue #128: "Mobile responsiveness bug in profile page"',
        resourceId: '128',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 5,
        type: 'deployment',
        developerName: 'System',
        developerUsername: 'system',
        message: 'Deployment failed for v2.4.1 on production',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ].slice(0, limit);
  }

  private getTopRepositories(limit: number): RepositorySummary[] {
    // Sample data for demonstration
    return [
      {
        id: 1,
        name: 'Frontend',
        commits: 45,
        contributors: 4,
        openIssues: 8,
      },
      {
        id: 2,
        name: 'Backend API',
        commits: 38,
        contributors: 3,
        openIssues: 5,
      },
      {
        id: 3,
        name: 'Mobile App',
        commits: 32,
        contributors: 2,
        openIssues: 7,
      },
      {
        id: 4,
        name: 'Documentation',
        commits: 19,
        contributors: 5,
        openIssues: 2,
      },
    ].slice(0, limit);
  }

  private getRecentIssues(limit: number): IssueSummary[] {
    // Sample data for demonstration
    return [
      {
        id: 1,
        number: 128,
        title: 'Mobile responsiveness bug in profile page',
        state: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          username: 'emwatson',
          name: 'Emily Watson',
        },
      },
      {
        id: 2,
        number: 127,
        title: 'Performance optimization for data loading',
        state: 'open',
        priority: 'medium',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          username: 'mrivera',
          name: 'Michael Rivera',
        },
      },
      {
        id: 3,
        number: 126,
        title: 'Add dark mode toggle in settings',
        state: 'in_progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          username: 'sarahc',
          name: 'Sarah Chen',
        },
      },
      {
        id: 4,
        number: 125,
        title: 'Update documentation for API v2',
        state: 'open',
        priority: 'low',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          username: 'alexjohnson',
          name: 'Alex Johnson',
        },
      },
      {
        id: 5,
        number: 124,
        title: 'Authentication fails on Safari browser',
        state: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          username: 'mrivera',
          name: 'Michael Rivera',
        },
      },
    ].slice(0, limit);
  }

  private initializeWithSampleData(): void {
    // This method would seed the in-memory store with initial data if needed
    // Currently the helper methods generate sample data when requested
  }
}

export const storage = new MemStorage();
