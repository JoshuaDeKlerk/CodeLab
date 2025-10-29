import { db } from "./firebase";
import {
  doc, getDoc, getDocs, setDoc, collection, query, where, orderBy, limit,
  serverTimestamp, runTransaction, updateDoc,
} from "firebase/firestore";

// helpers
async function getNextWorldNumber() {
  const q = query(collection(db, "worlds"), orderBy("number", "desc"), limit(1));
  const snap = await getDocs(q);
  return (snap.docs[0]?.data()?.number ?? 0) + 1;
}
const worldIdFromNumber = (n) => `W${n}`;

async function getNextLessonInfo(worldId) {
  const num = Number(String(worldId).replace(/^\D+/, "")) || 1;
  const q = query(
    collection(db, "lessons"),
    where("worldId", "==", worldId),
    orderBy("order", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  const last = snap.docs[0]?.data();
  const nextOrder = (last?.order ?? 0) + 1;
  return { nextOrder, nextLessonId: `L${num}-${nextOrder}` };
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// worlds
export async function createWorld({ title, blurb, icons = [], accent = "#4DA3FF", number, id }) {
  return runTransaction(db, async (tx) => {
    const n = typeof number === "number" ? number : await getNextWorldNumber();
    const wid = id ?? worldIdFromNumber(n);

    const ref = doc(db, "worlds", wid);
    if ((await tx.get(ref)).exists()) throw new Error(`World ${wid} already exists`);

    const data = {
      id: wid,
      number: n,
      title: (title || "").trim() || `WORLD ${n}`,
      blurb: (blurb || "").trim(),
      icons,
      accent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    tx.set(ref, data);
    return data;
  });
}

// lessons 
export async function createLesson(input) {
  const { worldId } = input || {};
  if (!worldId) throw new Error("worldId is required");

  return runTransaction(db, async (tx) => {
    const wref = doc(db, "worlds", worldId);
    if (!(await tx.get(wref)).exists()) throw new Error(`World ${worldId} not found`);

    const { nextOrder, nextLessonId } = await getNextLessonInfo(worldId);
    const order = input.order ?? nextOrder;
    const id = input.id ?? nextLessonId;

    const lref = doc(db, "lessons", id);
    if ((await tx.get(lref)).exists()) throw new Error(`Lesson ${id} already exists`);

    const data = {
      id,
      worldId,
      order,
      title: (input.title || "").trim() || `Lesson ${order}`,
      subtitle: (input.subtitle || "").trim(),
      text: (input.text || "").trim(),
      xpTotal: Number(input.xpTotal ?? 100),
      stepsTotal: Number(input.stepsTotal ?? 8),
      lockedUntilLevel: Number(input.lockedUntilLevel ?? 0),
      accent: input.accent || "#4DA3FF",
      badge: input.badge || "html",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    tx.set(lref, data);
    return data;
  });
}

export async function updateLessonMeta(lessonId, patch) {
  const ref = doc(db, "lessons", lessonId);
  const allowed = [
    "title","subtitle","text","xpTotal","stepsTotal","lockedUntilLevel",
    "accent","badge","order","worldId",
  ];
  const data = {};
  allowed.forEach((k) => { if (k in patch) data[k] = patch[k]; });
  data.updatedAt = serverTimestamp();
  await updateDoc(ref, data);
}

// modules (MDX path lives on module)
export async function createModule({ lessonId, title, id, order, xp = 10 }) {
  if (!lessonId) throw new Error("lessonId is required");

  const lref = doc(db, "lessons", lessonId);
  const lsnap = await getDoc(lref);
  if (!lsnap.exists()) throw new Error(`Lesson ${lessonId} not found`);
  const { worldId } = lsnap.data() || {};

  const moduleId = id || slugify(title) || `module-${Date.now()}`;

  let finalOrder = order;
  if (typeof finalOrder !== "number") {
    const q = query(
      collection(db, "lessons", lessonId, "modules"),
      orderBy("order", "desc"),
      limit(1)
    );
    const msnap = await getDocs(q);
    finalOrder = (msnap.docs[0]?.data()?.order ?? 0) + 1;
  }

  const mref = doc(db, "lessons", lessonId, "modules", moduleId);
  if ((await getDoc(mref)).exists()) throw new Error(`Module ${moduleId} already exists`);

  const data = {
    id: moduleId,
    title: (title || "").trim() || `Module ${finalOrder}`,
    order: finalOrder,
    xp: Number(xp ?? 10),
    mdxPath: null,
    worldId,
    lessonId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(mref, data);
  return data;
}

export async function updateModuleMdxPath(lessonId, moduleId, mdxPath) {
  const mref = doc(db, "lessons", lessonId, "modules", moduleId);
  const snap = await getDoc(mref);
  if (!snap.exists()) throw new Error(`Module ${moduleId} not found in ${lessonId}`);
  await updateDoc(mref, {
    mdxPath,
    mdxVersion: Date.now(),
    updatedAt: serverTimestamp(),
  });
}
