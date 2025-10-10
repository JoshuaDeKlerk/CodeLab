import { Link } from "react-router-dom";
export default function Login() {
  return (
    <div className="mx-auto max-w-md bg-surface/60 rounded-xl p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
      <form className="space-y-3" onSubmit={(e)=>e.preventDefault()}>
        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2" placeholder="Email" />
        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2" placeholder="Password" type="password" />
        <button className="w-full px-4 py-2 rounded-xl bg-accent text-bg font-semibold">Log in</button>
      </form>
      <p className="text-sm text-subtext mt-4">No account? <Link className="text-accent" to="/signup">Sign up</Link></p>
    </div>
  );
}
