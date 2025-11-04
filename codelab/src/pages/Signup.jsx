// src/pages/Signup.jsx
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import SideImg from "../assets/signup/SignUp.jpeg";

// Password strength scoring
function pwScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
const SCORE_LABELS = ["Too weak", "Weak", "Okay", "Strong", "Very strong"];

// Signup Page Component
export default function Signup() {
  const { signup, googleSignup, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from ?? "/app/map";

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) nav(next, { replace: true });
  }, [user, nav, next]);

  const score = useMemo(() => pwScore(form.password), [form.password]);
  const strengthPct = (score / 4) * 100;
  const strengthLabel = SCORE_LABELS[score];

  // Form field update
  function update(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setFormErr("");
  }

  // Form validation
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) e.email = "Please enter your email.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password && form.confirm && form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  // Map Firebase auth errors to user-friendly messages
  function mapAuthError(err) {
    const code = err?.code || "";
    if (code.includes("email-already-in-use")) return "That email is already registered. Try logging in.";
    if (code.includes("invalid-email")) return "That email address doesn’t look right.";
    if (code.includes("operation-not-allowed")) return "Email/password sign-up is disabled for this project.";
    if (code.includes("weak-password")) return "That password is too weak. Try adding more characters and variety.";
    return err?.message ?? "Signup failed. Please try again.";
  }

  // Form submission
  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    setFormErr("");
    try {
      await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      nav(next, { replace: true });
    } catch (err) {
      setFormErr(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  // Google signup
  async function onGoogle() {
    setGoogleLoading(true);
    setFormErr("");
    try {
      const u = await googleSignup();
      if (u) nav(next, { replace: true });
    } catch (err) {
      const msg = err?.code?.includes("popup-closed-by-user")
        ? "Google sign-in was closed before finishing."
        : err?.code?.includes("cancelled-popup-request")
        ? "Another sign-in is already in progress."
        : "Google signup failed. Please try again.";
      setFormErr(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
      <div className="relative mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <section className="hidden md:block">
            <div className="p-[1px] rounded-2xl bg-gradient-to-tr from-[#4DA3FF33] via-transparent to-[#49D18E33]">
              <div className="relative h-[650px] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={SideImg}
                  alt="Embark on your CodeLab journey"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-semibold drop-shadow-sm">Learn by building</h3>
                  <p className="text-sm text-white/80">
                    Full-stack skills, AI-assisted modules, progress synced across devices.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="p-[1px] rounded-2xl bg-gradient-to-tr from-[#4DA3FF33] via-transparent to-[#49D18E33]">
              <div className="h-[650px] w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10  shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] grid place-items-center">
                <div className="w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-1">Create your account</h2>
                  <p className="text-white/70 mb-4">
                    Start your <span className="text-[#4DA3FF]">CodeLab</span> journey.
                  </p>

                  {formErr && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="mb-3 text-sm rounded-lg bg-[#FFC857]/10 text-[#FFC857] px-3 py-2 border border-[#FFC857]/30"
                    >
                      {formErr}
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
                      <label htmlFor="name" className="sr-only">Name</label>
                      <input
                        id="name"
                        className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${errors.name ? "border-[#FFC857]/70" : "border-white/10"}`}
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-err" : undefined}
                      />
                      {errors.name && <p id="name-err" className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="sr-only">Email</label>
                      <input
                        id="email"
                        className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${errors.email ? "border-[#FFC857]/70" : "border-white/10"}`}
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-err" : "email-help"}
                      />
                      {!errors.email && (
                        <p id="email-help" className="mt-1 text-[11px] text-white/60">
                          Use your main email to sync progress across devices.
                        </p>
                      )}
                      {errors.email && <p id="email-err" className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">Password</label>
                      <div className="relative">
                        <input
                          id="password"
                          className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 pr-10 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${errors.password ? "border-[#FFC857]/70" : "border-white/10"}`}
                          placeholder="Password"
                          type={showPw ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          autoComplete="new-password"
                          aria-invalid={!!errors.password}
                          aria-describedby="pw-meter pw-hint"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>

                      <div id="pw-meter" className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-300"
                          style={{
                            width: `${strengthPct}%`,
                            background: score <= 1 ? "#FFC857" : score === 2 ? "#4DA3FF" : "#49D18E",
                          }}
                        />
                      </div>
                      <div id="pw-hint" className="mt-1 text-[11px] text-white/60">
                        {strengthLabel} • Use 12+ chars with upper/lowercase, numbers or symbols.
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{errors.password}</p>}
                    </div>

                    <div>
                      <label htmlFor="confirm" className="sr-only">Confirm password</label>
                      <div className="relative">
                        <input
                          id="confirm"
                          className={`w-full h-11 bg-white/[0.06] border rounded-xl px-3 pr-10 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#4DA3FF]/50 ${errors.confirm ? "border-[#FFC857]/70" : "border-white/10"}`}
                          placeholder="Confirm password"
                          type={showPw2 ? "text" : "password"}
                          value={form.confirm}
                          onChange={(e) => update("confirm", e.target.value)}
                          onPaste={(e) => e.preventDefault()}
                          autoComplete="new-password"
                          aria-invalid={!!errors.confirm}
                          aria-describedby={errors.confirm ? "confirm-err" : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw2((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none"
                          aria-label={showPw2 ? "Hide password" : "Show password"}
                        >
                          {showPw2 ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.confirm && <p id="confirm-err" className="mt-1 text-xs text-[#FFC857]" aria-live="polite">{errors.confirm}</p>}
                    </div>

                    <button
                      disabled={loading || googleLoading}
                      className="w-full h-11 rounded-xl bg-[#4DA3FF] text-black font-semibold hover:brightness-95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4DA3FF]/60 shadow-sm"
                    >
                      {loading ? "Creating…" : "Create account"}
                    </button>
                  </form>

                  <p className="text-sm text-white/70 mt-4">
                    Already have an account?{" "}
                    <Link className="text-[#4DA3FF] underline-offset-2 hover:underline" to="/login" state={{ from: next }}>
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}
