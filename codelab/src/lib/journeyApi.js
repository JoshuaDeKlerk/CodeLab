import { httpsCallable } from "firebase/functions";
import { functions, auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

// Ping the backend service
export async function ping() {
  const fn = httpsCallable(functions, "ping");
  const r = await fn();
  return r?.data;
}

// Start a new journey with the given topic
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

// Reset the current user's journey
export async function resetJourney() {
  const fn = httpsCallable(functions, "resetJourney");
  const r = await fn();
  return r?.data;
}

// Check if the current user has an active journey
export async function hasJourney() {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(db, `users/${uid}/journeys/default`));
  return snap.exists();
}

// Get a specific world header for the current user
export async function getUserWorldHeader(wid = "W1") {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, `users/${uid}/journeys/default/worlds/${wid}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get all world headers for the current user
export async function getUserWorlds() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const qref = query(
    collection(db, `users/${uid}/journeys/default/worlds`),
    orderBy("number", "asc")
  );
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get all lessons for a specific world for the current user
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

// Merge lessons with user progress data
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

// Generate content for a specific module
export async function generateModuleContent(lessonId, moduleId, worldId = "W1") {
  const fn = httpsCallable(functions, "generateModule");
  const res = await fn({ worldId, lessonId, moduleId });
  return res?.data;
}

// Get debug information for a specific module
export async function getModuleDebug(lessonId, moduleId, worldId = "W1") {
  const fn = httpsCallable(functions, "getModuleDebug");
  const res = await fn({ worldId, lessonId, moduleId });
  return res?.data;
}

// Probe the storage system
export async function storageProbe() {
  const fn = httpsCallable(functions, "storageProbe");
  const res = await fn();
  return res?.data;
}
