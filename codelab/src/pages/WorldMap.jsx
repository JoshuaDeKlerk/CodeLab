import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  hasJourney,
  getUserWorldLessons,
  getUserWorlds,
} from "../lib/journeyApi";
import "../stylesheets/WorldMap.css";
import TechIcon from "../components/TechIcon";
import LessonCard, { LockedLessonCard } from "../components/LessonCard";
import StartJourneyModal from "../components/StartJourneyModal"; 

// World Map Page Component
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
    <div className="space-y-10 md:space-y-12">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Your Learning Journey
          </h1>
          <p className="text-subtext text-sm md:text-[15px]">
            Worlds group your lessons by theme. Unlock new lessons as you progress.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="text-sm px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 ring-1 ring-white/5 transition"
          >
            Reload
          </button>
        </div>
      </div>

      {/* Empty state */}
      {needsJourney && (
        <div className="rounded-2xl border border-white/10 p-5 md:p-6 bg-white/[0.03] flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
          <div className="space-y-1">
            <div className="text-lg md:text-xl font-semibold">No journey yet</div>
            <p className="text-subtext text-sm">
              Click below to generate a personalised world with lessons.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="px-4 py-2.5 rounded-lg bg-accent text-bg font-semibold shadow-sm shadow-accent/30 hover:opacity-90 transition"
            style={{ background: "#4DA3FF" }}
          >
            Start your journey
          </button>
        </div>
      )}

      {loading && (
        <div className="text-subtext text-sm">
          Loading worlds…
        </div>
      )}

      {/* Worlds */}
      <div className="space-y-8 md:space-y-10">
        {worlds.map((w) => (
          <WorldSection key={w.header.id} header={w.header} cards={w.cards} />
        ))}
      </div>

      {msg && <div className="text-subtext pt-2">{msg}</div>}

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

// World Section Component
function WorldSection({ header, cards }) {
  return (
    <section className="space-y-5 md:space-y-6">
      <WorldHeader header={header} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
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

// World Header Component
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
