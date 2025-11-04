/* eslint-env node */
/* global require, exports, process */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// ============ Global config ============
setGlobalOptions({
  region: "europe-west1",
  timeoutSeconds: 300,
  memory: "1GiB",
});

// Resolve bucket name (supports explicit env override via MODULE_BUCKET)
function resolveBucketName() {
  if (process.env.MODULE_BUCKET && process.env.MODULE_BUCKET.trim()) {
    return process.env.MODULE_BUCKET.trim();
  }
  try {
    const cfg = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
    if (cfg.storageBucket) return cfg.storageBucket;
  } catch (e) {
    logger.warn("FIREBASE_CONFIG parse failed; falling back", { message: e?.message });
  }
  const proj =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT;
  if (!proj) return "";
  return `${proj}.appspot.com`;
}

const CONTENT_BUCKET = resolveBucketName();

logger.info("Cold start — bucket resolution", {
  CONTENT_BUCKET,
  FIREBASE_CONFIG: process.env.FIREBASE_CONFIG ? "present" : "missing",
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || null,
});

// Firebase Admin init
initializeApp({ storageBucket: CONTENT_BUCKET || undefined });
const db = getFirestore();

// Lazy bucket getter
let _bucket = null;
function getBucket() {
  if (!_bucket) {
    const name = CONTENT_BUCKET || undefined;
    _bucket = getStorage().bucket(name);
  }
  return _bucket;
}

// Secrets
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Storage helper
async function putJson(path, data) {
  const bucket = getBucket();
  if (!bucket || !bucket.name) {
    logger.error("Bucket not configured or missing name", {
      resolvedName: bucket && bucket.name,
      CONTENT_BUCKET,
    });
    throw new HttpsError("failed-precondition", "Storage bucket is not configured.");
  }
  const file = bucket.file(path);
  try {
    await file.save(JSON.stringify(data, null, 2), {
      contentType: "application/json",
      resumable: false,
    });
    return `gs://${bucket.name}/${path}`;
  } catch (e) {
    logger.error("Storage write failed", {
      bucket: bucket.name,
      path,
      code: e?.code,
      message: e?.message,
      status: e?.status,
      name: e?.name,
      stack: e?.stack?.slice(0, 1200),
    });
    throw new HttpsError("internal", "Could not write module JSON to Storage.");
  }
}

// ============ Gemini helper ============
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro-002",
];

async function generateJsonWithGemini(apiKey, prompt) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastErr;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          topP: 0.9,
          topK: 40,
        },
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
  logger.error("All Gemini models failed", { full: dump?.slice(0, 3000) });
  throw new HttpsError(
    "failed-precondition",
    "Gemini API call failed. Check GEMINI_API_KEY, API enablement, and billing."
  );
}

// ============ Sanitizers ============
const ACCENT = "#4DA3FF";
const WORLD_MIN = 3, WORLD_MAX = 5;
const LESSON_MIN = 3, LESSON_MAX = 6;
const MODULE_MIN = 5, MODULE_MAX = 10;

const ALLOWED_TECH = new Set([
  "html","css","js","typescript","react","nextjs","node","express",
  "python","django","flask","java","kotlin","swift","csharp","dotnet",
  "sql","postgres","mongodb","git","linux","docker","aws","firebase",
  "uiux","testing","security","ml","ai","data","all"
]);

function clamp(n, lo, hi) { n = Number(n || 0); return Math.max(lo, Math.min(hi, n)); }
function toWorldId(i) { return `W${i + 1}`; }
function isWorldId(x) { return /^W\d+$/.test(String(x)); }
function toLessonId(worldNumber, idx) { return `L${worldNumber}-${idx + 1}`; }
function isLessonId(x) { return /^L\d+-\d+$/.test(String(x)); }
function uniqBy(arr, keyFn) {
  const seen = new Set(); const out = [];
  for (const it of arr) { const k = keyFn(it); if (seen.has(k)) continue; seen.add(k); out.push(it); }
  return out;
}
function pickIcons(list) {
  const arr = Array.isArray(list) ? list.filter(x => ALLOWED_TECH.has(x)) : [];
  return arr.slice(0, 4);
}

function sanitizeJourney(j) {
  if (!j || typeof j !== "object") throw new Error("Bad journey");
  const topic = String(j.topic || "").slice(0, 160);

  let worlds = Array.isArray(j.worlds) ? j.worlds : [];
  if (worlds.length < WORLD_MIN) worlds = worlds.concat(new Array(WORLD_MIN - worlds.length).fill({}));
  if (worlds.length > WORLD_MAX) worlds = worlds.slice(0, WORLD_MAX);

  worlds = worlds.map((w, i) => {
    const number = i + 1;
    const id = isWorldId(w?.id) ? w.id : toWorldId(i);

    let lessons = Array.isArray(w?.lessons) ? w.lessons : [];
    if (lessons.length < LESSON_MIN) lessons = lessons.concat(new Array(LESSON_MIN - lessons.length).fill({}));
    if (lessons.length > LESSON_MAX) lessons = lessons.slice(0, LESSON_MAX);

    lessons = lessons.map((l, jdx) => {
      const lid = isLessonId(l?.id) ? l.id : toLessonId(number, jdx);
      const order = clamp(l?.order ?? (jdx + 1), 1, 9999);
      const title = String(l?.title || `Lesson ${order}`).slice(0, 80);
      const subtitle = String(l?.subtitle || "").slice(0, 140);
      const text = String(l?.text || "").slice(0, 240);
      const xpTotal = clamp(l?.xpTotal ?? 120, 80, 180);
      const stepsTotal = clamp(l?.stepsTotal ?? 6, 4, 8);
      const badge = ALLOWED_TECH.has(String(l?.badge)) ? String(l.badge) : "all";

      let modules = Array.isArray(l?.modules) ? l.modules : [];
      if (modules.length < MODULE_MIN) modules = modules.concat(new Array(MODULE_MIN - modules.length).fill({}));
      if (modules.length > MODULE_MAX) modules = modules.slice(0, MODULE_MAX);

      modules = modules.map((m, k) => {
        const mid = String(m?.id || `m${k + 1}`).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 64);
        const morder = clamp(m?.order ?? (k + 1), 1, 9999);
        const mtitle = String(m?.title || `Module ${morder}`).slice(0, 100);
        const xp = clamp(m?.xp ?? 10, 5, 25);
        return { id: mid || `m${k + 1}`, title: mtitle, order: morder, xp };
      });

      modules = uniqBy(modules.sort((a, b) => a.order - b.order), m => m.id);

      return {
        id: lid,
        order,
        title,
        subtitle,
        text,
        xpTotal,
        stepsTotal,
        badge,
        accent: ACCENT,
        modules
      };
    });

    lessons = uniqBy(lessons.sort((a, b) => a.order - b.order), l => l.id);

    const blurb = String(w?.blurb || "").slice(0, 220);
    const titleWorld = String(w?.title || `World ${number}`).slice(0, 80);
    const icons = pickIcons(w?.icons && w.icons.length ? w.icons : ["html","css","js"]);

    return {
      id,
      number,
      title: titleWorld,
      blurb,
      icons,
      accent: ACCENT,
      lessons
    };
  });

  worlds = worlds.map((w, i) => ({
    ...w,
    id: toWorldId(i),
    number: i + 1,
    accent: ACCENT
  }));

  return { topic, worlds };
}

function sanitizeModuleContent(content, fallbackTitle, badge) {
  const allowed = new Set(["h1","h2","h3","p","ul","ol","code"]);
  const clampStr = (s, n) => String(s || "").slice(0, n);

  let blocks = Array.isArray(content?.blocks) ? content.blocks : [];
  blocks = blocks.slice(0, 10).map((b) => {
    const type = allowed.has(b?.type) ? b.type : "p";
    const out = { type };
    if (type === "code") {
      out.text = clampStr(b?.text, 800).replace(/```/g, "");
    } else if (type === "ul" || type === "ol") {
      const items = Array.isArray(b?.items) ? b.items : [];
      out.items = items.slice(0, 6).map(x => clampStr(x, 120)).filter(x => x);
    } else {
      out.text = clampStr(b?.text, 300);
    }
    return out;
  });

  const title = clampStr(content?.title || fallbackTitle || "Untitled", 90);
  if (!blocks.length || !["h1","h2"].includes(blocks[0].type)) {
    blocks.unshift({ type: "h2", text: title });
  } else if (!blocks[0].text) {
    blocks[0].text = title;
  }

  let codeSeen = false;
  blocks = blocks.filter((b) => {
    if (b.type === "code") {
      if (codeSeen) return false;
      codeSeen = true;
      if (!b.text || b.text.trim().length < 3) {
        switch (badge) {
          case "html":   b.text = "<p>Hello, world!</p>"; break;
          case "css":    b.text = "p { font-weight: bold; }"; break;
          case "js":     b.text = "const msg = 'Hello';\nconsole.log(msg);"; break;
          case "python": b.text = "msg = 'Hello'\nprint(msg)"; break;
          case "react":  b.text = "function Hello(){ return <h1>Hello</h1>; }\nexport default Hello;"; break;
          case "node":   b.text = "console.log('Node ready');"; break;
          case "sql":    b.text = "SELECT 1 AS ready;"; break;
          default:       return false;
        }
      }
    }
    if (b.type === "ul" || b.type === "ol") return Array.isArray(b.items) && b.items.length > 0;
    if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") return !!(b.text && b.text.trim().length);
    return true;
  });

  if (blocks.length < 6) while (blocks.length < 6) blocks.push({ type: "p", text: "Recap: practice this concept with a small example." });
  if (blocks.length > 10) blocks = blocks.slice(0, 10);

  return { title, blocks };
}

// Health check
exports.ping = onCall(() => "pong");

// Generate the Journey (Gemini only)
exports.generateJourney = onCall({ secrets: [GEMINI_API_KEY], timeoutSeconds: 540, memory: "2GiB" }, async (request) => {
  try {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Login required.");

    const { topic: rawTopic } = request.data || {};
    const topic = String(rawTopic ?? "").trim() || "Full-Stack Foundations";

    const journeyRef = db.doc(`users/${uid}/journeys/default`);
    if ((await journeyRef.get()).exists) {
      throw new HttpsError("already-exists", "You already have a journey. Reset it before generating a new one.");
    }

    const now = FieldValue.serverTimestamp();

    const prompt = `
You are an expert curriculum designer generating STRICT JSON only.

TASK
Create a beginner-friendly learning journey with 3–5 WORLDS.
- Each world has 3–6 lessons.
- Each lesson has 5–10 modules (metadata only).

OUTPUT JSON SHAPE (no extra fields, no comments):
{
  "topic": string,
  "worlds": [
    {
      "id": string,
      "number": number,
      "title": string,
      "blurb": string,
      "icons": (
        "html"|"css"|"js"|"typescript"|"react"|"nextjs"|"node"|"express"|
        "python"|"django"|"flask"|"java"|"kotlin"|"swift"|"csharp"|"dotnet"|
        "sql"|"postgres"|"mongodb"|"git"|"linux"|"docker"|"aws"|"firebase"|
        "uiux"|"testing"|"security"|"ml"|"ai"|"data"
      )[],
      "accent": "#4DA3FF",
      "lessons": [
        {
          "id": string,
          "order": number,
          "title": string,
          "subtitle": string,
          "text": string,
          "xpTotal": number,
          "stepsTotal": number,
          "badge": (
            "html"|"css"|"js"|"typescript"|"react"|"nextjs"|"node"|"express"|
            "python"|"django"|"flask"|"java"|"kotlin"|"swift"|"csharp"|"dotnet"|
            "sql"|"postgres"|"mongodb"|"git"|"linux"|"docker"|"aws"|"firebase"|
            "uiux"|"testing"|"security"|"ml"|"ai"|"data"|"all"
          ),
          "accent": "#4DA3FF",
          "modules": [
            { "id": string, "title": string, "order": number, "xp": number }
          ]
        }
      ]
    }
  ]
}

CONSTRAINTS
- Topic: "${topic}"
- Generate 3–5 worlds. World ids must be "W1","W2","W3",... and numbers must match.
- All accents (world + lesson) MUST be "#4DA3FF".
- Each world: 1–4 icons from the allowed set, relevant to the content.
- Each lesson: badge from allowed set and matches lesson focus.
- Lesson ids: "L{worldNumber}-{lessonIndex}", unique within world; orders strictly ascending.
- Modules: 5–10 per lesson; orders strictly ascending; no duplicate ids/titles within a lesson.
- Keep strings short and student-friendly. Ensure module xp sums ≈ xpTotal (±20%).
- Return ONLY valid JSON (no prose, markdown, or trailing commas).

QUALITY RUBRIC
- Counts respected; ids/orders consistent; icons relevant; titles specific; subtitles outcome-based.
- XP sums roughly match xpTotal.
`.trim();

    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) throw new HttpsError("failed-precondition", "GEMINI_API_KEY missing");

    const r = await generateJsonWithGemini(apiKey, prompt);
    logger.info("Gemini model used (generateJourney)", { model: r.modelName });

    let journey;
    try {
      const parsed = JSON.parse(r.text || "");
      journey = sanitizeJourney(parsed);
    } catch (e) {
      logger.error("JSON parse/sanitize failed (generateJourney)", {
        preview: (r.text || "").slice(0, 1000),
        message: e?.message,
      });
      throw new HttpsError("internal", "AI returned invalid or unsanitized JSON.");
    }

    const batch = db.batch();
    batch.set(journeyRef, {
      id: "default",
      topic: journey.topic,
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
        icons: (w.icons || []).filter(x => ALLOWED_TECH.has(x)),
        accent: ACCENT,
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
          xpTotal: l.xpTotal,
          stepsTotal: l.stepsTotal,
          accent: ACCENT,
          badge: ALLOWED_TECH.has(l.badge) ? l.badge : "all",
          createdAt: now,
          updatedAt: now,
        });

        for (const m of l.modules || []) {
          const mRef = lRef.collection("modules").doc(m.id);
          batch.set(mRef, {
            id: m.id,
            title: m.title,
            order: m.order,
            xp: m.xp,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    await batch.commit();
    return { ok: true, journeyId: "default", worldIds };
  } catch (err) {
    logger.error("generateJourney failed", { code: err?.code, message: err?.message, err: String(err) });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Internal error in generateJourney.");
  }
});

// Reset Journey
exports.resetJourney = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");

  const journeyRef = db.doc(`users/${uid}/journeys/default`);
  await db.recursiveDelete(journeyRef);

  const prefix = `journeys/${uid}/default/`;
  try {
    const [files] = await getBucket().getFiles({ prefix });
    await Promise.all(files.map((f) => f.delete()));
  } catch (e) {
    logger.warn("Storage cleanup warning", {
      bucket: getBucket() && getBucket().name,
      prefix,
      code: e?.code,
      message: e?.message,
    });
  }

  return { ok: true, cleared: true };
});

// Generate Module Content
exports.generateModule = onCall({ secrets: [GEMINI_API_KEY], timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");

  const { worldId = "W1", lessonId, moduleId } = request.data || {};
  if (!lessonId || !moduleId) {
    throw new HttpsError("invalid-argument", "lessonId and moduleId are required.");
  }

  const journeyRef = db.doc(`users/${uid}/journeys/default`);
  const worldRef   = journeyRef.collection("worlds").doc(worldId);
  const lessonRef  = worldRef.collection("lessons").doc(lessonId);
  const moduleRef  = lessonRef.collection("modules").doc(moduleId);

  const [journeySnap, worldSnap, lessonSnap, moduleSnap] = await Promise.all([
    journeyRef.get(), worldRef.get(), lessonRef.get(), moduleRef.get(),
  ]);

  if (!journeySnap.exists) throw new HttpsError("failed-precondition", "No journey.");
  if (!worldSnap.exists)   throw new HttpsError("not-found", "World not found.");
  if (!lessonSnap.exists)  throw new HttpsError("not-found", "Lesson not found.");
  if (!moduleSnap.exists)  throw new HttpsError("not-found", "Module not found.");

  const moduleData = moduleSnap.data() || {};
  if (moduleData.jsonPath) {
    return { ok: true, status: "ready", jsonPath: moduleData.jsonPath };
  }
  if (moduleData.contentStatus === "generating") {
    const startedAt = moduleData.startedAt?.toDate?.() || new Date(0);
    const ageMs = Date.now() - startedAt.getTime();
    if (ageMs < 2 * 60 * 1000) {
      return { ok: true, status: "generating" };
    }
    logger.warn("Stale generation detected; taking over", { moduleId, lessonId, worldId, ageMs });
  }

  await moduleRef.update({
    contentStatus: "generating",
    startedAt: FieldValue.serverTimestamp(),
    lastError: FieldValue.delete()
  }).catch((e) => {
    logger.warn("Could not set generating", { message: e?.message });
  });

  const topic  = journeySnap.data()?.topic || "Full-Stack Foundations";
  const world  = worldSnap.data();
  const lesson = lessonSnap.data();

  let succeeded = false;
  try {
    const prompt = `
You are generating SHORT, accurate module content as STRICT JSON only.

INPUT CONTEXT
Topic: ${JSON.stringify(topic)}
World: ${JSON.stringify({ id: world.id, title: world.title })}
Lesson: ${JSON.stringify({
  id: lesson.id,
  title: lesson.title,
  subtitle: lesson.subtitle,
  badge: lesson.badge,
})}
ModuleMeta: ${JSON.stringify({ id: moduleId, title: moduleData.title })}

STUDENT LEVEL
- Absolute beginner. Explain plainly. One idea per sentence. Concrete examples.

SCOPE GUARDRAILS
- Stay aligned to the Lesson/Module titles and the lesson.badge tech.
- If badge ∈ {"html","css","js","python","react","node","sql"} prefer examples in that tech.
- If badge is "all" or the module is conceptual, omit the code block.
- No frameworks or libraries unless implied by badge.
- Keep examples minimal and standard. No external files, no network calls, no non-standard APIs.
- No external links, no images, no citations, no references to AI.

OUTPUT JSON SHAPE (no extra fields, no comments):
{
  "title": string,
  "blocks": [
    {
      "type": "h1"|"h2"|"h3"|"p"|"ul"|"ol"|"code",
      "text"?: string,
      "items"?: string[]
    }
  ]
}

CONTENT GUIDELINES
- 6–10 blocks total.
- Recommended structure:
  1) h2 — restate the key skill
  2) p  — why it matters
  3) ul — key concepts (3–5)
  4) code — one short example if relevant
  5) ol — mini task (3–5 steps)
  6) p  — common pitfall
  7) p/ul — recap or next action
- Exactly one "code" block at most. If not clearly helpful, omit it.
- Use present tense, active voice. Avoid filler.
- No markdown backticks.

VALIDATION RULES
- 6–10 blocks.
- First block h1/h2.
- If code exists, it matches lesson.badge tech.
- No links/images/backticks/extra fields.

RETURN ONLY JSON.
`.trim();

    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) throw new HttpsError("failed-precondition", "GEMINI_API_KEY missing");

    const r = await generateJsonWithGemini(apiKey, prompt);
    logger.info("Gemini model used (generateModule)", { model: r.modelName });

    let content;
    try {
      content = JSON.parse(r.text || "{}");
    } catch (e) {
      logger.error("generateModule JSON parse failed", {
        preview: (r.text || "").slice(0, 1000),
        message: e?.message,
        name: e?.name,
        stack: e?.stack?.slice(0, 1200),
      });
      throw new HttpsError("internal", "AI returned invalid JSON.");
    }


    const safe = sanitizeModuleContent(content, moduleData.title || moduleId, lesson.badge);

    const jsonRelPath = `journeys/${uid}/default/worlds/${world.id}/lessons/${lesson.id}/modules/${moduleId}.json`;
    const gsUrl = await putJson(jsonRelPath, safe);

    await moduleRef.update({
      jsonPath: gsUrl,
      contentStatus: "ready",
      updatedAt: FieldValue.serverTimestamp(),
    });

    succeeded = true;
    return { ok: true, status: "ready", jsonPath: gsUrl };
  } catch (err) {
    logger.error("generateModule failed", { message: err?.message, code: err?.code });
    await moduleRef.update({
      contentStatus: "error",
      lastError: String(err?.message || err),
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Internal error in generateModule.");
  } finally {
    if (!succeeded) {
      await moduleRef.update({
        contentStatus: "error",
        lastError: "Generation did not complete (timeout or abort).",
        updatedAt: FieldValue.serverTimestamp(),
      }).catch(() => {});
    }
  }
});
