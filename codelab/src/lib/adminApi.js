import { db } from "./firebase";
import {
  doc, getDoc, getDocs, setDoc, collection, query, where, orderBy, limit,
  serverTimestamp, runTransaction
} from "firebase/firestore";

// get next world number for auto-increment
async function getNextWorldNumber() {
  const q = query(collection(db, "worlds"), orderBy("number", "desc"), limit(1));
  const snap = await getDocs(q);
  return (snap.docs[0]?.data()?.number ?? 0) + 1;
}
const worldIdFromNumber = (n) => `W${n}`;

// get info for next lesson in a world (to auto-assign id/order)
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

// create world with auto id/number if missing
export async function createWorld({ title, blurb, icons = [], accent = "#4DA3FF", number, id }) {
  return runTransaction(db, async (tx) => {
    if (!number) number = await getNextWorldNumber();
    if (!id) id = worldIdFromNumber(number);
    const ref = doc(db, "worlds", id);
    if ((await tx.get(ref)).exists()) throw new Error(`World ${id} already exists`);
    const data = {
      id, number,
      title: title?.trim() || `WORLD ${number}`,
      blurb: blurb?.trim() || "",
      icons, accent,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    tx.set(ref, data);
    return data;
  });
}

// create lesson with auto id/order if missing
export async function createLesson(input) {
  const { worldId } = input;
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
        id, worldId, order,
        title: input.title?.trim() || `Lesson ${order}`,
        subtitle: input.subtitle?.trim() || "",
        text: input.text?.trim() || "",   
        xpTotal: Number(input.xpTotal ?? 100),
        stepsTotal: Number(input.stepsTotal ?? 8),
        lockedUntilLevel: Number(input.lockedUntilLevel ?? 0),
        accent: input.accent || "#4DA3FF",
        badge: input.badge || "html",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    tx.set(lref, data);
    return data;
  });
}
