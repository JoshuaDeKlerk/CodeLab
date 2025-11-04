import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getBlob, ref } from "firebase/storage";
import { generateModuleContent } from "../lib/journeyApi";

export default function ModuleReader() {
  const { lessonId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("idle"); // idle|loading|generating|waiting|ready|error
  const [hint, setHint] = useState("");

  // Derive worldId from lessonId (e.g. L2-1 -> W2)
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

  // Poll until the module doc has jsonPath, or error/timeout
  const waitForJsonPath = useCallback(
    async (uid, { timeoutMs = 180000, intervalMs = 1000 } = {}) => {
      const started = Date.now();
      let tries = 0;
      while (Date.now() - started < timeoutMs) {
        tries++;
        const data = await fetchModuleDoc(uid);
        if (data.jsonPath) return data.jsonPath;
        if (data.contentStatus === "error") {
          throw new Error(data.lastError || "Generation failed (server).");
        }
        setHint(`Generating… (${tries}s)`);
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      throw new Error("Timed out waiting for content. Please try again.");
    },
    [fetchModuleDoc]
  );

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

        // Check if already generated
        const data = await fetchModuleDoc(uid);
        setTitle(data.title || moduleId);

        if (data.jsonPath) {
          await fetchBlocksFromPath(data.jsonPath);
          if (!cancelled) setStatus("ready");
          return;
        }

        // Kick off generation (use derived worldId)
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
  }, [lessonId, moduleId, worldId, fetchModuleDoc, fetchBlocksFromPath, waitForJsonPath]);

  if (err) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-red-400">{err}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-md border border-white/10"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 prose prose-invert max-w-3xl space-y-4">
      {status === "loading" && <div>Loading module…</div>}
      {status === "generating" && <div>Starting generator…</div>}
      {status === "waiting" && <div>Content is generating. {hint}</div>}

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
                case "ul":
                  return (
                    <ul key={i} className="list-disc pl-6">
                      {(b.items || []).map((it, j) => <li key={j}>{it}</li>)}
                    </ul>
                  );
                case "ol":
                  return (
                    <ol key={i} className="list-decimal pl-6">
                      {(b.items || []).map((it, j) => <li key={j}>{it}</li>)}
                    </ol>
                  );
                case "code":
                  return (
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
    </div>
  );
}