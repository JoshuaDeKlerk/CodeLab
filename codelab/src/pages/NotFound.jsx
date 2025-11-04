import { Link, useLocation, useNavigate } from "react-router-dom";

// Not Found (404) Page Component
export default function NotFound() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <div className="min-h-[60vh] grid place-items-center px-6 py-16">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur ring-1 ring-white/5 shadow-2xl overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #4DA3FF, transparent)" }} />

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="inline-grid place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 p-2">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-accent">
                <path d="M12 3 2 9l10 6 10-6-10-6Z" stroke="currentColor" strokeWidth="2" />
                <path d="M2 15l10 6 10-6" stroke="currentColor" strokeWidth="2" opacity=".5" />
              </svg>
            </span>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight">404</span>
          </div>

          <h1 className="mt-4 text-xl md:text-2xl font-bold">Page not found</h1>
          <p className="mt-2 text-sm md:text-[15px] text-subtext">
            We couldn’t find <span className="font-mono text-white/80">{loc.pathname}</span>. 
            It might have been moved or the link is incorrect.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg font-semibold shadow-sm shadow-accent/30 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition"
            >
              Go home
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>

            <button
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition"
            >
              Go back
            </button>

            <Link
              to="/app/map"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
            >
              Open world map
            </Link>
          </div>

          <p className="mt-3 text-xs text-subtext">
            Tip: Press <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10">Alt</span> +{" "}
            <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10">←</span> to go back.
          </p>
        </div>
      </div>
    </div>
  );
}
