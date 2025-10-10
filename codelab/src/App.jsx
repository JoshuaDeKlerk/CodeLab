import './App.css'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-text">
      <h1 className="text-5xl font-extrabold text-accent mb-4">
        Tailwind is Working 🎉
      </h1>
      <p className="text-subtext text-lg">
        Your CodeLab color palette and fonts are active.
      </p>
      <button className="mt-6 px-6 py-2 bg-accent text-bg font-semibold rounded-xl2 shadow-soft hover:opacity-90 transition">
        Test Button
      </button>
    </div>
  );
}
