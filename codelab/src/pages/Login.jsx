import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login({ email, password });
      nav("/app/tracks", { replace: true });
    } catch (e) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md bg-surface/60 rounded-xl p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
      {err && <div className="mb-3 text-sm text-warn">{err}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2"
               placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2"
               placeholder="Password" type="password"
               value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading}
          className="w-full px-4 py-2 rounded-xl bg-accent text-bg font-semibold hover:opacity-90 disabled:opacity-60">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-subtext mt-4">No account? <Link className="text-accent" to="/signup">Sign up</Link></p>
    </div>
  );
}
