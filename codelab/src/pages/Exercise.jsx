import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { exercises } from "../data/exercises";
import CodePane from "../components/CodePane";
import RunPanel from "../components/RunPanel";

export default function Exercise() {
  const { id } = useParams();
  const ex = useMemo(() => exercises.find(e => e.id === id), [id]);

  const storageKey = `code:${id}`;
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ?? (ex?.starter ?? "");
  });
  useEffect(() => { localStorage.setItem(storageKey, code); }, [code, storageKey]);

  if (!ex) return <div>Exercise not found.</div>;

  async function runFake() {
    if (ex.id === "js-hello") {
      const hasFn = /function\s+hello\s*\(/.test(code) || /export\s+function\s+hello\s*\(/.test(code);
      const returns = /Hello,\s*World!?/.test(code);
      const ok = hasFn && returns;
      return {
        pass: ok,
        output: ok
          ? "✓ hello() returned 'Hello, World!' (simulated)"
          : "✗ Expect a function hello() that returns 'Hello, World!'",
      };
    }
    if (ex.id === "py-sum") {
      const hasFn = /def\s+add\s*\(\s*a\s*,\s*b\s*\)\s*:/.test(code);
      const notPass = !/pass/.test(code);
      const ok = hasFn && notPass;
      return {
        pass: ok,
        output: ok
          ? "✓ add(2, 3) == 5 (simulated)"
          : "✗ Expect a function def add(a,b): that returns a+b (and remove 'pass').",
      };
    }
    return { pass: false, output: "No tests implemented for this exercise." };
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ex.title}</h1>
          <p className="text-subtext">{ex.prompt}</p>
        </div>
      </header>

      <CodePane language={ex.language} value={code} onChange={setCode} />
      <RunPanel onRun={runFake} />
    </div>
  );
}
