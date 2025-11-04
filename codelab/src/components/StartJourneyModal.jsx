import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { startJourney } from "../lib/journeyApi";

// Start Journey Modal Component
export default function StartJourneyModal({ open, onClose, onCreated }) {
const [topic, setTopic] = useState("Full-Stack Development (HTML, CSS, JS, React)");
const [busy, setBusy] = useState(false);
const [err, setErr] = useState("");
const inputRef = useRef(null);
const dialogRef = useRef(null);
const titleId = "start-journey-title";
const descId = "start-journey-desc";

// Handle keyboard events
useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    const onKey = (e) => {
    if (e.key === "Escape" && !busy) onClose?.();
    if (e.key === "Enter" && !busy) handleGenerate();
    };
    window.addEventListener("keydown", onKey);
    return () => {
    clearTimeout(t);
    window.removeEventListener("keydown", onKey);
    };
}, [open, busy]); 

if (!open) return null;

// Preset topics
const presets = [
    "Frontend from zero (HTML/CSS/JS)",
    "React & TypeScript fundamentals",
    "Backend with Node + Express",
    "Databases with PostgreSQL",
    "Full-Stack (React, API, Auth)",
];

// Generate journey handler
async function handleGenerate() {
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
}

// Modal JSX
const modal = (
    <div
    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => !busy && onClose?.()}
    aria-labelledby={titleId}
    aria-describedby={descId}
    aria-modal="true"
    role="dialog"
    >
    <div
        ref={dialogRef}
        className="relative w-full max-w-xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
    >
        <div
        className="h-1 w-full rounded-t-2xl"
        style={{ background: "linear-gradient(90deg, #4DA3FF, transparent)" }}
        />
        <div className="bg-surface/95 border border-white/10 rounded-b-2xl rounded-t-none p-6 md:p-7 shadow-2xl ring-1 ring-white/5">
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
            <h2 id={titleId} className="text-xl md:text-2xl font-bold tracking-tight">
                Start your journey
            </h2>
            <p id={descId} className="text-subtext text-sm md:text-[15px]">
                Tell the AI what you want to learn. We’ll generate your first world and lessons.
            </p>
            </div>
            <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-subtext focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Close"
            title="Close"
            >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            </button>
        </div>

        <div className="mt-4 rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-100 text-xs p-3">
            Tip: Be specific — include technologies or goals (e.g. “React + Firebase auth and CRUD”).
        </div>

        <div className="mt-4 space-y-2">
            <label className="text-xs text-subtext/80">Learning focus</label>
            <div className="relative">
            <input
                ref={inputRef}
                className="w-full bg-white/5 rounded-lg pl-3.5 pr-28 py-2.5 ring-1 ring-white/10 focus:ring-2 focus:ring-accent/60 outline-none placeholder:text-subtext/60"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Frontend web from zero"
                disabled={busy}
                maxLength={160}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-subtext">
                {topic.length}/160
            </span>
            </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => (
            <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => setTopic(p)}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs transition"
            >
                {p}
            </button>
            ))}
        </div>

        {err && (
            <div className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 text-rose-100 text-sm p-3">
            {err}
            </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 sm:justify-end">
            <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition"
            disabled={busy}
            >
            Cancel
            </button>
            <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg font-semibold shadow-sm shadow-accent/30 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition disabled:opacity-60"
            >
            {busy && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
            )}
            {busy ? "Creating…" : "Generate"}
            </button>
        </div>

        <p className="mt-3 text-xs text-subtext/70">
            Note: You can have one active journey. Press <span className="px-1 rounded bg-white/5 border border-white/10">Enter</span> to generate, or{" "}
            <span className="px-1 rounded bg-white/5 border border-white/10">Esc</span> to close.
        </p>
        </div>
    </div>
    </div>
);

return createPortal(modal, document.body);
}
