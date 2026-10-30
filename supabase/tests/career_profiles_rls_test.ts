// C40CS-69: database-level RLS regression for career_profiles (SOC 2 CC6.1).
//
// Runs against a local Supabase only. The test creates two synthetic users,
// talks to the Data API with each user's JWT, and deletes both users at the
// end. To run it locally (needs Docker and the Supabase CLI):
//
//   supabase start
//   eval "$(supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
//   export API_URL ANON_KEY SERVICE_ROLE_KEY
//   deno test --allow-env --allow-net supabase/tests/career_profiles_rls_test.ts

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

// Postgres error code PostgREST returns when a row fails an RLS check.
const RLS_VIOLATION = "42501";

const password = "C40CS-69-Test-Password-123!";
const runId = crypto.randomUUID();
const userAEmail = `c40cs69-user-a-${runId}@example.com`;
const userBEmail = `c40cs69-user-b-${runId}@example.com`;

const profilesUrl = `${API_URL}/rest/v1/career_profiles`;

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

// Signed-in requests use the user's JWT. Anonymous requests send the anon key
// as the bearer token, which is what a signed-out browser client does.
function headersFor(accessToken: string): HeadersInit {
  return {
    "apikey": ANON_KEY!,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

function profileFor(userId: string, targetCareer: string) {
  return {
    user_id: userId,
    target_career: targetCareer,
    experience_level: "beginner",
    skills: ["SQL"],
    learning_preferences: ["videos"],
    weekly_availability_hours: 5,
  };
}

async function assertRlsRejected(response: Response, message: string) {
  const body = await response.json();

  assert(
    response.status >= 400,
    `${message} (status ${response.status})`,
  );
  assertEquals(body.code, RLS_VIOLATION, `${message}: wrong error code`);
}

async function readProfile(userId: string, accessToken: string) {
  const response = await fetch(`${profilesUrl}?user_id=eq.${userId}`, {
    headers: headersFor(accessToken),
  });

  assertEquals(response.status, 200, "Profile read request failed");

  return await response.json();
}

Deno.test("career_profiles RLS blocks cross-user and anonymous access at the database level", async () => {
  let userAId: string | undefined;
  let userBId: string | undefined;

  try {
    userAId = await adminCreateUser(userAEmail);
    userBId = await adminCreateUser(userBEmail);

    const userAToken = await signIn(userAEmail);
    const userBToken = await signIn(userBEmail);

    // user_id is UNIQUE, so these ownership checks run before User A has a
    // row. Otherwise a unique-constraint error could hide a missing policy.

    // User B cannot insert a profile claiming User A's user_id.
    await assertRlsRejected(
      await fetch(profilesUrl, {
        method: "POST",
        headers: headersFor(userBToken),
        body: JSON.stringify(profileFor(userAId, "Fake Ownership")),
      }),
      "RLS allowed User B to insert a profile owned by User A",
    );

    // An anonymous client cannot insert a profile for User A.
    await assertRlsRejected(
      await fetch(profilesUrl, {
        method: "POST",
        headers: headersFor(ANON_KEY!),
        body: JSON.stringify(profileFor(userAId, "Anonymous Write")),
      }),
      "RLS allowed an anonymous client to insert a profile",
    );

    // User B cannot move their own profile to User A.
    const userBCreateResponse = await fetch(profilesUrl, {
      method: "POST",
      headers: headersFor(userBToken),
      body: JSON.stringify(profileFor(userBId, "User B Career")),
    });

    assertEquals(
      userBCreateResponse.status,
      201,
      "User B could not create their own profile",
    );
    await userBCreateResponse.body?.cancel();

    await assertRlsRejected(
      await fetch(`${profilesUrl}?user_id=eq.${userBId}`, {
        method: "PATCH",
        headers: headersFor(userBToken),
        body: JSON.stringify({ user_id: userAId }),
      }),
      "RLS allowed User B to reassign their profile to User A",
    );

    // User A can create, read and update their own profile.
    const userACreateResponse = await fetch(profilesUrl, {
      method: "POST",
      headers: headersFor(userAToken),
      body: JSON.stringify(profileFor(userAId, "User A Career")),
    });

    const createdRows = await userACreateResponse.json();

    assertEquals(
      userACreateResponse.status,
      201,
      "User A could not create their own profile",
    );
    assertEquals(createdRows.length, 1, "Expected one created profile");

    const ownerRows = await readProfile(userAId, userAToken);

    assertEquals(ownerRows.length, 1, "Owner should see their profile");

    const ownerUpdateResponse = await fetch(
      `${profilesUrl}?user_id=eq.${userAId}`,
      {
        method: "PATCH",
        headers: headersFor(userAToken),
        body: JSON.stringify({ target_career: "Data Analyst" }),
      },
    );

    const ownerUpdateRows = await ownerUpdateResponse.json();

    assertEquals(ownerUpdateResponse.status, 200, "Owner update failed");
    assertEquals(ownerUpdateRows.length, 1, "Owner update changed no rows");

    // User B cannot read User A's profile.
    const crossReadRows = await readProfile(userAId, userBToken);

    assertEquals(
      crossReadRows.length,
      0,
      "RLS allowed User B to read User A's profile",
    );

    // An anonymous client cannot read any profile.
    const anonymousReadResponse = await fetch(profilesUrl, {
      headers: headersFor(ANON_KEY!),
    });

    const anonymousRows = await anonymousReadResponse.json();

    assertEquals(
      anonymousReadResponse.status,
      200,
      "Anonymous read request failed",
    );
    assertEquals(
      anonymousRows.length,
      0,
      "RLS allowed an anonymous client to read profiles",
    );

    // User B and an anonymous client cannot update or delete User A's
    // profile. RLS filters the row out, so each request affects 0 rows.
    for (
      const [who, token] of [
        ["User B", userBToken],
        ["An anonymous client", ANON_KEY!],
      ]
    ) {
      const updateResponse = await fetch(
        `${profilesUrl}?user_id=eq.${userAId}`,
        {
          method: "PATCH",
          headers: headersFor(token),
          body: JSON.stringify({ target_career: "Unauthorized Update" }),
        },
      );

      const updatedRows = await updateResponse.json();

      assertEquals(
        updateResponse.status,
        200,
        `${who} update request returned unexpected status`,
      );
      assertEquals(
        updatedRows.length,
        0,
        `RLS allowed ${who} to update User A's profile`,
      );

      const deleteResponse = await fetch(
        `${profilesUrl}?user_id=eq.${userAId}`,
        {
          method: "DELETE",
          headers: headersFor(token),
        },
      );

      const deletedRows = await deleteResponse.json();

      assertEquals(
        deleteResponse.status,
        200,
        `${who} delete request returned unexpected status`,
      );
      assertEquals(
        deletedRows.length,
        0,
        `RLS allowed ${who} to delete User A's profile`,
      );
    }

    // User A's profile is unchanged after the unauthorized attempts.
    const afterRows = await readProfile(userAId, userAToken);

    assertEquals(afterRows.length, 1, "User A's profile was deleted");
    assertEquals(
      afterRows[0].target_career,
      "Data Analyst",
      "Unauthorized update changed User A's profile",
    );

    // Owner cleanup through the normal Data API.
    const ownerDeleteResponse = await fetch(
      `${profilesUrl}?user_id=eq.${userAId}`,
      {
        method: "DELETE",
        headers: headersFor(userAToken),
      },
    );

    const ownerDeletedRows = await ownerDeleteResponse.json();

    assertEquals(ownerDeleteResponse.status, 200, "Owner delete failed");
    assertEquals(ownerDeletedRows.length, 1, "Owner delete removed no rows");
  } finally {
    if (userAId) {
      await adminDeleteUser(userAId);
    }

    if (userBId) {
      await adminDeleteUser(userBId);
    }
  }
});
