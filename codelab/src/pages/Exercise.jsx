import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { exercises } from "../data/exercises";
import CodePane from "../components/CodePane";
import RunPanel from "../components/RunPanel";
import TestsList from "../components/TestsList";
import Toast from "../components/Toast";
import * as monacoNs from "monaco-editor";

export default function Exercise() {
  const { id } = useParams();
  const ex = useMemo(() => exercises.find((e) => e.id === id), [id]);

  // per-exercise persistence
  const storageKey = `code:${id}`;
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ?? (ex?.starter ?? "");
  });
  useEffect(() => {
    localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  // tests + UI state
  const [tests, setTests] = useState([]);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info'|'warn', msg: string }

  if (!ex) return <div>Exercise not found.</div>;

  // ---------- Monaco markers helpers ----------
  function clearMarkers() {
    const models = monacoNs.editor.getModels?.() || [];
    models.forEach((m) => monacoNs.editor.setModelMarkers(m, "codelab", []));
  }
  function setSimpleMarker(message) {
    const model = (monacoNs.editor.getModels?.() || [])[0];
    if (!model) return;
    monacoNs.editor.setModelMarkers(model, "codelab", [
      {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        message,
        severity: monacoNs.MarkerSeverity.Error,
      },
    ]);
  }

  // ---------- Fake tests per exercise ----------
  function evaluateJsHello(src) {
    return [
      {
        id: "def",
        label: "Defines a function hello()",
        pass: /function\s+hello\s*\(|export\s+function\s+hello\s*\(/.test(src),
        message: "Create hello() using function hello() or export function hello().",
      },
      {
        id: "return",
        label: "Returns 'Hello, World!'",
        pass: /Hello,\s*World!?/.test(src),
        message: "Return the exact string 'Hello, World!'",
      },
    ];
  }

  function evaluatePySum(src) {
    return [
      {
        id: "def",
        label: "Defines add(a, b)",
        pass: /def\s+add\s*\(\s*a\s*,\s*b\s*\)\s*:/.test(src),
        message: "Define def add(a, b):",
      },
      {
        id: "body",
        label: "Implements body (no 'pass')",
        pass: !/^\s*def\s+add[\s\S]*\bpass\b/m.test(src),
        message: "Replace 'pass' with code that returns a + b.",
      },
    ];
  }

  async function runFake() {
    setRunning(true);
    clearMarkers();

    let t = [];
    if (ex.id === "js-hello") t = evaluateJsHello(code);
    else if (ex.id === "py-sum") t = evaluatePySum(code);

    const firstFail = t.find((x) => !x.pass);
    if (firstFail) setSimpleMarker(firstFail.message);

    setTests(t);
    setRunning(false);

    const allPass = t.length > 0 && t.every((x) => x.pass);
    setToast({
      type: allPass ? "success" : "warn",
      msg: allPass ? "All tests passed!" : "Some tests are failing.",
    });

    return {
      pass: allPass,
      output: allPass
        ? "✓ All tests passed (simulated)"
        : `✗ ${t.filter((x) => !x.pass).length} test(s) failing. See list below.`,
    };
  }

  function handleReset() {
    setCode(ex.starter ?? "");
    setTests([]);
    clearMarkers();
    // overwrite saved code in localStorage as well
    localStorage.setItem(storageKey, ex.starter ?? "");
    setToast({ type: "info", msg: "Reset to starter code." });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ex.title}</h1>
          <p className="text-subtext">{ex.prompt}</p>
          <p className="text-xs text-subtext/70 mt-1">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">Ctrl/Cmd + Enter</kbd> to run tests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm"
            title="Reset to starter code"
          >
            Reset
          </button>
          <button
            onClick={() => runFake()}
            className="px-3 py-2 rounded-xl bg-accent text-bg font-semibold hover:opacity-90 text-sm"
            title="Run tests"
          >
            Run
          </button>
        </div>
      </header>

      <CodePane language={ex.language} value={code} onChange={setCode} onRun={runFake} />

      <TestsList tests={tests} running={running} />
      <RunPanel onRun={runFake} />

      <Toast
        open={!!toast}
        type={toast?.type}
        onClose={() => setToast(null)}
      >
        {toast?.msg}
      </Toast>
    </div>
  );
}
