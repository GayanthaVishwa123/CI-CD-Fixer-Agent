import { useState } from "react";
import { analyzeRaw, analyzeRepo, createGithubPr, type Analysis, type Provider, type RepoAnalysis } from "@/lib/api";

export function useAnalysis() {
  const [result, setResult] = useState<Analysis | null>(null);
  const [repoResult, setRepoResult] = useState<RepoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runRaw(code: string, provider: Provider) {
    setLoading(true); setError(""); setRepoResult(null);
    try { setResult(await analyzeRaw(code, provider)); } catch (err) { setError(err instanceof Error ? err.message : "Analysis failed"); } finally { setLoading(false); }
  }

  async function runRepo(repoUrl: string, token?: string) {
    setLoading(true); setError(""); setResult(null); setRepoResult(null);
    try {
      const analysis = await analyzeRepo(repoUrl, token);
      setRepoResult(analysis);
    } catch (err) { setError(err instanceof Error ? err.message : "Analysis failed"); } finally { setLoading(false); }
  }

  async function applyWorkflowFix(
    repoName: string,
    token: string,
    filePath: string,
    fixedCode: string
  ) {
    setLoading(true); setError("");
    try {
      return await createGithubPr(
        repoName,
        token,
        filePath,
        fixedCode
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remediation failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setRepoResult(null);
    setError("");
  }

  return { result, repoResult, loading, error, runRaw, runRepo, applyWorkflowFix, reset };
}
