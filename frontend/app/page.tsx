"use client";

import { useState } from "react";
import { FileCode2, Github, Loader2, Search } from "lucide-react";
import CodeComparison from "@/components/CodeComparison";
import IssueCard from "@/components/IssueCard";
import SuccessCard from "@/components/SuccessCard";
import { useAnalysis } from "@/hooks/useAnalysis";
import type { Provider, PullRequestResult } from "@/lib/api";

export default function Home() {
  const [tab, setTab] = useState<"raw" | "repo">("raw");
  const [code, setCode] = useState("");
  const [provider, setProvider] = useState<Provider>("github_actions");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [remediationStatus, setRemediationStatus] = useState("");
  const [prResult, setPrResult] = useState<PullRequestResult | null>(null);
  const { result, repoResult, loading, error, runRaw, runRepo, applyWorkflowFix, reset } =
    useAnalysis();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10">
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-blue-400">AI-POWERED DEVOPS</p>
        <h1 className="text-4xl font-bold tracking-tight">
          CI/CD Code Analysis &amp; Fixing
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Find security risks, deprecated actions, syntax errors, and performance
          bottlenecks before they break your pipeline.
        </p>
      </header>

      <div className="mb-6 flex gap-2 border-b border-slate-800">
        <Tab active={tab === "raw"} onClick={() => setTab("raw")} icon={<FileCode2 size={17} />}>
          Paste &amp; Analyze
        </Tab>
        <Tab active={tab === "repo"} onClick={() => setTab("repo")} icon={<Github size={17} />}>
          Repo Inspector
        </Tab>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        {tab === "raw" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-400" htmlFor="provider">
                Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value as Provider)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="github_actions">GitHub Actions</option>
                <option value="gitlab_ci">GitLab CI</option>
                <option value="jenkins">Jenkinsfile</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Paste your workflow YAML or Jenkinsfile here..."
              className="min-h-[360px] w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm outline-none focus:border-blue-500"
            />
            <button
              disabled={loading || !code.trim()}
              onClick={() => void runRaw(code, provider)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={17} /> Analyze Code
            </button>
          </>
        ) : (
          <>
            <label className="mb-2 block text-sm text-slate-400" htmlFor="repo">
              GitHub repository URL or owner/repo
            </label>
            <input
              id="repo"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-blue-500"
            />
            <label className="mb-2 mt-4 block text-sm text-slate-400" htmlFor="token">
              GitHub token (required to create a pull request)
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-blue-500"
            />
            <button
              disabled={loading || !repo.trim()}
              onClick={() => void runRepo(repo, token || undefined)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Github size={17} /> Fetch &amp; Analyze
            </button>
          </>
        )}
        {loading && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300">
            <Loader2 className="animate-spin" size={16} /> Processing...
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {remediationStatus && (
          <p className="mt-4 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
            {remediationStatus}
          </p>
        )}
      </section>

      {result && (
        <section className="mt-8">
          <p className="text-sm uppercase tracking-wide text-slate-500">Analysis summary</p>
          <p className="mt-2 text-lg">{result.summary}</p>
          <div className="mt-6 grid gap-3">
            {result.issues.map((issue, index) => (
              <IssueCard key={`${issue.title}-${index}`} issue={issue} />
            ))}
          </div>
          <CodeComparison
            original={result.source_files.input ?? Object.values(result.source_files).join("\n\n")}
            fixed={result.fixed_code}
          />
        </section>
      )}

      {prResult ? (
        <section className="mt-8">
          <SuccessCard
            prUrl={prResult.pr_url}
            prNumber={prResult.pr_number}
            branch={prResult.branch}
            onReset={() => {
              setPrResult(null);
              setRemediationStatus("");
              setRepo("");
              setToken("");
              reset();
            }}
          />
        </section>
      ) : repoResult && (
        <section className="mt-8">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
              Awaiting user confirmation
            </p>
            <p className="mt-2">{repoResult.summary}</p>
            {!token.trim() && (
              <p className="mt-2 text-sm text-yellow-200">
                Enter a GitHub token before approving.
              </p>
            )}
          </div>
          {repoResult.workflows.map((workflow) => (
            <article
              key={workflow.file_path}
              className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <h2 className="font-mono text-lg text-blue-200">{workflow.file_path}</h2>
              <p className="mt-2 text-slate-300">{workflow.summary}</p>
              <div className="mt-5 grid gap-3">
                {workflow.issues.map((issue, index) => (
                  <IssueCard
                    key={`${workflow.file_path}-${issue.title}-${index}`}
                    issue={issue}
                  />
                ))}
              </div>
              <CodeComparison original={workflow.original_code} fixed={workflow.fixed_code} />
              <button
                disabled={loading || !repo.trim() || !token.trim()}
                onClick={async () => {
                  try {
                    const response = await applyWorkflowFix(
                      repo,
                      token,
                      workflow.file_path,
                      workflow.fixed_code
                    );
                    if (response?.status === "success") {
                      setPrResult(response);
                    }
                  } catch (err) {
                    window.alert(
                      err instanceof Error
                        ? err.message
                        : "Unable to create the pull request."
                    );
                  }
                }}
                className="mt-4 rounded-md bg-green-600 px-4 py-2 font-medium hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve &amp; Create Pull Request
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
        active
          ? "border-blue-500 text-blue-300"
          : "border-transparent text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
