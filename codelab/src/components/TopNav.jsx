import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-extrabold text-xl tracking-tight">
          Code<span className="text-accent">Lab</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/app/map" className="hover:text-accent">World Map</Link>
          <Link to="/app/dashboard" className="hover:text-accent">Dashboard</Link>
          <Link to="/style" className="hover:text-accent">Style</Link>

          {!user ? (
            <>
              <Link to="/login" className="hover:text-accent">Login</Link>
              <Link to="/signup" className="px-3 py-1 rounded-lg bg-accent text-bg font-semibold hover:opacity-90">
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-subtext hidden sm:inline">
                {user.displayName || user.email}
              </span>
              <button
                onClick={() => logout()}
                className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
