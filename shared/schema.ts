import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// GitHub User schema
export const githubUsers = pgTable("github_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token"),
});

export const insertGithubUserSchema = createInsertSchema(githubUsers).pick({
  username: true,
  name: true,
  avatarUrl: true,
  accessToken: true,
});

// Developer schema
export const developers = pgTable("developers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  lastActive: timestamp("last_active"),
  stats: jsonb("stats"),
});

export const insertDeveloperSchema = createInsertSchema(developers).pick({
  username: true,
  name: true,
  avatarUrl: true,
  email: true,
  isActive: true,
  stats: true,
});

// Repository schema
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull().unique(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  stats: jsonb("stats"),
});

export const insertRepositorySchema = createInsertSchema(repositories).pick({
  name: true,
  fullName: true,
  description: true,
  isPrivate: true,
  stats: true,
});

// Commit schema
export const commits = pgTable("commits", {
  id: serial("id").primaryKey(),
  sha: text("sha").notNull().unique(),
  message: text("message").notNull(),
  developerId: integer("developer_id").notNull(),
  repositoryId: integer("repository_id").notNull(),
  committedAt: timestamp("committed_at").notNull(),
  additions: integer("additions"),
  deletions: integer("deletions"),
  changedFiles: integer("changed_files"),
});

export const insertCommitSchema = createInsertSchema(commits).pick({
  sha: true,
  message: true,
  developerId: true,
  repositoryId: true,
  committedAt: true,
  additions: true,
  deletions: true,
  changedFiles: true,
});

// PullRequest schema
export const pullRequests = pgTable("pull_requests", {
  id: serial("id").primaryKey(),
  prNumber: integer("pr_number").notNull(),
  title: text("title").notNull(),
  state: text("state").notNull(),
  developerId: integer("developer_id").notNull(),
  repositoryId: integer("repository_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  closedAt: timestamp("closed_at"),
  mergedAt: timestamp("merged_at"),
});

export const insertPullRequestSchema = createInsertSchema(pullRequests).pick({
  prNumber: true,
  title: true,
  state: true,
  developerId: true,
  repositoryId: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  mergedAt: true,
});

// Issue schema
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  issueNumber: integer("issue_number").notNull(),
  title: text("title").notNull(),
  state: text("state").notNull(),
  priority: text("priority"),
  developerId: integer("developer_id").notNull(),
  repositoryId: integer("repository_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  closedAt: timestamp("closed_at"),
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  issueNumber: true,
  title: true,
  state: true,
  priority: true,
  developerId: true,
  repositoryId: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

// Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  action: text("action").notNull(),
  developerId: integer("developer_id").notNull(),
  repositoryId: integer("repository_id"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  action: true,
  developerId: true,
  repositoryId: true,
  resourceId: true,
  details: true,
  createdAt: true,
});

// Export types
export type GithubUser = typeof githubUsers.$inferSelect;
export type InsertGithubUser = z.infer<typeof insertGithubUserSchema>;

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;

export type Commit = typeof commits.$inferSelect;
export type InsertCommit = z.infer<typeof insertCommitSchema>;

export type PullRequest = typeof pullRequests.$inferSelect;
export type InsertPullRequest = z.infer<typeof insertPullRequestSchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Types for GitHub API responses
export interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
}

export interface GitHubPullRequestResponse {
  id: number;
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
}

export interface GitHubIssueResponse {
  id: number;
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubUserResponse {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

// Dashboard summary types
export interface DashboardSummary {
  totalCommits: number;
  totalCommitsChange: number;
  activeDevelopers: number;
  activeDevelopersChange: number;
  pullRequests: number;
  pullRequestsChange: number;
  openIssues: number;
  openIssuesChange: number;
  commitActivity: {
    labels: string[];
    data: number[];
  };
  developerComparison: {
    labels: string[];
    commits: number[];
    pullRequests: number[];
  };
  topDevelopers: DeveloperSummary[];
  recentActivities: ActivitySummary[];
  repositoryActivity: {
    labels: string[];
    datasets: {
      name: string;
      data: number[];
    }[];
  };
  topRepositories: RepositorySummary[];
  issuesOverview: {
    open: number;
    inProgress: number;
    closed: number;
    recentIssues: IssueSummary[];
  };
}

export interface DeveloperSummary {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
  commits: number;
  commitsChange: number;
  linesAdded: number;
  linesRemoved: number;
  pullRequestCompletion: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface RepositorySummary {
  id: number;
  name: string;
  commits: number;
  contributors: number;
  openIssues: number;
}

export interface ActivitySummary {
  id: number;
  type: 'commit' | 'pullRequest' | 'issue' | 'deployment';
  developerName: string;
  developerUsername: string;
  message: string;
  resourceId?: string;
  timestamp: string;
}

export interface IssueSummary {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: {
    username: string;
    name: string;
  };
}

// Time range for filtering
export type TimeRange = '7days' | '14days' | '30days' | '90days' | '180days' | '365days';
