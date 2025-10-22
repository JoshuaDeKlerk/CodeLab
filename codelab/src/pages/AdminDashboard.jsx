import { useState } from "react";
import { createWorld, createLesson } from "../lib/adminApi";
import "../stylesheets/WorldMap.css"; 

export default function AdminDashboard() {
  const [msg, setMsg] = useState("");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        {msg && (
          <div className="text-sm bg-black/30 border border-white/10 rounded p-2">
            {msg}
          </div>
        )}
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <AddWorld
          onDone={(w) => setMsg(`✅ World ${w.id} created`)}
          onError={(e) => setMsg(e)}
        />
        <AddLesson
          defaultWorldId="W1"
          onDone={(l) => setMsg(`✅ Lesson ${l.id} created in ${l.worldId}`)}
          onError={(e) => setMsg(e)}
        />
      </section>
    </div>
  );
}

/** ====== Forms (moved from WorldMap) ====== */

function AddWorld({ onDone, onError }) {
  const [title, setTitle] = useState("FOUNDATION WORLD");
  const [blurb, setBlurb] = useState("Understand how code builds the web from scratch.");
  const [icons, setIcons] = useState("css,html,js");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const w = await createWorld({ title, blurb, icons: icons.split(",").map(s => s.trim()) });
      onDone?.(w);
    } catch (e2) {
      onError?.(`❌ ${e2.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface/70 rounded-xl border border-white/10 p-4 space-y-2">
      <div className="font-semibold">Add World</div>
      <input className="w-full bg-white/10 rounded p-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input className="w-full bg-white/10 rounded p-2" value={blurb} onChange={e => setBlurb(e.target.value)} placeholder="Blurb" />
      <input className="w-full bg-white/10 rounded p-2" value={icons} onChange={e => setIcons(e.target.value)} placeholder="Icons (csv)" />
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
  const [text, setText] = useState("Learn structure, tags, and links to build your first webpage.");
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
      const l = await createLesson({
        worldId, title, subtitle, text, badge, accent,
        xpTotal: Number(xp), stepsTotal: Number(steps), lockedUntilLevel: Number(lock),
      });
      onDone?.(l);
      setTitle("New Lesson"); setSubtitle("Subtitle");
    } catch (e2) {
      onError?.(`❌ ${e2.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface/70 rounded-xl border border-white/10 p-4 space-y-2">
      <div className="font-semibold">Add Lesson</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="bg-white/10 rounded p-2" value={worldId} onChange={e => setWorldId(e.target.value)} placeholder="World Id (e.g., W1)" />
        <input className="bg-white/10 rounded p-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <input className="bg-white/10 rounded p-2" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle" />
        <textarea className="col-span-2 bg-white/10 rounded p-2" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Short blurb under subtitle" />
        <input className="bg-white/10 rounded p-2" value={badge} onChange={e => setBadge(e.target.value)} placeholder="Badge (html/css/js/all)" />
        <input className="bg-white/10 rounded p-2" value={accent} onChange={e => setAccent(e.target.value)} placeholder="#hex or gradient" />
        <input className="bg-white/10 rounded p-2" type="number" value={xp} onChange={e => setXp(e.target.value)} placeholder="XP total" />
        <input className="bg-white/10 rounded p-2" type="number" value={steps} onChange={e => setSteps(e.target.value)} placeholder="Steps total" />
        <input className="bg-white/10 rounded p-2" type="number" value={lock} onChange={e => setLock(e.target.value)} placeholder="Locked until level" />
      </div>
      <button className="rounded-md bg-cyan-400 text-black font-semibold px-3 py-2" disabled={busy}>
        {busy ? "Creating…" : "Create Lesson"}
      </button>
    </form>
  );
}
