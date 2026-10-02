import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

import { app } from "../app.js";

let server: Server;
let baseUrl: string;
let token: string;

before(async () => {
  token = "resume-user-token";
  process.env.SUPABASE_AUTH_TEST_USERS = JSON.stringify({
    [token]: { id: randomUUID(), email: "resume@careerbuddy.test" },
  });

  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  delete process.env.SUPABASE_AUTH_TEST_USERS;
  server.close();
});

describe("POST /api/resumes", () => {
  it("rejects requests without a signed-in session", async () => {
    const response = await fetch(`${baseUrl}/api/resumes`, { method: "POST" });
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string };
    };

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
  });

  it("uses the shared auth helper before validating the upload", async () => {
    const response = await fetch(`${baseUrl}/api/resumes`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string; details?: Array<{ field: string }> };
    };

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.equal(body.error.details?.[0]?.field, "file");
  });
});
