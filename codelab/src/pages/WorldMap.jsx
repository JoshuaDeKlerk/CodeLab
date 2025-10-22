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