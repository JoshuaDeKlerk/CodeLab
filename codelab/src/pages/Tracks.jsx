import { Link } from "react-router-dom";
import { exercises } from "../data/exercises";

export default function Tracks() {
  const js = exercises.filter(e => e.language === "javascript");
  const py = exercises.filter(e => e.language === "python");
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tracks</h1>

      <section>
        <h2 className="text-xl font-semibold mb-3">JavaScript</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {js.map(e => (
            <Card key={e.id} e={e} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Python</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {py.map(e => (
            <Card key={e.id} e={e} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ e }) {
  return (
    <div className="bg-surface/60 rounded-xl p-4 border border-white/10">
      <div className="font-semibold">{e.title}</div>
      <p className="text-sm text-subtext mt-1 line-clamp-2">{e.prompt}</p>
      <Link to={`/app/exercise/${e.id}`} className="inline-block mt-3 text-accent">
        Open →
      </Link>
    </div>
  );
}
