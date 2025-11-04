import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="h-6 w-14 rounded bg-white/10" />
      </div>
      <div className="mt-3 h-3 w-56 rounded bg-white/5" />
    </div>
  );
}

// Lesson shell component
export default function LessonShell() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Determine world ID from lesson ID
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
        setLoading(true);

        const uid = getAuth().currentUser?.uid;
        if (!uid) { setErr("Not signed in."); return; }

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
        setModules(msnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setErr(e?.message || "Failed to load lesson.");
      } finally {
        setLoading(false);
      }
    }
    if (lessonId) load();
  }, [lessonId, worldId]);

  if (err) return <div className="p-6 text-red-400">{err}</div>;

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
          <div className="h-8 w-72 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-96 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  // Loaded state
  if (!lesson) return <div className="p-6">Loading…</div>;

  const accent = lesson.accent || "#4DA3FF";
  const firstModuleId = modules[0]?.id;

  return (
    <div className="p-6 md:p-8 space-y-8 md:space-y-10">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link
            to="/app/map"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs transition"
            title="Back to worlds"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>

          <nav className="text-xs text-subtext flex items-center gap-2">
            <Link to="/app/map" className="hover:text-white">Worlds</Link>
            <span className="opacity-60">/</span>
            <span className="truncate">{lesson.title || lessonId}</span>
          </nav>
        </div>

        <header className="rounded-2xl border border-white/10 bg-white/[0.03] ring-1 ring-white/5 p-5 md:p-6">
          <div
            className="h-1 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{lesson.title}</h1>
          {lesson.subtitle && (
            <p className="mt-2 text-subtext text-sm md:text-[15px]">{lesson.subtitle}</p>
          )}
        </header>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Modules</h2>
          {firstModuleId && (
            <Link
              to={`/app/lesson/${encodeURIComponent(lessonId)}/module/${encodeURIComponent(firstModuleId)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg font-semibold shadow-sm shadow-accent/30 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition"
              style={{ background: accent }}
            >
              Start
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-bg" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </div>

        {modules.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-subtext">
            No modules yet. Check back soon.
          </div>
        )}

        <div className="grid gap-4 md:gap-5">
          {modules.map((mod) => {
            const locked = (mod.lockedUntilLevel ?? 0) > 0;
            const minutes = mod.estimatedMinutes ?? mod.minutes;
            const CardInner = (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold leading-tight line-clamp-2">{mod.title}</div>
                  <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                    <span className="opacity-80">XP</span>
                    <span className="font-semibold">{mod.xp ?? 10}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-subtext">
                  {minutes && (
                    <span className="inline-flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      ~{minutes} min
                    </span>
                  )}
                  {locked && (
                    <span className="inline-flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10V8a5 5 0 1 1 10 0v2M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );

            if (locked) {
              return (
                <div
                  key={mod.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 opacity-70 cursor-not-allowed"
                >
                  {CardInner}
                </div>
              );
            }

            return (
              <Link
                key={mod.id}
                to={`/app/lesson/${encodeURIComponent(lessonId)}/module/${encodeURIComponent(mod.id)}`}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 hover:bg-white/[0.06] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {CardInner}
                <div className="mt-2 flex items-center gap-1 text-xs text-subtext opacity-0 group-hover:opacity-100 transition">
                  Open module
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}