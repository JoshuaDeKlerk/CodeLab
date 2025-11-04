import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getBlob, ref } from "firebase/storage";
import { generateModuleContent } from "../lib/journeyApi";

// Ui Helpers
function Chip({ tone = "default", children }) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    warn: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    ok: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Spinner
function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Copy to clipboard button for code blocks
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(text || "");
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10"
      title="Copy code"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Module reader component
export default function ModuleReader() {
  const { lessonId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [accent, setAccent] = useState("#4DA3FF");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [hint, setHint] = useState("");

  // Get World id for lesson Id
  const worldId = useMemo(() => {
    const m = /^L(\d+)-/.exec(String(lessonId || ""));
    const n = m ? Number(m[1]) : 1;
    return `W${Number.isFinite(n) && n > 0 ? n : 1}`;
  }, [lessonId]);

  // Fetch the Firestore module doc
  const fetchModuleDoc = useCallback(
    async (uid) => {
      const mref = doc(
        db,
        `users/${uid}/journeys/default/worlds/${worldId}/lessons/${lessonId}/modules/${moduleId}`
      );
      const snap = await getDoc(mref);
      if (!snap.exists()) throw new Error("Module not found.");
      return { id: snap.id, ...snap.data() };
    },
    [lessonId, moduleId, worldId]
  );

  // Lesson accent color
  const fetchLessonAccent = useCallback(
    async (uid) => {
      const lref = doc(db, `users/${uid}/journeys/default/worlds/${worldId}/lessons/${lessonId}`);
      const lsnap = await getDoc(lref);
      if (lsnap.exists()) {
        const data = lsnap.data();
        if (data?.accent) setAccent(data.accent);
      }
    },
    [lessonId, worldId]
  );

  // Load the generated JSON from Storage and set UI state
  const fetchBlocksFromPath = useCallback(
    async (jsonPath) => {
      const path = jsonPath.replace(/^gs:\/\/[^/]+\//, "");
      const sref = ref(storage, path);
      const blob = await getBlob(sref);
      const json = JSON.parse(await blob.text());
      setBlocks(json.blocks || []);
      setTitle(json.title || moduleId);
    },
    [moduleId]
  );

  // Wait for generation to complete
  const waitForJsonPath = useCallback(
    async (uid, { timeoutMs = 180000, intervalMs = 1000 } = {}) => {
      const started = Date.now();
      let ticks = 0;
      while (Date.now() - started < timeoutMs) {
        ticks++;
        const data = await fetchModuleDoc(uid);
        if (data.jsonPath) return data.jsonPath;
        if (data.contentStatus === "error") {
          throw new Error(data.lastError || "Generation failed (server).");
        }
        setHint(`This can take ~30–90s depending on topic… ${ticks}s`);
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      throw new Error("Timed out waiting for content. Please try again.");
    },
    [fetchModuleDoc]
  );

  const hardReload = () => window.location.reload();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr("");
        setBlocks([]);
        setTitle("");
        setHint("");
        setStatus("loading");

        const uid = getAuth().currentUser?.uid;
        if (!uid) throw new Error("Not signed in.");

        // Accent strip
        fetchLessonAccent(uid).catch(() => {});

        // Check if already generated
        const data = await fetchModuleDoc(uid);
        setTitle(data.title || moduleId);

        if (data.jsonPath) {
          await fetchBlocksFromPath(data.jsonPath);
          if (!cancelled) setStatus("ready");
          return;
        }

        // Kick off generation
        setStatus("generating");
        const gen = await generateModuleContent(lessonId, moduleId, worldId);

        if (gen?.status === "generating") {
          setStatus("waiting");
          const path = await waitForJsonPath(uid, { timeoutMs: 180000, intervalMs: 1000 });
          await fetchBlocksFromPath(path);
          if (!cancelled) setStatus("ready");
          return;
        }

        if (gen?.status === "ready" && gen?.jsonPath) {
          await fetchBlocksFromPath(gen.jsonPath);
          if (!cancelled) setStatus("ready");
          return;
        }

        throw new Error("Unexpected response from generator.");
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load module.");
          setStatus("error");
        }
      }
    }

    if (lessonId && moduleId) load();
    return () => { cancelled = true; };
  }, [lessonId, moduleId, worldId, fetchModuleDoc, fetchBlocksFromPath, waitForJsonPath, fetchLessonAccent]);

  // Header status chip
  const StatusChip = () => {
    if (status === "loading") return <Chip tone="info"><Spinner className="h-3.5 w-3.5" /> Loading</Chip>;
    if (status === "generating") return <Chip tone="warn"><Spinner className="h-3.5 w-3.5" /> Starting generator</Chip>;
    if (status === "waiting") return <Chip tone="warn"><Spinner className="h-3.5 w-3.5" /> Generating…</Chip>;
    if (status === "ready") return <Chip tone="ok">Ready</Chip>;
    if (status === "error") return <Chip tone="danger">Error</Chip>;
    return <Chip>Idle</Chip>;
  };

  return (
    <div className="p-0">
      <div className="sticky top-0 z-30 backdrop-blur bg-bg/70 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-5 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/lesson/${encodeURIComponent(lessonId)}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs transition"
                  title="Back to lesson"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </Link>

                <nav className="text-xs text-subtext flex items-center gap-2">
                  <Link to="/app/map" className="hover:text-white">Worlds</Link>
                  <span className="opacity-60">/</span>
                  <Link
                    to={`/app/lesson/${encodeURIComponent(lessonId)}`}
                    className="hover:text-white truncate"
                  >
                    {lessonId}
                  </Link>
                  <span className="opacity-60">/</span>
                  <span className="truncate">{moduleId}</span>
                </nav>
              </div>

              <div
                className="h-1 rounded-full mt-2"
                style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
              />
              <h1 className="mt-2 text-xl md:text-2xl font-bold tracking-tight truncate">
                {title || "Module"}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <StatusChip />
              <button
                onClick={hardReload}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                title="Reload"
              >
                Reload
              </button>
            </div>
          </div>

          {(status === "waiting" || status === "generating") && (
            <p className="mt-2 text-xs text-subtext">{hint}</p>
          )}
          {err && (
            <p className="mt-2 text-xs text-rose-300">Error {err}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="prose prose-invert max-w-3xl mx-auto px-5 md:px-6 py-6 space-y-6">
        {status !== "ready" && !err && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            {status === "loading" && <div className="flex items-center gap-2"><Spinner /> <span>Loading module…</span></div>}
            {status === "generating" && <div className="flex items-center gap-2"><Spinner /> <span>Starting generator…</span></div>}
            {status === "waiting" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Spinner /> <span>Content is generating…</span></div>
                <div className="text-sm text-subtext">{hint}</div>
              </div>
            )}
          </div>
        )}

        {status === "ready" && (
          <>
            {blocks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-subtext">
                No content yet.
              </div>
            ) : (
              <div className="space-y-5 md:space-y-6">
                {blocks.map((b, i) => <Block key={i} block={b} />)}
              </div>
            )}
          </>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-rose-100">
              {err}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5"
                onClick={hardReload}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Block renderer ---------- */
function Block({ block }) {
  if (!block) return null;
  const { type, text, items, language, url, alt, tone = "info" } = block;

  switch (type) {
    case "h1": return <h1 className="!mt-8">{text}</h1>;
    case "h2": return <h2 className="!mt-6">{text}</h2>;
    case "h3": return <h3 className="!mt-4">{text}</h3>;
    case "p":  return <p>{text}</p>;

    case "ul":
      return (
        <ul className="list-disc pl-6">
          {(items || []).map((it, j) => <li key={j}>{it}</li>)}
        </ul>
      );

    case "ol":
      return (
        <ol className="list-decimal pl-6">
          {(items || []).map((it, j) => <li key={j}>{it}</li>)}
        </ol>
      );

    case "quote":
      return (
        <blockquote className="border-l-4 border-white/15 pl-4 italic text-subtext">
          {text}
        </blockquote>
      );

    case "callout": {
      const toneMap = {
        info: "ring-sky-400/20 bg-sky-400/10 text-sky-100",
        warn: "ring-amber-400/20 bg-amber-400/10 text-amber-100",
        tip:  "ring-emerald-400/20 bg-emerald-400/10 text-emerald-100",
        danger: "ring-rose-400/20 bg-rose-400/10 text-rose-100",
      };
      return (
        <div className={`rounded-xl ring-1 p-4 ${toneMap[tone] || "ring-white/10 bg-white/5"}`}>
          <p className="m-0">{text}</p>
        </div>
      );
    }

    case "img":
      return (
        <figure className="not-prose">
          <img src={url} alt={alt || ""} className="rounded-xl border border-white/10" />
          {alt && <figcaption className="mt-2 text-xs text-subtext">{alt}</figcaption>}
        </figure>
      );

    case "code":
      return <CodeBlock code={text} language={language} />;

    default:
      return null;
  }
}

/* ---------- Code block with copy ---------- */
function CodeBlock({ code = "", language = "" }) {
  return (
    <div className="not-prose relative rounded-xl border border-white/10 bg-[#0b1220]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs text-subtext uppercase tracking-wide">
          {language || "code"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-auto p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}