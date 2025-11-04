// src/pages/Login.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Logo from "../assets/logo.svg";
import SideImg from "../assets/signup/SignUp.jpeg"; 

export default function Login() {
  const { login, googleLogin, user } = useAuth(); 

  const nav = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from ?? "/app/map";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [err, setErr] = useState("");
  const [fieldErrs, setFieldErrs] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) nav(next, { replace: true });
  }, [user, nav, next]);

  // Form validation
  function validate() {
    const e = { email: "", password: "" };
    if (!email.trim()) e.email = "Please enter your email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Please enter a valid email address.";
    if (!password) e.password = "Please enter your password.";
    return e;
  }

  // Map Firebase auth errors to user-friendly messages
  function mapAuthError(error) {
    const code = error?.code || "";
    if (code.includes("user-not-found")) return "No account found for that email.";
    if (code.includes("wrong-password")) return "Incorrect password. Please try again.";
    if (code.includes("invalid-credential")) return "Invalid email or password.";
    if (code.includes("too-many-requests")) return "Too many attempts. Please try again later.";
    if (code.includes("network-request-failed")) return "Network error. Check your connection and try again.";
    return error?.message ?? "Login failed. Please try again.";
    }
  
  // Form submission
  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v.email || v.password) {
      setFieldErrs(v);
      return;
    }
    setFieldErrs({ email: "", password: "" });

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      nav(next, { replace: true });
    } catch (error) {
      setErr(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  // Google login
  async function onGoogle() {
    setErr("");
    setGoogleLoading(true);
    try {
      const u = await googleLogin();
      if (u) nav(next, { replace: true });
    } catch (error) {
      const msg = error?.code?.includes("popup-closed-by-user")
        ? "Google sign-in was closed before finishing."
        : error?.code?.includes("cancelled-popup-request")
        ? "Another sign-in is already in progress."
        : "Google login failed. Please try again.";
      setErr(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="hidden md:block">
            <div className="p-[1px] rounded-2xl bg-gradient-to-tr from-[#4DA3FF33] via-transparent to-[#49D18E33]">
              <div className="relative h-[650px] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={SideImg}
                  alt="Return to your CodeLab journey"
                  className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-semibold drop-shadow-sm">Welcome back</h3>
                  <p className="text-sm text-white/80">Pick up where you left off.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="p-[1px] rounded-2xl bg-gradient-to-tr from-[#4DA3FF33] via-transparent to-[#49D18E33]">
              <div className="h-[650px] w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] grid place-items-center">
                <div className="w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-1">Log in</h2>
                  <p className="text-white/70 mb-4">Access your <span className="text-[#4DA3FF]">CodeLab</span> journey.</p>

                  {err && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="mb-3 text-sm rounded-lg bg-[#FFC857]/10 text-[#FFC857] px-3 py-2 border border-[#FFC857]/30"
                    >
                      {err}
                    </div>
                  )}

                  <button
                    onClick={onGoogle}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DA3FF]/60 shadow-sm"
                  >
                    <FcGoogle size={20} />
                    {googleLoading ? "Connecting to Google…" : "Continue with Google"}
                  </button>

                  <div className="my-4 flex items-center gap-3 text-white/60">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <span className="text-[11px] tracking-wide uppercase">or</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </div>

                  <form className="space-y-3" onSubmit={onSubmit} noValidate>
                    <div>
                      <label htmlFor="email" className="sr-only">Email</label>
                      <input
                        id="email"
                        className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${fieldErrs.email ? "border-[#FFC857]/70" : "border-white/10"}`}
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldErrs((s) => ({ ...s, email: "" })); setErr(""); } }
                        autoComplete="email"
                        aria-invalid={!!fieldErrs.email}
                        aria-describedby={fieldErrs.email ? "email-err" : undefined} />
                      {fieldErrs.email && <p id="email-err" className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{fieldErrs.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">Password</label>
                      <div className="relative">
                        <input
                          id="password"
                          className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 pr-10 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${fieldErrs.password ? "border-[#FFC857]/70" : "border-white/10"}`}
                          placeholder="Password"
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldErrs((s) => ({ ...s, password: "" })); setErr(""); } }
                          autoComplete="current-password"
                          aria-invalid={!!fieldErrs.password}
                          aria-describedby={fieldErrs.password ? "pw-err" : undefined} />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {fieldErrs.password && <p id="pw-err" className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{fieldErrs.password}</p>}

                    </div>

                    <button
                      disabled={loading || googleLoading}
                      className="w-full h-11 rounded-xl bg-[#4DA3FF] text-black font-semibold hover:brightness-95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4DA3FF]/60 shadow-sm"
                    >
                      {loading ? "Logging in…" : "Log in"}
                    </button>
                  </form>

                  <p className="text-sm text-white/70 mt-4">
                    No account?{" "}
                    <Link className="text-[#4DA3FF] underline-offset-2 hover:underline" to="/signup" state={{ from: next }}>
                      Create one
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
  );
}
