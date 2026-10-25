export type Provider = "github_actions" | "gitlab_ci" | "jenkins";

export type Issue = {
  severity: "high" | "medium" | "low";
  title: string;
  explanation: string;
  recommendation: string;
  line?: number | null;
};

export type Analysis = {
  summary: string;
  health_score: number;
  issues: Issue[];
  fixed_code: string;
  provider: Provider;
  source_files: Record<string, string>;
};

export type WorkflowAnalysis = {
  file_path: string;
  original_code: string;
  fixed_code: string;
  summary: string;
  health_score: number;
  issues: Issue[];
};

export type RepoAnalysis = {
  status: "AWAITING_USER_CONFIRMATION";
  summary: string;
  workflows: WorkflowAnalysis[];
};

export type PullRequestResult = {
  status: "success";
  pr_url: string;
  pr_number: number;
  branch: string;
  base_branch: string;
  file_path: string;
};

const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${backend}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? "Request failed");
  }
  return response.json();
}

export const analyzeRaw = (code: string, provider: Provider) =>
  post<Analysis>("/api/analyze/raw", { code, provider });

export const analyzeRepo = (
  repo_url: string,
  github_token?: string
) =>
  post<RepoAnalysis>("/api/analyze/repo", {
    repo_url,
    github_token,
  });

export const createGithubPr = (
  repo_name: string,
  github_token: string,
  file_path: string,
  corrected_yaml: string,
  base_branch = "main"
) =>
  post<PullRequestResult>("/api/fix-pr", {
    repo_name,
    github_token,
    file_path,
    corrected_yaml,
    base_branch
  });
