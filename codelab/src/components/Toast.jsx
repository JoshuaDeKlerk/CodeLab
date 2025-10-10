import { useEffect } from "react";

/** Minimal toast. Usage:
 * <Toast open={!!toast} type="success" onClose={()=>setToast(null)}>
 *   Your message
 * </Toast>
 */
export default function Toast({ open, type = "info", duration = 2500, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const color = {
    success: "bg-success text-bg",
    warn: "bg-warn text-bg",
    info: "bg-accent text-bg",
    error: "bg-red-500 text-white",
  }[type] || "bg-accent text-bg";

  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center mt-6 z-50">
      <div className={`pointer-events-auto px-4 py-2 rounded-xl shadow ${color}`}>
        {children}
      </div>
    </div>
  );
}
