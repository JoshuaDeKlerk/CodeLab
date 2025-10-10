import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-extrabold text-xl tracking-tight">
          Code<span className="text-accent">Lab</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/app/tracks" className="hover:text-accent">Tracks</Link>
          <Link to="/app/dashboard" className="hover:text-accent">Dashboard</Link>
          <Link to="/style" className="hover:text-accent">Style</Link>
          <Link to="/login" className="hover:text-accent">Login</Link>
        </nav>
      </div>
    </header>
  );
}
