export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text px-6 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center">
        CodeLab Style Guide <span className="text-accent">Preview</span>
      </h1>
      <p className="text-center text-subtext mt-2">
        Colors • Typography • Buttons
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Palette</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Swatch name="bg"       hex="#0B0F14"  className="bg-bg" />
          <Swatch name="surface"  hex="#1E293B"  className="bg-surface" />
          <Swatch name="accent"   hex="#4DA3FF"  className="bg-accent text-bg" />
          <Swatch name="success"  hex="#49D18E"  className="bg-success text-bg" />
          <Swatch name="warn"     hex="#FFC857"  className="bg-warn text-bg" />
          <Swatch name="text"     hex="#FEFEFE"  className="bg-text text-bg" />
          <Swatch name="subtext"  hex="#E2E8F0"  className="bg-subtext text-bg" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Typography</h2>
        <div className="space-y-2">
          <div className="text-4xl font-extrabold">Heading 1 — Inter ExtraBold</div>
          <div className="text-3xl font-bold">Heading 2 — Inter Bold</div>
          <div className="text-2xl font-semibold">Heading 3 — Inter Semibold</div>
          <div className="text-xl font-semibold text-subtext">Body Lead — Inter</div>
          <p className="text-base text-subtext">
            Body text example. Keep contrast high and line-height comfortable for long reading.
          </p>
          <pre className="font-mono text-sm bg-surface/60 border border-white/10 rounded-xl p-4 overflow-auto">
{`// JetBrains Mono (code)
function hello() {
  return "Hello, World!";
}`}
          </pre>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-xl bg-accent text-bg font-semibold shadow hover:opacity-90 transition">Primary</button>
          <button className="px-4 py-2 rounded-xl bg-success text-bg font-semibold shadow hover:opacity-90 transition">Success</button>
          <button className="px-4 py-2 rounded-xl bg-warn text-bg font-semibold shadow hover:opacity-90 transition">Warning</button>
          <button className="px-4 py-2 rounded-xl border border-white/10 text-text hover:bg-white/5 transition">Ghost</button>
        </div>
      </section>

      <footer className="mt-12 text-center text-xs text-subtext/70">
        Inter for UI • JetBrains Mono for code • Tailwind utilities via custom theme
      </footer>
    </div>
  );
}

function Swatch({ name, hex, className }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div className={`h-20 ${className}`} />
      <div className="p-3 text-sm flex items-center justify-between">
        <span className="uppercase tracking-wide text-subtext">{name}</span>
        <span className="font-mono text-subtext">{hex}</span>
      </div>
    </div>
  );
}