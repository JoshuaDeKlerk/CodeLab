import { db } from "./firebase";
import {
  collection, getDocs, query, where, orderBy, doc, getDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Gets World Header
export async function getWorldHeader(worldId) {
  const snap = await getDoc(doc(db, "worlds", worldId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Gets Lessons for a World
export async function getWorldLessons(worldId) {
  const q = query(
    collection(db, "lessons"),
    where("worldId", "==", worldId),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })); 
}

// Merges lessons with user progress
export async function mergeWithUserProgress(lessons) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return lessons.map(l => ({ ...l, stepsDone: 0, completed: false }));

  const progSnap = await getDocs(collection(db, "users", uid, "progress"));
  const map = new Map(progSnap.docs.map(d => [d.id, d.data()]));
  return lessons.map(l => {
    const p = map.get(l.id);
    return { ...l, stepsDone: p?.stepsDone ?? 0, completed: !!p?.completed };
  });
}
