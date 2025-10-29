// src/components/ModuleReader.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getBlob } from "firebase/storage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ModuleReader() {
  const { lessonId, moduleId } = useParams();
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr("");
        setMarkdown("");

        // 1) Load module meta
        const mref = doc(db, "lessons", String(lessonId), "modules", String(moduleId));
        const msnap = await getDoc(mref);
        if (!msnap.exists()) {
          setErr("Module not found.");
          return;
        }
        const data = msnap.data();
        setTitle(data.title || String(moduleId));

        // 2) Download file using Storage SDK (no CORS issues)
        if (!data.mdxPath) {
          setErr("This module has no content yet.");
          return;
        }

        const sref = ref(getStorage(), data.mdxPath);
        const blob = await getBlob(sref);
        const txt = await blob.text();

        if (!cancelled) setMarkdown(txt);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load module.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, moduleId]);

  const components = useMemo(
    () => ({
      code: (props) => <code className="px-1 py-0.5 rounded bg-white/10" {...props} />,
      pre: (props) => <pre className="p-4 bg-[#0f172a] rounded-lg overflow-auto" {...props} />,
      hr: (p) => <hr className="my-6 border-white/10" {...p} />,
      h1: (p) => <h1 className="text-3xl font-extrabold mb-3" {...p} />,
      h2: (p) => <h2 className="text-2xl font-bold mt-8 mb-3" {...p} />,
      h3: (p) => <h3 className="text-xl font-semibold mt-6 mb-2" {...p} />,
      p:  (p) => <p className="leading-7 mb-3" {...p} />,
      ul: (p) => <ul className="list-disc pl-6 space-y-1 mb-3" {...p} />,
      ol: (p) => <ol className="list-decimal pl-6 space-y-1 mb-3" {...p} />,
      table: (p) => <table className="w-full text-left border-separate border-spacing-y-1" {...p} />,
      th: (p) => <th className="border-b border-white/20 pb-1 font-semibold" {...p} />,
      td: (p) => <td className="py-2 align-top" {...p} />,
      a:  (p) => <a className="underline hover:opacity-80" target="_blank" rel="noreferrer" {...p} />,
    }),
    []
  );

  if (err) return <div className="p-6 text-red-400">{err}</div>;
  if (!markdown) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 prose prose-invert max-w-3xl">
      <h1>{title}</h1>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
