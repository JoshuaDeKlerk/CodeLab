export default function TestsList({ tests = [], running = false }) {
  const total = tests.length;
  const passed = tests.filter(t => t.pass).length;

  return (
    <div className="bg-surface/60 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Tests</h3>
        <span className="text-sm text-subtext">
          {running ? "Running…" : `${passed}/${total} passed`}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-subtext">No tests defined for this exercise.</p>
      ) : (
        <ul className="space-y-2">
          {tests.map((t) => (
            <li key={t.id} className="flex items-start gap-2">
              <span className={t.pass ? "text-success" : "text-warn"}>
                {t.pass ? "✅" : "❌"}
              </span>
              <div className="text-sm">
                <div className={t.pass ? "" : "text-text"}>{t.label}</div>
                {!t.pass && t.message && (
                  <div className="text-subtext text-xs mt-0.5">{t.message}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
