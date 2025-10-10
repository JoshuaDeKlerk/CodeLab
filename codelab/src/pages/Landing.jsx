import { Link } from "react-router-dom";
export default function Landing() {
  return (
    <section className="text-center py-16">
      <h1 className="text-5xl font-extrabold">Learn to code, <span className="text-accent">with feedback</span></h1>
      <p className="text-subtext mt-3">Hands-on exercises, browser editor, and progress tracking.</p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link to="/signup" className="px-5 py-2 rounded-xl bg-accent text-bg font-semibold">Get Started</Link>
        <Link to="/app/tracks" className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5">Explore Tracks</Link>
      </div>
    </section>
  );
}
