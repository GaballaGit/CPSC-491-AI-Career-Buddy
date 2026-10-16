function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
    );
  }
}

const API_URL = Deno.env.get("API_URL");
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    "API_URL, ANON_KEY, and SERVICE_ROLE_KEY must be set before running this test.",
  );
}

const password = "C40CS-60-Test-Password-123!";
const runId = crypto.randomUUID();
const userAEmail = `c40cs60-user-a-${runId}@example.com`;
const userBEmail = `c40cs60-user-b-${runId}@example.com`;

async function adminCreateUser(email: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  const body = await response.json();

  assertEquals(response.status, 200, `Failed to create test user ${email}`);
  assert(typeof body.id === "string", `Created user ${email} has no id`);

  return body.id;
}

async function adminDeleteUser(userId: string): Promise<void> {
  await fetch(`${API_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      "apikey": SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

async function signIn(email: string): Promise<string> {
  const response = await fetch(
    `${API_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "apikey": ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const body = await response.json();

  assertEquals(response.status, 200, `Failed to sign in ${email}`);
  assert(
    typeof body.access_token === "string",
    `No access token returned for ${email}`,
  );

  return body.access_token;
}

function userHeaders(accessToken: string): HeadersInit {
  return {
    "apikey": ANON_KEY!,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

Deno.test("projects RLS blocks cross-user access at the database level", async () => {
  let userAId: string | undefined;
  let userBId: string | undefined;
  let projectId: string | undefined;

  try {
    userAId = await adminCreateUser(userAEmail);
    userBId = await adminCreateUser(userBEmail);

    const userAToken = await signIn(userAEmail);
    const userBToken = await signIn(userBEmail);

    const createResponse = await fetch(`${API_URL}/rest/v1/projects`, {
      method: "POST",
      headers: {
        ...userHeaders(userAToken),
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        user_id: userAId,
        title: "User A Project",
        description: "Project owned by User A for C40CS-60 RLS testing.",
        skills_demonstrated: ["TypeScript"],
        project_urls: ["https://example.com/project"],
        status: "completed",
      }),
    });

    const createdProjects = await createResponse.json();

    assertEquals(createResponse.status, 201, "User A could not create project");
    assertEquals(createdProjects.length, 1, "Expected one created project");

    projectId = createdProjects[0].id;
    assert(typeof projectId === "string", "Created project has no id");

    // User A can read their own project.
    const ownerReadResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        headers: userHeaders(userAToken),
      },
    );

    const ownerRows = await ownerReadResponse.json();

    assertEquals(ownerReadResponse.status, 200, "Owner read failed");
    assertEquals(ownerRows.length, 1, "Owner should see their project");

    // User B cannot read User A's project.
    const crossReadResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        headers: userHeaders(userBToken),
      },
    );

    const crossReadRows = await crossReadResponse.json();

    assertEquals(
      crossReadResponse.status,
      200,
      "Cross-user read request failed",
    );
    assertEquals(
      crossReadRows.length,
      0,
      "RLS allowed User B to read User A's project",
    );

    // User B cannot update User A's project.
    const crossUpdateResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        method: "PATCH",
        headers: {
          ...userHeaders(userBToken),
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          title: "Unauthorized Update",
        }),
      },
    );

    const crossUpdateRows = await crossUpdateResponse.json();

    assertEquals(
      crossUpdateResponse.status,
      200,
      "Cross-user update request returned unexpected status",
    );
    assertEquals(
      crossUpdateRows.length,
      0,
      "RLS allowed User B to update User A's project",
    );

    // Verify the unauthorized update changed nothing.
    const afterUpdateResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        headers: userHeaders(userAToken),
      },
    );

    const afterUpdateRows = await afterUpdateResponse.json();

    assertEquals(
      afterUpdateRows[0].title,
      "User A Project",
      "Unauthorized update changed the project",
    );

    // User B cannot delete User A's project.
    const crossDeleteResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        method: "DELETE",
        headers: {
          ...userHeaders(userBToken),
          "Prefer": "return=representation",
        },
      },
    );

    const crossDeleteRows = await crossDeleteResponse.json();

    assertEquals(
      crossDeleteResponse.status,
      200,
      "Cross-user delete request returned unexpected status",
    );
    assertEquals(
      crossDeleteRows.length,
      0,
      "RLS allowed User B to delete User A's project",
    );

    // Verify the unauthorized delete changed nothing.
    const afterDeleteResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        headers: userHeaders(userAToken),
      },
    );

    const afterDeleteRows = await afterDeleteResponse.json();

    assertEquals(
      afterDeleteRows.length,
      1,
      "Unauthorized delete removed User A's project",
    );

    // User B cannot insert a project while claiming User A's user_id.
    const impersonatedInsertResponse = await fetch(
      `${API_URL}/rest/v1/projects`,
      {
        method: "POST",
        headers: {
          ...userHeaders(userBToken),
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          user_id: userAId,
          title: "Fake Ownership",
          description: "User B should not be able to claim User A ownership.",
          skills_demonstrated: [],
          project_urls: [],
          status: "in_progress",
        }),
      },
    );

    assert(
      impersonatedInsertResponse.status >= 400,
      "RLS allowed User B to insert a project owned by User A",
    );

    // Owner cleanup through the normal Data API.
    const ownerDeleteResponse = await fetch(
      `${API_URL}/rest/v1/projects?id=eq.${projectId}`,
      {
        method: "DELETE",
        headers: userHeaders(userAToken),
      },
    );

    assertEquals(
      ownerDeleteResponse.status,
      204,
      "Owner cleanup delete failed",
    );
    projectId = undefined;
  } finally {
    if (userAId) {
      await adminDeleteUser(userAId);
    }

    if (userBId) {
      await adminDeleteUser(userBId);
    }
  }
});
