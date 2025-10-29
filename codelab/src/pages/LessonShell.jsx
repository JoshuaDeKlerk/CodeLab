import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

export default function LessonShell() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setErr("");
        const lref = doc(db, "lessons", String(lessonId));
        const lsnap = await getDoc(lref);
        if (!lsnap.exists()) { setErr("Lesson not found."); return; }
        setLesson(lsnap.data());

        const mref = collection(db, "lessons", String(lessonId), "modules");
        const qref = query(mref, orderBy("order", "asc"));
        const msnap = await getDocs(qref);
        setModules(msnap.docs.map(d => d.data()));
      } catch (e) {
        setErr(e?.message || "Failed to load lesson.");
      }
    }
    load();
  }, [lessonId]);

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
        {modules.map(mod => (
          <Link
            key={mod.id}
            to={`/app/lesson/${lessonId}/${mod.id}`}
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
          to={`/app/lesson/${lessonId}/${modules[0].id}`}
          className="btn-primary inline-flex"
          style={{ background: lesson.accent || "#4DA3FF" }}
        >
          Start Module
        </Link>
      )}
    </div>
  );
}
