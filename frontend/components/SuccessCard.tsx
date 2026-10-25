import { CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";

type SuccessCardProps = {
  prUrl: string;
  prNumber: number;
  branch: string;
  onReset: () => void;
};

export default function SuccessCard({
  prUrl,
  prNumber,
  branch,
  onReset,
}: SuccessCardProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-green-950 p-8 shadow-2xl shadow-emerald-950/50">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative">
        <CheckCircle2
          aria-hidden="true"
          className="mb-4 animate-bounce text-emerald-300"
          size={48}
        />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Remediation successful
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">
          Pull request created
        </h2>
        <p className="mt-3 text-emerald-100/80">
          Your workflow security fix is ready for review on branch{" "}
          <code className="rounded bg-black/30 px-2 py-1 text-emerald-200">
            {branch}
          </code>
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-300"
          >
            <ExternalLink size={17} />
            View Pull Request #{prNumber} on GitHub
          </a>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-300/40 px-4 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
          >
            <RotateCcw size={17} />
            Audit Another Repo
          </button>
        </div>
      </div>
    </section>
  );
}
