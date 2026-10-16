import { assertEquals } from "jsr:@std/assert@1";

import { validateCreateProject, validateUpdateProject } from "./validate.ts";

const valid = {
  title: "abc",
  description: "description",
  skills_demonstrated: [],
};

Deno.test("project validation rejects non-object input", () => {
  for (const input of [undefined, null, [], "text", 1, false]) {
    assertEquals(validateCreateProject(input), {
      valid: false,
      message: "Request body must be a JSON object.",
    });

    assertEquals(validateUpdateProject(input), {
      valid: false,
      message: "Request body must be a JSON object.",
    });
  }
});

Deno.test("create requires fields in validation order", () => {
  assertEquals(validateCreateProject({}), {
    valid: false,
    field: "title",
    message: "Project title is required.",
  });

  assertEquals(validateCreateProject({ title: "abc" }), {
    valid: false,
    field: "description",
    message: "Project description is required.",
  });

  assertEquals(
    validateCreateProject({
      title: "abc",
      description: "ok",
    }),
    {
      valid: false,
      field: "skills_demonstrated",
      message: "skills_demonstrated must be an array of non-empty strings.",
    },
  );
});

Deno.test("partial updates are permitted", () => {
  assertEquals(
    validateUpdateProject({ status: "completed" }),
    {
      valid: true,
      dto: { status: "completed" },
    },
  );
});

Deno.test("update requires a known project field", () => {
  for (const input of [{}, { user_id: "other" }]) {
    assertEquals(validateUpdateProject(input), {
      valid: false,
      message: "At least one project field must be provided for update.",
    });
  }
});

Deno.test("project input is trimmed and skills are normalized", () => {
  const input = {
    title: " abc ",
    description: " test ",
    skills_demonstrated: [
      "js",
      "JavaScript",
      "My Skill",
    ],
    project_urls: [" arbitrary text "],
    user_id: "other",
    id: "ignored",
  };

  assertEquals(validateCreateProject(input), {
    valid: true,
    dto: {
      title: "abc",
      description: "test",
      skills_demonstrated: [
        "JavaScript",
        "My Skill",
      ],
      project_urls: ["arbitrary text"],
    },
  });
});

Deno.test("project title boundary lengths are accepted", () => {
  for (const length of [3, 100]) {
    const input = {
      ...valid,
      title: "x".repeat(length),
    };

    assertEquals(validateCreateProject(input), {
      valid: true,
      dto: input,
    });
  }
});

Deno.test("empty arrays are valid", () => {
  assertEquals(
    validateUpdateProject({
      skills_demonstrated: [],
      project_urls: [],
    }),
    {
      valid: true,
      dto: {
        skills_demonstrated: [],
        project_urls: [],
      },
    },
  );
});

Deno.test("blank and non-string array entries are rejected", () => {
  for (
    const field of [
      "skills_demonstrated",
      "project_urls",
    ] as const
  ) {
    for (
      const value of [
        [" "],
        [null],
        [1],
        "TypeScript",
        null,
      ]
    ) {
      assertEquals(
        validateUpdateProject({
          [field]: value,
        }),
        {
          valid: false,
          field,
          message: `${field} must be an array of non-empty strings.`,
        },
      );
    }
  }
});
