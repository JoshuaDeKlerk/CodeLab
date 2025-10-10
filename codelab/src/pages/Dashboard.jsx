export default function Dashboard() {
  const mock = { xp: 120, streak: 4, completed: 7 };
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card label="XP" value={mock.xp} />
        <Card label="Streak" value={`${mock.streak} days`} />
        <Card label="Completed" value={mock.completed} />
      </div>
    </div>
  );
}
function Card({label, value}) {
  return (
    <div className="bg-surface/60 rounded-xl p-4 border border-white/10">
      <div className="text-subtext text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
