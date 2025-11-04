import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  hasJourney,
  startJourney,
  getUserWorldLessons,
  getUserWorlds,
} from "../lib/journeyApi";
import "../stylesheets/WorldMap.css";
import TechIcon from "../components/TechIcon";
import LessonCard, { LockedLessonCard } from "../components/LessonCard";

function StartJourneyModal({ open, onClose, onCreated }) {
  const [topic, setTopic] = useState("Full-Stack Development (HTML, CSS, JS, React)");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface/90 border border-white/10 rounded-xl w-full max-w-lg p-5 space-y-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">Start your journey</h2>
        <p className="text-subtext text-sm">
          Tell the AI what you want to learn. We’ll generate your first world and lessons.
        </p>
        <input
          className="w-full bg-white/10 rounded p-2"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Frontend web from zero"
        />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-white/10"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setBusy(true);
                setErr("");
                const r = await startJourney(topic);
                onCreated?.(r?.data);
              } catch (e) {
                setErr(e?.message || "Failed to create journey.");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="px-3 py-2 rounded-md bg-accent text-bg"
          >
            {busy ? "Creating…" : "Generate"}
          </button>
        </div>
        <p className="text-xs text-subtext/70">Note: You can have one active journey.</p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function WorldMap() {
  const [worlds, setWorlds] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsJourney, setNeedsJourney] = useState(false);
  const [modal, setModal] = useState(false);

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      const exists = await hasJourney();
      setNeedsJourney(!exists);
      if (!exists) {
        setWorlds([]);
        return;
      }

      const headers = await getUserWorlds();
      if (!headers || headers.length === 0) {
        setMsg("No worlds found for your journey yet.");
        setWorlds([]);
        return;
      }

      const worldsWithLessons = await Promise.all(
        headers.map(async (h) => {
          const lessons = await getUserWorldLessons(h.id);
          return { header: h, cards: lessons };
        })
      );

      setWorlds(worldsWithLessons);

      const empty = worldsWithLessons.filter((w) => w.cards.length === 0);
      if (empty.length === worldsWithLessons.length) {
        setMsg("Worlds loaded, but no lessons were found.");
      }
    } catch (err) {
      setMsg("❌ " + (err?.message ?? "Failed to load worlds"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Learning Journey</h1>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Reload
        </button>
      </div>

      {needsJourney && (
        <div className="rounded-xl border border-white/10 p-6 flex items-center justify-between relative">
          <div>
            <div className="text-xl font-semibold">No journey yet</div>
            <p className="text-subtext">
              Click below to generate a personalised world with lessons.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="btn-primary"
            style={{ background: "#4DA3FF" }}
          >
            Start your journey
          </button>
        </div>
      )}

      {loading && <div className="text-subtext text-sm">Loading worlds…</div>}

      <div className="space-y-10">
        {worlds.map((w) => (
          <WorldSection key={w.header.id} header={w.header} cards={w.cards} />
        ))}
      </div>

      {msg && <div className="text-subtext">{msg}</div>}

      <StartJourneyModal
        open={modal}
        onClose={() => setModal(false)}
        onCreated={async () => {
          setModal(false);
          await refresh();
        }}
      />
    </div>
  );
}

function WorldSection({ header, cards }) {
  return (
    <section className="space-y-4">
      <WorldHeader header={header} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) =>
          c.lockedUntilLevel > 0 ? (
            <LockedLessonCard key={c.id} card={c} />
          ) : (
            <LessonCard key={c.id} card={c} />
          )
        )}
      </div>
    </section>
  );
}

function WorldHeader({ header }) {
  return (
    <div className="world-header">
      <div className="world-num">{header.number}</div>
      <div className="content">
        <div className="world-title">{header.title}</div>
        <div className="world-blurb">{header.blurb}</div>
      </div>
      <div className="world-tech">
        {(header.icons ?? ["css", "html", "js"]).map((k) => (
          <TechIcon key={k} kind={k} size={50} />
        ))}
      </div>
    </div>
  );
}
