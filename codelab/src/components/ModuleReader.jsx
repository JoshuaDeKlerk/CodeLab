import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getBlob, ref } from "firebase/storage";

export default function ModuleReader() {
  const { lessonId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setErr("");
        setBlocks([]);
        const uid = getAuth().currentUser?.uid;
        if (!uid) { setErr("Not signed in."); return; }

        const mref = doc(db, `users/${uid}/journeys/default/worlds/W1/lessons/${lessonId}/modules/${moduleId}`);
        const msnap = await getDoc(mref);
        if (!msnap.exists()) { setErr("Module not found."); return; }
        const data = msnap.data();
        setTitle(data.title || moduleId);

        if (!data.jsonPath) { setErr("No content for this module."); return; }
        // convert gs:// to storage ref (strip bucket)
        const path = data.jsonPath.replace(/^gs:\/\/[^/]+\//, "");
        const sref = ref(storage, path);
        const blob = await getBlob(sref);
        const json = JSON.parse(await blob.text());

        if (!cancelled) setBlocks(json.blocks || []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load module.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lessonId, moduleId]);

  if (err) return <div className="p-6 text-red-400">{err}</div>;
  if (!blocks.length) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 prose prose-invert max-w-3xl">
      <h1>{title}</h1>
      {blocks.map((b, i) => {
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
      })}
    </div>
  );
}
