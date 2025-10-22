
const RAW = (import.meta.env.VITE_ADMIN_UIDS ?? import.meta.env.VITE_ADMIN_UID ?? "").trim();

export const ADMIN_UIDS = RAW
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export function isAdmin(uid?: string | null | undefined) {
  return !!uid && ADMIN_UIDS.includes(uid);
}
