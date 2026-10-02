import { deepStrictEqual, rejects, strictEqual, throws } from "node:assert";

import { HttpError } from "../http.ts";
import { generateFeedback, type LlmConfig, parseFeedback } from "./feedback.ts";

const config: LlmConfig = {
  apiKey: "test-key",
  baseUrl: "https://llm.test/v1",
  model: "test-model",
  timeoutMs: 50,
};

const valid = {
  strengths: ["Clear project list"],
  weaknesses: ["No metrics"],
  missing_skills: ["AWS"],
  suggestions: ["Add numbers to impact"],
};

// Fake Provider - Returns a chat completion with the given content
function replyWith(content: string, status = 200): typeof fetch {
  return () =>
    Promise.resolve(
      new Response(
        JSON.stringify({ choices: [{ message: { content } }] }),
        { status },
      ),
    );
}

// Helper - Assert the HttpError code
async function expectCode(promise: Promise<unknown>, code: string) {
  await rejects(
    promise,
    (err) => err instanceof HttpError && err.code === code,
  );
}

Deno.test("parses plain JSON", () => {
  deepStrictEqual(parseFeedback(JSON.stringify(valid)), valid);
});

Deno.test("parses JSON inside a code fence and after a think block", () => {
  const raw = "<think>hmm</think>\n```json\n" + JSON.stringify(valid) +
    "\n```";
  deepStrictEqual(parseFeedback(raw), valid);
});

Deno.test("rejects a reply missing a field", () => {
  const { suggestions: _, ...partial } = valid;
  throws(
    () => parseFeedback(JSON.stringify(partial)),
    (err) => err instanceof HttpError && err.code === "AI_INVALID_RESPONSE",
  );
});

Deno.test("rejects non-JSON text", () => {
  throws(() => parseFeedback("Here is some feedback."), HttpError);
});

Deno.test("drops non-string items", () => {
  const raw = JSON.stringify({ ...valid, strengths: ["ok", 3, "  "] });
  deepStrictEqual(parseFeedback(raw).strengths, ["ok"]);
});

Deno.test("valid provider reply returns feedback", async () => {
  const result = await generateFeedback(
    "resume text",
    "Backend Engineer",
    config,
    replyWith(JSON.stringify(valid)),
  );
  deepStrictEqual(result, valid);
});

Deno.test("sends the target role and model to the provider", async () => {
  let sent: { model: string; messages: Array<{ content: string }> } | null =
    null;
  const capture: typeof fetch = (_url, init) => {
    sent = JSON.parse(String(init?.body));
    return replyWith(JSON.stringify(valid))("");
  };
  await generateFeedback("resume text", "Data Analyst", config, capture);
  strictEqual(sent!.model, "test-model");
  strictEqual(sent!.messages[1].content.includes("Data Analyst"), true);
});

Deno.test("missing config is AI_NOT_CONFIGURED", async () => {
  await expectCode(generateFeedback("x", null, null), "AI_NOT_CONFIGURED");
});

Deno.test("provider 500 is AI_UNAVAILABLE", async () => {
  await expectCode(
    generateFeedback("x", null, config, replyWith("oops", 500)),
    "AI_UNAVAILABLE",
  );
});

Deno.test("invalid provider content is AI_INVALID_RESPONSE", async () => {
  await expectCode(
    generateFeedback("x", null, config, replyWith("not json")),
    "AI_INVALID_RESPONSE",
  );
});

Deno.test("slow provider is AI_TIMEOUT", async () => {
  const hang: typeof fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")));
    });
  await expectCode(generateFeedback("x", null, config, hang), "AI_TIMEOUT");
});
