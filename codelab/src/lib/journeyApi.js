import { httpsCallable } from "firebase/functions";
import { functions, auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

export async function ping() {
  const fn = httpsCallable(functions, "ping");
  const r = await fn();
  return r?.data;
}

export async function startJourney(topic, opts = {}) {
  try {
    const gen = httpsCallable(functions, "generateJourney");
    return await gen({ topic, ...opts });
  } catch (e) {
    console.error("generateJourney failed:", {
      code: e?.code, message: e?.message, details: e?.details,
    });
    throw e;
  }
}

export async function resetJourney() {
  const fn = httpsCallable(functions, "resetJourney");
  const r = await fn();
  return r?.data;
}

export async function hasJourney() {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(db, `users/${uid}/journeys/default`));
  return snap.exists();
}

export async function getUserWorldHeader(wid = "W1") {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, `users/${uid}/journeys/default/worlds/${wid}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserWorldLessons(wid = "W1") {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const qref = query(
    collection(db, `users/${uid}/journeys/default/worlds/${wid}/lessons`),
    orderBy("order", "asc")
  );
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserModules(lessonId, worldId = "W1") {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const qref = query(
    collection(db, `users/${uid}/journeys/default/worlds/${worldId}/lessons/${lessonId}/modules`),
    orderBy("order", "asc")
  );
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
