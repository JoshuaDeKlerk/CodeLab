import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[60rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(40rem 20rem at 50% 20%, rgba(77,163,255,0.15), transparent 60%)",
          }}
        />
      </div>

      {/* Hero */}
      <section className="text-center py-20 md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-subtext">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Personalised AI-guided journey
        </span>

        <h1 className="mt-6 text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Learn to code, <span className="text-accent">with feedback</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-subtext">
          Build real skills through short lessons, instant checks, and a world map that unlocks as you progress.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold hover:opacity-90 transition"
          >
            Get Started
          </Link>

          <Link
            to={user ? "/app/map" : "/signup"}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
          >
            {user ? "Open World Map" : "Explore the Worlds"}
          </Link>

          <Link
            to="/style"
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
          >
            Style Guide
          </Link>
        </div>

        {/* Code preview card (static) */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
          <div className="mb-3 flex items-center gap-2 text-xs text-subtext">
            <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
            <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
            <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
            <span className="ml-2 opacity-70">/app/learn.jsx</span>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#0f172a] p-4 text-sm leading-relaxed">
            <code>{`function greet(name) {
  if (!name) return "Hello, world!";
  return \`Hello, \${name}!\`;
}

// Try it yourself ↓
console.log(greet("Coder"));`}</code>
          </pre>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            title="AI-generated worlds"
            blurb="A personalised learning path with themed worlds and bite-sized lessons."
          />
          <Feature
            title="Instant feedback"
            blurb="Check your answers in the browser and iterate quickly."
          />
          <Feature
            title="Track progress"
            blurb="Level up, unlock new lessons, and see what’s next on your map."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <h2 className="text-2xl font-bold text-center">How it works</h2>
        <ol className="mx-auto mt-6 grid gap-4 md:grid-cols-3">
          <Step n={1} title="Create your account" desc="Sign up and pick what you want to learn." />
          <Step n={2} title="Generate your world" desc="We build a tailored path with focused lessons." />
          <Step n={3} title="Learn by doing" desc="Complete tasks, get feedback, and unlock the next level." />
        </ol>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <blockquote className="text-lg text-subtext">
            “The world map keeps me motivated. Lessons are short, practical, and the feedback is instant.”
          </blockquote>
          <figcaption className="mt-4 text-sm">
            <span className="font-semibold">Student tester</span> · Interactive Development
          </figcaption>
        </figure>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-subtext/80">
          <span className="opacity-70">Built with</span>
          <Badge>React</Badge>
          <Badge>Firebase</Badge>
          <Badge>Tailwind</Badge>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-20 text-center">
        <h3 className="text-2xl font-bold">Ready to start?</h3>
        <p className="mt-2 text-subtext">Join and generate your first learning world in seconds.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold hover:opacity-90 transition"
          >
            Create free account
          </Link>
          <Link
            to={user ? "/app/map" : "/login"}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
          >
            {user ? "Go to World Map" : "Log in"}
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, blurb }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-subtext">{blurb}</p>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 flex items-center justify-center rounded-full bg-accent/20 text-accent font-bold">
          {n}
        </div>
        <div className="font-semibold">{title}</div>
      </div>
      <p className="mt-2 text-sm text-subtext">{desc}</p>
    </li>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {children}
    </span>
  );
}
