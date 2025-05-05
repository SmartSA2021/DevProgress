import { apiRequest } from './queryClient';
import {
  TimeRange,
  GitHubCommitResponse,
  GitHubPullRequestResponse,
  GitHubIssueResponse,
  GitHubRepositoryResponse,
  GitHubUserResponse,
  DashboardSummary,
  DeveloperSummary
} from '@shared/schema';

// API functions for dashboard data
export async function fetchDashboardData(timeRange: TimeRange = '30days'): Promise<DashboardSummary> {
  const response = await apiRequest('GET', `/api/dashboard?timeRange=${timeRange}`, undefined);
  return response.json();
}

// API functions for developers
export async function fetchDevelopers() {
  const response = await apiRequest('GET', '/api/developers', undefined);
  return response.json();
}

export async function fetchDeveloper(id: number) {
  const response = await apiRequest('GET', `/api/developers/${id}`, undefined);
  return response.json();
}

export async function fetchDeveloperSummary(id: number, timeRange: TimeRange = '30days'): Promise<DeveloperSummary> {
  const response = await apiRequest('GET', `/api/developers/${id}/summary?timeRange=${timeRange}`, undefined);
  return response.json();
}

export async function fetchDeveloperActivities(id: number) {
  const response = await apiRequest('GET', `/api/developers/${id}/activities`, undefined);
  return response.json();
}

// API functions for repositories
export async function fetchRepositories(timeRange: TimeRange = '30days') {
  const response = await apiRequest('GET', `/api/repositories?timeRange=${timeRange}`, undefined);
  return response.json();
}

export async function fetchRepository(id: number) {
  const response = await apiRequest('GET', `/api/repositories/${id}`, undefined);
  return response.json();
}

export async function fetchRepositoryCommits(id: number, timeRange: TimeRange = '30days') {
  const response = await apiRequest('GET', `/api/repositories/${id}/commits?timeRange=${timeRange}`, undefined);
  return response.json();
}

export async function fetchRepositoryPullRequests(id: number, timeRange: TimeRange = '30days') {
  const response = await apiRequest('GET', `/api/repositories/${id}/pull-requests?timeRange=${timeRange}`, undefined);
  return response.json();
}

export async function fetchRepositoryIssues(id: number, timeRange: TimeRange = '30days') {
  const response = await apiRequest('GET', `/api/repositories/${id}/issues?timeRange=${timeRange}`, undefined);
  return response.json();
}

// API functions for activities
export async function fetchRecentActivities(limit: number = 10) {
  const response = await apiRequest('GET', `/api/activities/recent?limit=${limit}`, undefined);
  return response.json();
}

// GitHub connection functions
export async function checkGitHubStatus() {
  const response = await apiRequest('GET', '/api/github/status', undefined);
  return response.json();
}

export async function connectToGitHub(token: string, organization?: string) {
  const response = await apiRequest('POST', '/api/github/connect', { token, organization });
  return response.json();
}

// Function signature compatible with useMutation in react-query
export function connectToGitHubMutation(params: { token: string, organization?: string }) {
  return connectToGitHub(params.token, params.organization);
}

export async function disconnectFromGitHub() {
  const response = await apiRequest('POST', '/api/github/disconnect', undefined);
  return response.json();
}

export async function fetchGitHubRepositories() {
  const response = await apiRequest('GET', '/api/github/repositories', undefined);
  return response.json();
}

// Convert time range to readable text
export function timeRangeToText(timeRange: TimeRange): string {
  switch (timeRange) {
    case '7days':
      return 'Last 7 days';
    case '14days':
      return 'Last 14 days';
    case '30days':
      return 'Last 30 days';
    case '90days':
      return 'Last quarter';
    case '180days':
      return 'Last 6 months';
    case '365days':
      return 'Last year';
    default:
      return 'Last 30 days';
  }
}
