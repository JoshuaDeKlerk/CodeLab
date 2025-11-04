import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Logo from "../assets/logoShort.svg";

export default function TopNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Nav link styles
  const baseLink =
    "px-3 py-2 rounded-lg transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";
  const activeLink =
    "px-3 py-2 rounded-lg bg-white/5 text-white hover:text-white";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg/70 border-b border-white/5">
      <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto max-w-8xl px-6 md:px-20 py-3 md:py-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="relative inline-grid place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 p-1.5 transition-all group-hover:scale-105 group-hover:ring-white/20">
              <img src={Logo} alt="CodeLab" className="h-10 w-10" />
            </span>
            <span className="hidden md:block text-sl tracking-wide text-subtext group-hover:text-white transition-colors">
              Code<span className="text-accent">Lab</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm">
            <NavLink
              to="/style"
              className={({ isActive }) => (isActive ? activeLink : baseLink)}
            >
              Style Guide
            </NavLink>

            {user && (
              <NavLink
                to="/app/map"
                className={({ isActive }) => (isActive ? activeLink : baseLink)}
              >
                World Map
              </NavLink>
            )}

            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? activeLink : baseLink)}
                >
                  Login
                </NavLink>
                <Link
                  to="/signup"
                  className="ml-1 px-4 py-2 rounded-xl bg-accent text-bg font-semibold shadow-sm shadow-accent/30 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-subtext max-w-[180px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Toggle navigation"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" className="text-white">
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-bg/80 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-1 text-sm">
            <NavLink
              to="/style"
              className={({ isActive }) =>
                (isActive ? activeLink : baseLink) + " block"
              }
              onClick={() => setOpen(false)}
            >
              Style Guide
            </NavLink>

            {user && (
              <NavLink
                to="/app/map"
                className={({ isActive }) =>
                  (isActive ? activeLink : baseLink) + " block"
                }
                onClick={() => setOpen(false)}
              >
                World Map
              </NavLink>
            )}

            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    (isActive ? activeLink : baseLink) + " block"
                  }
                  onClick={() => setOpen(false)}
                >
                  Login
                </NavLink>
                <Link
                  to="/signup"
                  className="block mt-1 px-4 py-2 rounded-xl bg-accent text-bg font-semibold text-center shadow-sm shadow-accent/30"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
