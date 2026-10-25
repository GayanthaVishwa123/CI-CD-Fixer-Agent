import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { Issue } from "@/lib/api";

const styles = {
  high: "border-red-500/40 bg-red-500/10 text-red-200",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
  low: "border-green-500/40 bg-green-500/10 text-green-200"
};

export default function IssueCard({ issue }: { issue: Issue }) {
  const Icon = issue.severity === "high" ? AlertTriangle : issue.severity === "medium" ? Info : CheckCircle2;
  return (
    <article className={`rounded-lg border p-4 ${styles[issue.severity]}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="font-semibold uppercase">{issue.severity}</span>
        {issue.line && <span className="text-xs opacity-70">line {issue.line}</span>}
      </div>
      <h3 className="mt-2 font-semibold">{issue.title}</h3>
      <p className="mt-1 text-sm opacity-90">{issue.explanation}</p>
      <p className="mt-2 text-sm"><strong>Recommendation:</strong> {issue.recommendation}</p>
    </article>
  );
}
