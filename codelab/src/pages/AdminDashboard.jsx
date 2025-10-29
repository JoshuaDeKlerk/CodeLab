import React, { useState } from "react";
import {
  createWorld,
  createLesson,
  createModule,
  updateModuleMdxPath,
} from "../lib/adminApi";
import { storage } from "../lib/firebase";
import { ref, uploadBytesResumable } from "firebase/storage";
import "../stylesheets/WorldMap.css";

export default function AdminDashboard() {
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState("info");

  function toast(text, k = "info") {
    setMsg(text);
    setKind(k);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        {msg && (
          <div
            className={`text-sm rounded p-2 border ${
              kind === "ok"
                ? "bg-green-500/15 border-green-400/30"
                : kind === "err"
                ? "bg-red-500/15 border-red-400/30"
                : "bg-black/30 border-white/10"
            }`}
          >
            {msg}
          </div>
        )}
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <AddWorld
          onDone={(w) => toast(`✅ World ${w.id} created`, "ok")}
          onError={(e) => toast(e, "err")}
        />
        <AddLesson
          defaultWorldId="W1"
          onDone={(l) => toast(`✅ Lesson ${l.id} created in ${l.worldId}`, "ok")}
          onError={(e) => toast(e, "err")}
        />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <AddModule
          onDone={(m) =>
            toast(
              `✅ Module ${m.id} created in ${m.lessonId}${
                m.mdxPath ? " (MDX attached)" : ""
              }`,
              "ok"
            )
          }
          onError={(e) => toast(e, "err")}
        />
      </section>
    </div>
  );
}

function AddWorld({ onDone, onError }) {
  const [title, setTitle] = useState("FOUNDATION WORLD");
  const [blurb, setBlurb] = useState("Understand how code builds the web from scratch.");
  const [icons, setIcons] = useState("css,html,js");
  const [accent, setAccent] = useState("#4DA3FF");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const w = await createWorld({
        title,
        blurb,
        icons: icons.split(",").map((s) => s.trim()).filter(Boolean),
        accent,
      });
      onDone && onDone(w);
    } catch (err) {
      onError && onError(`❌ ${err?.message ?? "Failed to create world"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface/70 rounded-xl border border-white/10 p-4 space-y-3">
      <div className="text-lg font-semibold">Add World</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="col-span-2 bg-white/10 rounded p-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="World title" />
        <input className="col-span-2 bg-white/10 rounded p-2" value={blurb} onChange={(e)=>setBlurb(e.target.value)} placeholder="Blurb" />
        <input className="bg-white/10 rounded p-2" value={icons} onChange={(e)=>setIcons(e.target.value)} placeholder="Icons (csv: css,html,js)" />
        <input className="bg-white/10 rounded p-2" value={accent} onChange={(e)=>setAccent(e.target.value)} placeholder="Accent color (#hex or gradient)" />
      </div>
      <button className="rounded-md bg-cyan-400 text-black font-semibold px-3 py-2" disabled={busy}>
        {busy ? "Creating…" : "Create World"}
      </button>
    </form>
  );
}

function AddLesson({ defaultWorldId = "W1", onDone, onError }) {
  const [worldId, setWorldId] = useState(defaultWorldId);
  const [title, setTitle] = useState("New Lesson");
  const [subtitle, setSubtitle] = useState("Subtitle");
  const [text, setText] = useState("Short blurb under subtitle.");
  const [badge, setBadge] = useState("html");
  const [accent, setAccent] = useState("#4DA3FF");
  const [xp, setXp] = useState(100);
  const [steps, setSteps] = useState(8);
  const [lock, setLock] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const lesson = await createLesson({
        worldId,
        title,
        subtitle,
        text,
        badge,
        accent,
        xpTotal: Number(xp),
        stepsTotal: Number(steps),
        lockedUntilLevel: Number(lock),
      });
      onDone && onDone(lesson);
      setTitle("New Lesson");
      setSubtitle("Subtitle");
    } catch (err) {
      onError && onError(`❌ ${err?.message ?? "Failed to create lesson"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface/70 rounded-xl border border-white/10 p-4 space-y-3">
      <div className="text-lg font-semibold">Add Lesson</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="bg-white/10 rounded p-2" value={worldId} onChange={(e)=>setWorldId(e.target.value)} placeholder="World Id (e.g., W1)" />
        <input className="bg-white/10 rounded p-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" />
        <input className="bg-white/10 rounded p-2" value={subtitle} onChange={(e)=>setSubtitle(e.target.value)} placeholder="Subtitle" />
        <textarea className="col-span-2 bg-white/10 rounded p-2" rows={2} value={text} onChange={(e)=>setText(e.target.value)} placeholder="Short blurb under subtitle" />
        <input className="bg-white/10 rounded p-2" value={badge} onChange={(e)=>setBadge(e.target.value)} placeholder="Badge (html/css/js/all)" />
        <input className="bg-white/10 rounded p-2" value={accent} onChange={(e)=>setAccent(e.target.value)} placeholder="#hex or gradient" />
        <input className="bg-white/10 rounded p-2" type="number" value={xp} onChange={(e)=>setXp(Number(e.target.value))} placeholder="XP total" />
        <input className="bg-white/10 rounded p-2" type="number" value={steps} onChange={(e)=>setSteps(Number(e.target.value))} placeholder="Steps total" />
        <input className="bg-white/10 rounded p-2" type="number" value={lock} onChange={(e)=>setLock(Number(e.target.value))} placeholder="Locked until level" />
      </div>
      <button className="rounded-md bg-cyan-400 text-black font-semibold px-3 py-2" disabled={busy}>
        {busy ? "Saving…" : "Create Lesson"}
      </button>
    </form>
  );
}

function AddModule({ onDone, onError }) {
  const [lessonId, setLessonId] = useState("L1-1");
  const [title, setTitle] = useState("Introduction");
  const [order, setOrder] = useState("");
  const [xp, setXp] = useState(10);
  const [mdxFile, setMdxFile] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setUploadPct(0);

      const mod = await createModule({
        lessonId,
        title,
        order: order === "" ? undefined : Number(order),
        xp: Number(xp),
      });

      let mdxPath = null;

      if (mdxFile) {
        mdxPath = `lessons/${mod.worldId}/${mod.lessonId}/modules/${mod.id}.mdx`;
        const sref = ref(storage, mdxPath);
        const task = uploadBytesResumable(sref, mdxFile, { contentType: "text/markdown" });

        await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setUploadPct(pct);
            },
            (err) => reject(err),
            () => resolve()
          );
        });

        await updateModuleMdxPath(mod.lessonId, mod.id, mdxPath);
        mod.mdxPath = mdxPath;
      }

      onDone && onDone({ ...mod, mdxPath });
      setTitle("Introduction");
      setMdxFile(null);
      setUploadPct(0);
    } catch (err) {
      onError && onError(`❌ ${err?.message ?? "Failed to create module"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface/70 rounded-xl border border-white/10 p-4 space-y-3">
      <div className="text-lg font-semibold">Add Module (with MDX)</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="bg-white/10 rounded p-2" value={lessonId} onChange={(e)=>setLessonId(e.target.value)} placeholder="Lesson Id (e.g., L1-1)" />
        <input className="bg-white/10 rounded p-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Module title" />
        <input className="bg-white/10 rounded p-2" type="number" value={order} onChange={(e)=>setOrder(e.target.value)} placeholder="Order (auto if blank)" />
        <input className="bg-white/10 rounded p-2" type="number" value={xp} onChange={(e)=>setXp(Number(e.target.value))} placeholder="XP (default 10)" />

        <div className="col-span-2">
          <label className="text-xs block mb-1">Module Content (.mdx)</label>
          <input
            type="file"
            accept=".mdx,.md"
            onChange={(e) => setMdxFile(e.target.files?.[0] ?? null)}
            className="w-full bg-white/10 rounded p-2"
          />
          {mdxFile && (
            <p className="mt-1 text-xs text-subtext">
              {mdxFile.name} • {Math.round(mdxFile.size / 1024)} KB
            </p>
          )}
          {busy && mdxFile && (
            <div className="mt-2">
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div className="h-2 bg-accent transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
              <div className="text-xs mt-1 text-subtext">{uploadPct}%</div>
            </div>
          )}
        </div>
      </div>
      <button className="rounded-md bg-cyan-400 text-black font-semibold px-3 py-2" disabled={busy}>
        {busy ? "Saving…" : "Create Module"}
      </button>
    </form>
  );
}
