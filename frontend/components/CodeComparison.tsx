import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CodeComparison({ original, fixed }: { original: string; fixed: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(fixed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Original vs AI Fixed</h2>
        <button onClick={copy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy Fixed Code"}
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodePanel title="Original Code" code={original} />
        <CodePanel title="AI Fixed Code" code={fixed} fixed />
      </div>
    </section>
  );
}

function CodePanel({ title, code, fixed = false }: { title: string; code: string; fixed?: boolean }) {
  return <div><h3 className="mb-2 text-sm font-medium text-slate-400">{title}</h3><pre className={`max-h-[32rem] overflow-auto rounded-lg border p-4 text-xs leading-5 ${fixed ? "border-green-500/30 bg-green-950/20" : "border-slate-800 bg-slate-900"}`}>{code}</pre></div>;
}
