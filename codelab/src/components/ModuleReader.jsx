import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getBlob, ref } from "firebase/storage";
import { generateModuleContent, getModuleDebug, storageProbe } from "../lib/journeyApi";

// ModuleReader component
export default function ModuleReader() {
  const { lessonId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("idle"); // idle|loading|generating|waiting|ready|error
  const [hint, setHint] = useState("");

  // debug state
  const [showDbg, setShowDbg] = useState(false);
  const [dbgDoc, setDbgDoc] = useState(null);
  const [dbgProbe, setDbgProbe] = useState(null);
  const [dbgErr, setDbgErr] = useState("");

  // Fetch the module document
  async function fetchModuleDoc(uid) {
    const mref = doc(db, `users/${uid}/journeys/default/worlds/W1/lessons/${lessonId}/modules/${moduleId}`);
    const snap = await getDoc(mref);
    if (!snap.exists()) throw new Error("Module not found.");
    return { id: snap.id, ...snap.data() };
  }

  // Fetch blocks from a given JSON path in storage
  async function fetchBlocksFromPath(jsonPath) {
    const path = jsonPath.replace(/^gs:\/\/[^/]+\//, "");
    const sref = ref(storage, path);
    const blob = await getBlob(sref);
    const json = JSON.parse(await blob.text());
    setBlocks(json.blocks || []);
    setTitle(json.title || moduleId);
  }

  // Wait for the module to be generated and get its JSON path
  async function waitForJsonPath(uid, { timeoutMs = 180000, intervalMs = 1000 } = {}) {
    const started = Date.now();
    let tries = 0;
    while (Date.now() - started < timeoutMs) {
      tries++;
      const data = await fetchModuleDoc(uid);
      if (data.jsonPath) return data.jsonPath;
      if (data.contentStatus === "error") {
        throw new Error(data.lastError || "Generation failed (server).");
      }
      // refresh hint + debug snapshot every 5s
      setHint(`Generating… (${tries}s)`);
      if (tries % 5 === 0) {
        try {
          const [docDbg, probeDbg] = await Promise.all([
            getModuleDebug(lessonId, moduleId, "W1").catch(() => null),
            storageProbe().catch(() => null),
          ]);
          if (docDbg) setDbgDoc(docDbg);
          if (probeDbg) setDbgProbe(probeDbg);
        } catch { /* best-effort debug */ }
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Timed out waiting for content. Please try again.");
  }

  // Refresh debug information
  async function refreshDebugNow() {
    try {
      setDbgErr("");
      const [docDbg, probeDbg] = await Promise.all([
        getModuleDebug(lessonId, moduleId, "W1"),
        storageProbe()
      ]);
      setDbgDoc(docDbg);
      setDbgProbe(probeDbg);
    } catch (e) {
      setDbgErr(e?.message || "Debug fetch failed.");
    }
  }
  
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr("");
        setBlocks([]);
        setTitle("");
        setHint("");
        setStatus("loading");
        setDbgDoc(null);
        setDbgProbe(null);
        setDbgErr("");

        const uid = getAuth().currentUser?.uid;
        if (!uid) throw new Error("Not signed in.");

        const data = await fetchModuleDoc(uid);
        setTitle(data.title || moduleId);

        // already generated?
        if (data.jsonPath) {
          await fetchBlocksFromPath(data.jsonPath);
          if (!cancelled) setStatus("ready");
          return;
        }

        // trigger generation
        setStatus("generating");
        const gen = await generateModuleContent(lessonId, moduleId, "W1");

        // if the function is actively generating elsewhere, poll until ready
        if (gen?.status === "generating") {
          setStatus("waiting");
          // kick off a first debug sample
          try {
            const [docDbg, probeDbg] = await Promise.all([
              getModuleDebug(lessonId, moduleId, "W1").catch(() => null),
              storageProbe().catch(() => null),
            ]);
            if (docDbg) setDbgDoc(docDbg);
            if (probeDbg) setDbgProbe(probeDbg);
          } catch {}
          const path = await waitForJsonPath(uid, { timeoutMs: 180000, intervalMs: 1000 });
          await fetchBlocksFromPath(path);
          if (!cancelled) setStatus("ready");
          return;
        }

        // normal path: function returns ready + jsonPath
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

    load();
    return () => { cancelled = true; };
  }, [lessonId, moduleId]);

  // UI
  if (err) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-red-400">{err}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-md border border-white/10"
            onClick={() => {
              setErr(""); setStatus("idle"); setBlocks([]); setTitle("");
              const ev = new Event("popstate"); window.dispatchEvent(ev);
            }}
          >
            Retry
          </button>
          <button
            className="px-3 py-2 rounded-md border border-white/10"
            onClick={async () => {
              setShowDbg(true);
              await refreshDebugNow();
            }}
          >
            Show Debug
          </button>
        </div>

        {showDbg && (
          <DebugPanel
            dbgDoc={dbgDoc}
            dbgProbe={dbgProbe}
            dbgErr={dbgErr}
            onRefresh={refreshDebugNow}
          />
        )}
      </div>
    );
  }

  // normal rendering
  return (
    <div className="p-6 prose prose-invert max-w-3xl space-y-4">
      {status === "loading" && <div>Loading module…</div>}
      {status === "generating" && <div>Starting generator…</div>}
      {status === "waiting" && (
        <div className="space-y-3">
          <div>Content is generating. {hint}</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-md border border-white/10"
              onClick={async () => {
                setShowDbg(true);
                await refreshDebugNow();
              }}
            >
              Show Debug
            </button>
          </div>
          {showDbg && (
            <DebugPanel
              dbgDoc={dbgDoc}
              dbgProbe={dbgProbe}
              dbgErr={dbgErr}
              onRefresh={refreshDebugNow}
            />
          )}
        </div>
      )}

      {status === "ready" && (
        <>
          <h1>{title}</h1>
          {blocks.length === 0 ? (
            <div>No content yet.</div>
          ) : (
            blocks.map((b, i) => {
              switch (b.type) {
                case "h1": return <h1 key={i}>{b.text}</h1>;
                case "h2": return <h2 key={i}>{b.text}</h2>;
                case "h3": return <h3 key={i}>{b.text}</h3>;
                case "p":  return <p key={i}>{b.text}</p>;
                case "ul": return <ul key={i} className="list-disc pl-6">{(b.items||[]).map((it, j)=><li key={j}>{it}</li>)}</ul>;
                case "ol": return <ol key={i} className="list-decimal pl-6">{(b.items||[]).map((it, j)=><li key={j}>{it}</li>)}</ol>;
                case "code": return (
                  <pre key={i} className="p-4 bg-[#0f172a] rounded-lg overflow-auto">
                    <code>{b.text}</code>
                  </pre>
                );
                default: return null;
              }
            })
          )}
        </>
      )}

      {(status === "idle" || status === "generating") && null}
    </div>
  );
}

// DebugPanel component
function DebugPanel({ dbgDoc, dbgProbe, dbgErr, onRefresh }) {
  return (
    <div className="rounded-lg border border-white/10 p-4 space-y-3 bg-white/5">
      <div className="font-semibold">Debug</div>
      {dbgErr && <div className="text-red-400 text-sm">{dbgErr}</div>}

      <div className="text-sm grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="opacity-70">Module Doc</div>
          <pre className="text-xs whitespace-pre-wrap bg-black/30 p-2 rounded">
{JSON.stringify(dbgDoc || { note: "No data yet. Click Refresh." }, null, 2)}
          </pre>
        </div>
        <div className="space-y-1">
          <div className="opacity-70">Storage Probe</div>
          <pre className="text-xs whitespace-pre-wrap bg-black/30 p-2 rounded">
{JSON.stringify(dbgProbe || { note: "No data yet. Click Refresh." }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded-md border border-white/10"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
