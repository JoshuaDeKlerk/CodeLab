import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorldHeader, getWorldLessons, mergeWithUserProgress } from "../lib/dashboardData";
import { createWorld, createLesson } from "../lib/adminApi";
import "../stylesheets/WorldMap.css";
import TechIcon from "../components/TechIcon";

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
            <LockedCard key={c.id} card={c} />
          ) : (
            <Card key={c.id} card={c} />
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

// Card for each lesson
function Card({ card }) {
  const stepsDone = Number(card.stepsDone ?? 0);
  const stepsTotal = Math.max(1, Number(card.stepsTotal ?? 1));
  const pct = Math.min(100, Math.round((stepsDone / stepsTotal) * 100));

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface/70 p-4">
      <div className="text-lg font-semibold">{card.title}</div>
      <div className="text-sm mt-1">{card.subtitle}</div>
      {card.text && (
        <p className="mt-2 text-sm text-subtext" style={{
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {card.text}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <Link to={`/app/exercise/${card.id}`} className="px-3 py-1.5 rounded-md font-medium"
              style={{ background: card.accent, color: "#0B0F14" }}>
          {stepsDone > 0 ? "Continue" : "Get Started"}
        </Link>
        <div className="text-xs text-subtext">{card.xpTotal}XP In Total</div>
      </div>
      <div className="mt-3">
        <div className="text-xs mb-1 flex items-center justify-between">
          <span>Progress</span><span>{stepsDone}/{stepsTotal}</span>
        </div>
        <Progress value={pct} />
      </div>
    </div>
  );
}

// Locked Card
function LockedCard({ card }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface/40 p-4 opacity-60">
      <div className="text-lg font-semibold">{card.title}</div>
      <div className="text-sm mt-1 text-subtext">{card.subtitle}</div>
      <button className="mt-3 px-3 py-1.5 rounded-md bg-white/10 text-subtext cursor-not-allowed" disabled>Get Started</button>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="flex items-center gap-2 text-white font-semibold tracking-wide drop-shadow">
          <span className="inline-block w-5 h-5 rounded-sm bg-white/90 text-black grid place-items-center text-xs">🔒</span>
          LEVEL {card.lockedUntilLevel} REQUIRED
        </div>
      </div>
      <div className="mt-3">
        <div className="text-xs mb-1 text-subtext">Progress</div>
        <Progress value={0} muted />
      </div>
    </div>
  );
}

// Progress Bar
function Progress({ value, muted = false }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
      <div className="h-full rounded-full transition-all"
           style={{ width: `${value}%`, background: muted ? "rgba(255,255,255,0.25)" : "linear-gradient(90deg,#4DA3FF,#49D18E)" }} />
    </div>
  );
}
