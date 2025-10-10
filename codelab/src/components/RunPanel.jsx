import { useState } from "react";

export default function RunPanel({ onRun }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleRun() {
    setLoading(true);
    const r = await onRun();
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="bg-surface/60 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-accent text-bg font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Running…" : "Run tests"}
        </button>
        {result && (
          <span className={result.pass ? "text-success" : "text-warn"}>
            {result.pass ? "All tests passed" : "Tests failed"}
          </span>
        )}
      </div>
      <pre className="mt-3 text-sm text-subtext whitespace-pre-wrap">
        {result?.output ?? "No output yet."}
      </pre>
    </div>
  );
}
