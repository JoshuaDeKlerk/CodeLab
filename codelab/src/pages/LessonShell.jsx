import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function LessonShell() {
  const { lessonId } = useParams(); // e.g., "L2-1"
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [err, setErr] = useState("");

  // Parse world number from "L{world}-{idx}"
  const worldId = useMemo(() => {
    const m = /^L(\d+)-/.exec(String(lessonId || ""));
    const n = m ? Number(m[1]) : 1;
    return `W${Number.isFinite(n) && n > 0 ? n : 1}`;
  }, [lessonId]);

  useEffect(() => {
    async function load() {
      try {
        setErr("");
        setLesson(null);
        setModules([]);

        const uid = getAuth().currentUser?.uid;
        if (!uid) { setErr("Not signed in."); return; }

        // Use derived worldId
        const wref = doc(db, `users/${uid}/journeys/default/worlds/${worldId}`);
        const wsnap = await getDoc(wref);
        if (!wsnap.exists()) { setErr(`World ${worldId} not found.`); return; }

        const lref = doc(db, `users/${uid}/journeys/default/worlds/${worldId}/lessons/${lessonId}`);
        const lsnap = await getDoc(lref);
        if (!lsnap.exists()) { setErr("Lesson not found."); return; }
        setLesson(lsnap.data());

        const mref = collection(db, `users/${uid}/journeys/default/worlds/${worldId}/lessons/${lessonId}/modules`);
        const qref = query(mref, orderBy("order", "asc"));
        const msnap = await getDocs(qref);
        setModules(msnap.docs.map((d) => d.data()));
      } catch (e) {
        setErr(e?.message || "Failed to load lesson.");
      }
    }
    if (lessonId) load();
  }, [lessonId, worldId]);

  if (err) return <div className="p-6 text-red-400">{err}</div>;
  if (!lesson) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">{lesson.title}</h1>
        {lesson.subtitle && <p className="opacity-80">{lesson.subtitle}</p>}
      </header>

      <div className="space-y-3">
        {modules.length === 0 && <div className="opacity-70">No modules yet.</div>}
        {modules.map((mod) => (
          <Link
            key={mod.id}
            to={`/app/lesson/${encodeURIComponent(lessonId)}/module/${encodeURIComponent(mod.id)}`}
            className="block rounded-lg border border-white/10 p-4 hover:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{mod.title}</div>
              <div className="text-xs opacity-70">XP {mod.xp ?? 10}</div>
            </div>
          </Link>
        ))}
      </div>

      {modules[0] && (
        <Link
          to={`/app/lesson/${encodeURIComponent(lessonId)}/module/${encodeURIComponent(modules[0].id)}`}
          className="btn-primary inline-flex"
          style={{ background: lesson.accent || "#4DA3FF" }}
        >
          Start Module
        </Link>
      )}
    </div>
  );
}
