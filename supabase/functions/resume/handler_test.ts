import { deepStrictEqual, strictEqual } from "node:assert";

import type { AuthContext } from "../_shared/auth.ts";
import { HttpError } from "../_shared/http.ts";
import type {
  ResumeSkills,
  ResumeSkillStore,
} from "../_shared/resume/repository.ts";
import { createResumeHandler, type ResumeDeps } from "./handler.ts";

const fixtures = new URL("../_shared/resume/fixtures/", import.meta.url);

// Fake Store - In memory, keyed by user id
function fakeDeps(signedInAs: string | null) {
  const rows = new Map<string, ResumeSkills>();
  const feedbackCalls: Array<{ text: string; targetRole: string | null }> = [];

  const store: ResumeSkillStore = {
    save(userId, filename, skills) {
      rows.set(userId, {
        filename,
        skills,
        updatedAt: "now",
      });

      return Promise.resolve();
    },

    load(userId) {
      return Promise.resolve(rows.get(userId) ?? null);
    },
  };

  const handler = createResumeHandler({
    authenticate: () =>
      Promise.resolve(
        signedInAs
          ? ({
            userId: signedInAs,
            db: null,
          } as unknown as AuthContext)
          : null,
      ),

    store: () => store,

    feedback: (text, targetRole) => {
      feedbackCalls.push({ text, targetRole });
      return Promise.resolve({
        strengths: ["Clear skills section"],
        weaknesses: ["No metrics"],
        missing_skills: ["AWS"],
        suggestions: ["Quantify impact"],
      });
    },

    targetRole: () => Promise.resolve("Backend Engineer"),
  });

  return {
    handler,
    rows,
    feedbackCalls,
  };
}

// Helper - Multipart upload request
async function upload(
  handler: (req: Request) => Promise<Response>,
  name: string,
  bytes?: Uint8Array<ArrayBuffer>,
): Promise<Response> {
  const form = new FormData();

  const data = bytes ?? (await Deno.readFile(new URL(name, fixtures)));

  form.append("file", new File([data], name));

  return handler(
    new Request("http://localhost/resume", {
      method: "POST",
      body: form,
    }),
  );
}

// Helper - GET saved skills
function getSkills(
  handler: (req: Request) => Promise<Response>,
) {
  return handler(
    new Request("http://localhost/resume/skills"),
  );
}

// Helper - GET public deployment health
function getHealth(
  handler: (req: Request) => Promise<Response>,
) {
  return handler(
    new Request("http://localhost/resume/health"),
  );
}

Deno.test("PDF upload returns text and skills, and saves them", async () => {
  const { handler, rows } = fakeDeps("user-a");

  const res = await upload(handler, "sample_resume.pdf");
  const body = await res.json();

  strictEqual(res.status, 200);

  strictEqual(
    body.data.text.startsWith("Alex Rivera"),
    true,
  );

  strictEqual(
    body.data.skills.some(
      (s: { key: string }) => s.key === "python",
    ),
    true,
  );

  strictEqual(
    rows.get("user-a")?.filename,
    "sample_resume.pdf",
  );
});

Deno.test("DOCX upload returns extracted text", async () => {
  const { handler } = fakeDeps("user-a");

  const res = await upload(handler, "sample_resume.docx");
  const body = await res.json();

  strictEqual(res.status, 200);

  strictEqual(
    body.data.text.startsWith("Alex Rivera"),
    true,
  );
});

Deno.test("all protected resume routes reject missing and malformed auth", async () => {
  const routes: Request[] = [
    new Request("http://localhost/resume", {
      method: "POST",
      body: new FormData(),
    }),
    new Request("http://localhost/resume/skills"),
    new Request("http://localhost/resume/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "resume text" }),
    }),
  ];

  for (const template of routes) {
    for (
      const authorization of [undefined, "Basic invalid", "Bearer invalid"]
    ) {
      const { handler } = fakeDeps(null);
      const headers = new Headers(template.headers);
      if (authorization) headers.set("Authorization", authorization);
      const res = await handler(new Request(template.clone(), { headers }));
      const body = await res.json();
      strictEqual(res.status, 401);
      strictEqual(body.error.code, "AUTHENTICATION_REQUIRED");
    }
  }
});

Deno.test("upload while signed out is 401", async () => {
  const { handler, rows } = fakeDeps(null);

  const res = await upload(handler, "sample_resume.pdf");
  const body = await res.json();

  strictEqual(res.status, 401);
  strictEqual(
    body.error.code,
    "AUTHENTICATION_REQUIRED",
  );
  strictEqual(rows.size, 0);
});

Deno.test("TXT upload is rejected with VALIDATION_ERROR", async () => {
  const { handler } = fakeDeps("user-a");

  const res = await upload(handler, "sample_resume.txt");
  const body = await res.json();

  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
  strictEqual(body.error.details[0].field, "file");
});

Deno.test("Oversized file is rejected", async () => {
  const { handler } = fakeDeps("user-a");

  const res = await upload(
    handler,
    "big.pdf",
    new Uint8Array(5 * 1024 * 1024 + 1),
  );

  const body = await res.json();

  strictEqual(res.status, 400);
  strictEqual(
    body.error.message,
    "File is too large.",
  );
});

Deno.test("Missing file is rejected", async () => {
  const { handler } = fakeDeps("user-a");

  const res = await handler(
    new Request("http://localhost/resume", {
      method: "POST",
      body: new FormData(),
    }),
  );

  const body = await res.json();

  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
});

Deno.test("GET skills returns the saved skills", async () => {
  const { handler } = fakeDeps("user-a");

  await (
    await upload(handler, "sample_resume.pdf")
  ).body?.cancel();

  const body = await (
    await getSkills(handler)
  ).json();

  strictEqual(
    body.data.filename,
    "sample_resume.pdf",
  );

  strictEqual(
    body.data.skills.length > 0,
    true,
  );
});

Deno.test("GET skills with no upload returns an empty list", async () => {
  const { handler } = fakeDeps("user-a");

  const body = await (
    await getSkills(handler)
  ).json();

  deepStrictEqual(body.data.skills, []);
});

Deno.test("GET skills never returns another user's data", async () => {
  const { handler, rows } = fakeDeps("user-b");

  rows.set("user-a", {
    filename: "a.pdf",
    skills: [
      {
        name: "Python",
        key: "python",
      },
    ],
    updatedAt: "now",
  });

  const body = await (
    await getSkills(handler)
  ).json();

  deepStrictEqual(body.data.skills, []);
});

Deno.test("GET skills while signed out is 401", async () => {
  const { handler } = fakeDeps(null);

  const res = await getSkills(handler);

  await res.body?.cancel();

  strictEqual(res.status, 401);
});

Deno.test("GET health returns 200 without authentication", async () => {
  const { handler } = fakeDeps(null);

  const res = await getHealth(handler);
  const body = await res.json();

  strictEqual(res.status, 200);

  deepStrictEqual(body.data, {
    status: "ok",
    service: "resume",
  });
});

Deno.test("GET health exposes only public health information", async () => {
  const { handler } = fakeDeps(null);

  const res = await getHealth(handler);
  const body = await res.json();

  deepStrictEqual(
    Object.keys(body.data).sort(),
    ["service", "status"],
  );

  strictEqual(
    JSON.stringify(body).includes("SUPABASE"),
    false,
  );

  strictEqual(
    JSON.stringify(body).includes("token"),
    false,
  );

  strictEqual(
    JSON.stringify(body).includes("secret"),
    false,
  );
});

Deno.test("Other methods are rejected", async () => {
  const { handler } = fakeDeps("user-a");

  const res = await handler(
    new Request("http://localhost/resume", {
      method: "DELETE",
    }),
  );

  await res.body?.cancel();

  strictEqual(res.status, 405);
});

Deno.test("OPTIONS returns CORS headers", async () => {
  const { handler } = fakeDeps(null);

  const res = await handler(
    new Request("http://localhost/resume", {
      method: "OPTIONS",
    }),
  );

  await res.body?.cancel();

  strictEqual(
    res.headers.get("Access-Control-Allow-Origin"),
    "*",
  );
});

// Helper - POST /resume/feedback with a JSON body
function askFeedback(
  handler: (req: Request) => Promise<Response>,
  body: unknown,
) {
  return handler(
    new Request("http://localhost/resume/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

Deno.test("feedback returns the four fields and the target role", async () => {
  const { handler, feedbackCalls } = fakeDeps("user-a");
  const res = await askFeedback(handler, { text: "Python developer" });
  const body = await res.json();
  strictEqual(res.status, 200);
  deepStrictEqual(body.data.missing_skills, ["AWS"]);
  strictEqual(body.data.targetRole, "Backend Engineer");
  deepStrictEqual(feedbackCalls, [
    { text: "Python developer", targetRole: "Backend Engineer" },
  ]);
});

Deno.test("feedback uses a target role from the request first", async () => {
  const { handler, feedbackCalls } = fakeDeps("user-a");
  await (await askFeedback(handler, {
    text: "Python developer",
    targetRole: "Data Analyst",
  })).body?.cancel();
  strictEqual(feedbackCalls[0].targetRole, "Data Analyst");
});

Deno.test("feedback without text is rejected", async () => {
  const { handler, feedbackCalls } = fakeDeps("user-a");
  const res = await askFeedback(handler, { text: "   " });
  const body = await res.json();
  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
  strictEqual(feedbackCalls.length, 0);
});

Deno.test("feedback while signed out is 401", async () => {
  const { handler, feedbackCalls } = fakeDeps(null);
  const res = await askFeedback(handler, { text: "Python developer" });
  await res.body?.cancel();
  strictEqual(res.status, 401);
  strictEqual(feedbackCalls.length, 0);
});

// Error Paths - C40CS-36

// Override Deps - Signed in as user-a, one dependency swapped
function handlerWith(overrides: Partial<ResumeDeps>) {
  return createResumeHandler({
    authenticate: () =>
      Promise.resolve({ userId: "user-a", db: null } as unknown as AuthContext),
    store: () => ({
      save: () => Promise.resolve(),
      load: () => Promise.resolve(null),
    }),
    feedback: () =>
      Promise.resolve({
        strengths: [],
        weaknesses: [],
        missing_skills: [],
        suggestions: [],
      }),
    ...overrides,
  });
}

// Fixture Bytes - Read a file from the fixtures folder
function fixture(name: string) {
  return Deno.readFile(new URL(name, fixtures));
}

Deno.test("upload that is not multipart is rejected", async () => {
  const { handler } = fakeDeps("user-a");
  const res = await handler(
    new Request("http://localhost/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "resume.pdf" }),
    }),
  );
  const body = await res.json();
  strictEqual(res.status, 400);
  strictEqual(body.error.code, "INVALID_REQUEST");
});

Deno.test("file without an extension is rejected", async () => {
  const { handler } = fakeDeps("user-a");
  const res = await upload(
    handler,
    "resume",
    await fixture("sample_resume.pdf"),
  );
  const body = await res.json();
  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
});

Deno.test("corrupt PDF is rejected with a clear 422", async () => {
  const { handler, rows } = fakeDeps("user-a");
  const res = await upload(
    handler,
    "corrupt.pdf",
    new TextEncoder().encode("this is not a pdf"),
  );
  const body = await res.json();
  strictEqual(res.status, 422);
  strictEqual(body.error.code, "UNSUPPORTED_FILE_TYPE");
  strictEqual(rows.size, 0);
});

Deno.test("corrupt DOCX is rejected with a clear 422", async () => {
  const { handler, rows } = fakeDeps("user-a");
  const res = await upload(
    handler,
    "corrupt.docx",
    new TextEncoder().encode("this is not a docx"),
  );
  const body = await res.json();
  strictEqual(res.status, 422);
  strictEqual(body.error.code, "UNSUPPORTED_FILE_TYPE");
  strictEqual(rows.size, 0);
});

Deno.test("empty PDF is rejected with a clear 422", async () => {
  const { handler } = fakeDeps("user-a");
  const res = await upload(handler, "empty.pdf", new Uint8Array(0));
  const body = await res.json();
  strictEqual(res.status, 422);
  strictEqual(body.error.code, "UNSUPPORTED_FILE_TYPE");
});

Deno.test("Word file renamed to .pdf is rejected with a clear 422", async () => {
  const { handler } = fakeDeps("user-a");
  const res = await upload(
    handler,
    "renamed.pdf",
    await fixture("sample_resume.docx"),
  );
  const body = await res.json();
  strictEqual(res.status, 422);
  strictEqual(body.error.code, "UNSUPPORTED_FILE_TYPE");
});

Deno.test("scanned PDF with no text returns NO_TEXT_FOUND", async () => {
  const { handler, rows } = fakeDeps("user-a");
  const res = await upload(handler, "scanned_resume.pdf");
  const body = await res.json();
  strictEqual(res.status, 422);
  strictEqual(body.error.code, "NO_TEXT_FOUND");
  strictEqual(rows.size, 0);
});

Deno.test("storage write failure is a 500 without internal details", async () => {
  const handler = handlerWith({
    store: () => ({
      save: () => Promise.reject(new Error("db connection secret-123 failed")),
      load: () => Promise.resolve(null),
    }),
  });
  const res = await upload(handler, "sample_resume.pdf");
  const text = await res.text();
  strictEqual(res.status, 500);
  strictEqual(JSON.parse(text).error.code, "INTERNAL_SERVER_ERROR");
  strictEqual(text.includes("secret-123"), false);
});

Deno.test("storage read failure is a 500 without internal details", async () => {
  const handler = handlerWith({
    store: () => ({
      save: () => Promise.resolve(),
      load: () => Promise.reject(new Error("db connection secret-123 failed")),
    }),
  });
  const res = await getSkills(handler);
  const text = await res.text();
  strictEqual(res.status, 500);
  strictEqual(text.includes("secret-123"), false);
});

Deno.test("feedback body that is not JSON is rejected", async () => {
  const { handler, feedbackCalls } = fakeDeps("user-a");
  const res = await handler(
    new Request("http://localhost/resume/feedback", {
      method: "POST",
      body: "not json",
    }),
  );
  const body = await res.json();
  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
  strictEqual(feedbackCalls.length, 0);
});

Deno.test("feedback text over 50,000 characters is rejected", async () => {
  const { handler, feedbackCalls } = fakeDeps("user-a");
  const res = await askFeedback(handler, { text: "a".repeat(50_001) });
  const body = await res.json();
  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
  strictEqual(feedbackCalls.length, 0);
});

Deno.test("AI errors keep their status and code", async () => {
  const handler = handlerWith({
    feedback: () =>
      Promise.reject(new HttpError(504, "AI_TIMEOUT", "AI took too long.")),
  });
  const res = await askFeedback(handler, { text: "Python developer" });
  const body = await res.json();
  strictEqual(res.status, 504);
  strictEqual(body.error.code, "AI_TIMEOUT");
});

Deno.test("unexpected AI failure is a 500 without internal details", async () => {
  const handler = handlerWith({
    feedback: () =>
      Promise.reject(new Error("provider key sk-secret rejected")),
  });
  const res = await askFeedback(handler, { text: "Python developer" });
  const text = await res.text();
  strictEqual(res.status, 500);
  strictEqual(text.includes("sk-secret"), false);
});

Deno.test("representative fixtures upload cleanly", async () => {
  const { handler } = fakeDeps("user-a");

  const twoColumn = await (await upload(handler, "two_column_resume.pdf"))
    .json();
  strictEqual(
    twoColumn.data.skills.some((s: { key: string }) => s.key === "react"),
    true,
  );

  const long = await (await upload(handler, "long_resume.pdf")).json();
  strictEqual(long.data.characters > 10_000, true);

  const noSkills = await (await upload(handler, "no_skills_resume.docx"))
    .json();
  deepStrictEqual(noSkills.data.skills, []);
});
