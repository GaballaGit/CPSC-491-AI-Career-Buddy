import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "../app.js";
import { seedDatabase } from "../database/migrations.js";

let server: Server;
let baseUrl: string;

before(async () => {
  await seedDatabase();
  server = app.listen(0);
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => server.close());

describe("job retrieval API", () => {
  it("lists seeded jobs", async () => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const body = (await response.json()) as { success: boolean; data: { id: string }[] };

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 12);
  });

  it("retrieves one job with required skills", async () => {
    const listResponse = await fetch(`${baseUrl}/api/jobs?limit=1`);
    const list = (await listResponse.json()) as { data: { id: string }[] };
    const response = await fetch(`${baseUrl}/api/jobs/${list.data[0]!.id}`);
    const body = (await response.json()) as { success: boolean; data: { required_skills: { name: string }[] } };

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.required_skills.length > 0);
  });

  it("returns not found for an unknown job", async () => {
    const response = await fetch(`${baseUrl}/api/jobs/not-a-real-job`);
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "RESOURCE_NOT_FOUND");
  });
});
