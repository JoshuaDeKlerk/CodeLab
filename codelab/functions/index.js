/* eslint-env node */
/* global require, exports, process */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

setGlobalOptions({ region: "europe-west1" });

// IMPORTANT: use the *bucket name*, not the web download hostname.
initializeApp({
  storageBucket:
    process.env.GCLOUD_STORAGE_BUCKET ||
    `${process.env.GCLOUD_PROJECT}.appspot.com`,
});

const db = getFirestore();
const bucket = getStorage().bucket();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Preferred models (fallback-friendly)
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro-002",
];

exports.ping = onCall(() => "pong");

// Try each Gemini model until one works
async function generateJsonWithGemini(apiKey, prompt) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastErr;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() ?? "";
      if (!text.trim()) throw new Error("Empty response body");
      return { modelName, text };
    } catch (e) {
      lastErr = e;
      const asJson = JSON.stringify(e, Object.getOwnPropertyNames(e));
      logger.warn("Gemini model failed; trying next", {
        modelName,
        message: e?.message,
        status: e?.status,
        name: e?.name,
        full: asJson?.slice(0, 1500),
      });
    }
  }
  const dump = JSON.stringify(lastErr, Object.getOwnPropertyNames(lastErr));
  logger.error("All Gemini models failed", { full: dump?.slice(0, 4000) });
  throw new HttpsError(
    "failed-precondition",
    "Gemini API call failed. Check GEMINI_API_KEY, API enablement, and billing."
  );
}

exports.generateJourney = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  try {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Login required.");

    const { topic: rawTopic, dryRun, noGemini } = request.data || {};
    const topic = String(rawTopic ?? "").trim() || "Full-Stack Foundations";

    const journeyRef = db.doc(`users/${uid}/journeys/default`);
    if ((await journeyRef.get()).exists) {
      throw new HttpsError(
        "already-exists",
        "You already have a journey. Reset it before generating a new one."
      );
    }

    const now = FieldValue.serverTimestamp();

    // ===== DIAGNOSTIC =====
    if (dryRun === true) {
      await journeyRef.set({ id: "default", topic, createdAt: now, worldCount: 0 });
      return { ok: true, journeyId: "default", worldIds: [], mode: "dryRun" };
    }

    // ===== FAKE: world + lessons + modules (NO module content/jsonPath) =====
    const FAKE = {
      topic,
      worlds: [
        {
          id: "W1",
          number: 1,
          title: "FOUNDATION WORLD",
          blurb: "Kick off your journey with the basics you’ll build on later.",
          icons: ["html", "css", "js"],
          accent: "#4DA3FF",
          lessons: [
            {
              id: "L1-1",
              order: 1,
              title: "Welcome to Web",
              subtitle: "What the web is and how pages work",
              text: "Start here: how browsers render documents and why HTML matters.",
              xpTotal: 100, stepsTotal: 4, badge: "html", accent: "#4DA3FF",
              modules: [
                { id: "intro",     title: "Introduction",      order: 1, xp: 10 },
                { id: "browsers",  title: "How Browsers Work", order: 2, xp: 10 },
              ],
            },
            {
              id: "L1-2",
              order: 2,
              title: "HTML Essentials",
              subtitle: "Elements, tags, attributes",
              text: "Learn the building blocks that structure every page you visit.",
              xpTotal: 120, stepsTotal: 5, badge: "html", accent: "#4DA3FF",
              modules: [
                { id: "elements",   title: "Elements & Tags", order: 1, xp: 10 },
                { id: "attributes", title: "Attributes",      order: 2, xp: 10 },
              ],
            },
          ],
        },
      ],
    };

    // ===== CONTENT SOURCE (modules have no content) =====
    let journey;
    if (noGemini === true) {
      journey = FAKE;
    } else {
      const prompt = `
Return STRICT JSON for one learning world with lessons and modules.
Modules should include ONLY metadata (id, title, order, xp). DO NOT include content or storage paths.

type Journey = {
  topic: string;
  worlds: Array<{
    id: "W1";
    number: 1;
    title: "FOUNDATION WORLD";
    blurb: string;
    icons: ("html"|"css"|"js"|"react"|"all")[];
    accent: string;
    lessons: Array<{
      id: string; order: number; title: string; subtitle: string; text: string;
      xpTotal: number; stepsTotal: number; badge: "html"|"css"|"js"|"all"; accent?: string;
      modules: Array<{ id: string; title: string; order: number; xp: number }>;
    }>;
  }>;
};

Constraints:
- Topic: "${topic}"
- 2–4 lessons; each lesson has 2–3 modules.
- Keep strings concise, student-friendly.
- Return ONLY valid JSON.
`.trim();

      const apiKey = GEMINI_API_KEY.value();
      if (!apiKey) throw new HttpsError("failed-precondition", "GEMINI_API_KEY missing");

      const r = await generateJsonWithGemini(apiKey, prompt);
      logger.info("Gemini model used", { model: r.modelName });
      const text = r.text;

      try {
        journey = JSON.parse(text);
      } catch (e) {
        logger.error("JSON parse failed", { preview: (text || "").slice(0, 1000) });
        throw new HttpsError("internal", "AI returned invalid JSON.");
      }
    }

    // ===== WRITES: Journey + world + lessons + modules (NO Storage writes) =====
    const batch = db.batch();

    batch.set(journeyRef, {
      id: "default",
      topic,
      createdAt: now,
      worldCount: (journey.worlds || []).length,
    });

    const worldIds = [];

    for (const w of journey.worlds || []) {
      const wRef = journeyRef.collection("worlds").doc(w.id);
      worldIds.push(w.id);
      batch.set(wRef, {
        id: w.id,
        number: w.number,
        title: w.title,
        blurb: w.blurb,
        icons: w.icons || ["html", "css", "js"],
        accent: w.accent || "#4DA3FF",
        createdAt: now,
        updatedAt: now,
      });

      for (const l of w.lessons || []) {
        const lRef = wRef.collection("lessons").doc(l.id);
        batch.set(lRef, {
          id: l.id,
          worldId: w.id,
          order: l.order,
          title: l.title,
          subtitle: l.subtitle,
          text: l.text,
          xpTotal: l.xpTotal ?? 100,
          stepsTotal: l.stepsTotal ?? 6,
          accent: l.accent || w.accent || "#4DA3FF",
          badge: l.badge || "html",
          createdAt: now,
          updatedAt: now,
        });

        for (const m of l.modules || []) {
          const mRef = lRef.collection("modules").doc(m.id);
          // NOTE: No jsonPath and no Storage writes
          batch.set(mRef, {
            id: m.id,
            title: m.title,
            order: m.order,
            xp: m.xp ?? 10,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    await batch.commit();
    return {
      ok: true,
      journeyId: "default",
      worldIds,
      mode: noGemini ? "fake" : "gemini",
    };
  } catch (err) {
    logger.error("generateJourney failed", {
      code: err?.code,
      message: err?.message,
      err: String(err),
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Internal error in generateJourney.");
  }
});

exports.resetJourney = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");

  const journeyRef = db.doc(`users/${uid}/journeys/default`);
  await db.recursiveDelete(journeyRef);

  // No module files were created, but keep cleanup in case.
  const prefix = `journeys/${uid}/default/`;
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((f) => f.delete()));

  return { ok: true, cleared: true };
});
