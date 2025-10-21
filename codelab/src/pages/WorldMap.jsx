import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorldHeader, getWorldLessons, mergeWithUserProgress } from "../lib/dashboardData";
import { createWorld, createLesson } from "../lib/adminApi";
import "../stylesheets/WorldMap.css";
import TechIcon from "../components/TechIcon";
import LessonCard, { LockedLessonCard } from "../components/LessonCard";

// Main World Map Page
export default function WorldMap() {
  const [header, setHeader] = useState(null);
  const [cards, setCards] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Load world data
  async function refresh(worldId = "W1") {
    setLoading(true);
    setMsg("");
    try {
      const [h, ls] = await Promise.all([
        getWorldHeader(worldId),
        getWorldLessons(worldId),
      ]);
      const merged = await mergeWithUserProgress(ls);
      setHeader(h);
      setCards(merged);
      if (!h) setMsg(`No world header found for ${worldId}`);
      if (h && merged.length === 0) setMsg(`No lessons found for ${worldId}`);
    } catch (err) {
      console.error(err);
      setMsg("❌ " + (err?.message ?? "Failed to load world map"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Journey To Full Stack Development</h1>
        <button
          onClick={() => refresh()}
          className="text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Reload
        </button>
      </div>

      {/* Temporary quick-add world form */}
      <div className="grid md:grid-cols-2 gap-4">
        <AddWorld
          onDone={(w) => { setMsg(`✅ World ${w.id} created`); refresh(w.id); }}
          onError={setMsg}
        />
        <AddLesson
          defaultWorldId="W1"
          onDone={(l) => { setMsg(`✅ Lesson ${l.id} created in ${l.worldId}`); refresh(l.worldId); }}
          onError={setMsg}
        />
      </div>

      {msg && <div className="text-sm bg-black/30 border border-white/10 rounded p-2">{msg}</div>}

      {loading && (
        <div className="text-subtext text-sm">Loading world…</div>
      )}

      {header && <WorldHeader header={header} />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) =>
          c.lockedUntilLevel > 0 ? (
            <LockedLessonCard key={c.id} card={c} />
          ) : (
            <LessonCard key={c.id} card={c} />
          )
        )}
      </div>
    </div>
  );
}

// Temporary quick-add world form
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

// Temporary quick-add lesson form
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

// Header for the world
function WorldHeader({ header }) {
  return (
    <div className="world-header">
      <div className="world-num">{header.number}</div>

      <div className="content">
        <div className="world-title">{header.title}</div>
        <div className="world-blurb">{header.blurb}</div>
      </div>

      <div className="world-tech">
        {(header.icons ?? ["css","html","js"]).map(k => (
          <TechIcon key={k} kind={k} size={50} />
        ))}
      </div>
    </div>
  );
}