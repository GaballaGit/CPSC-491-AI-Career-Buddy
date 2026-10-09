import { describe, expect, it } from "vitest";
import {
  validateCreateProject,
  validateUpdateProject,
} from "./projectValidation.js";

const valid = {
  title: "abc",
  description: "description",
  skills_demonstrated: [],
};

describe("project validation", () => {
  for (const validate of [validateCreateProject, validateUpdateProject]) {
    it.each([undefined, null, [], "text", 1, false])(
      `${validate.name} rejects non-object input %j`,
      (input) => {
        expect(validate(input)).toEqual({
          valid: false,
          message: "Request body must be a JSON object.",
        });
      },
    );
  }

  it("requires create fields in order but permits partial updates", () => {
    expect(validateCreateProject({})).toEqual({
      valid: false,
      field: "title",
      message: "Project title is required.",
    });
    expect(validateCreateProject({ title: "abc" })).toEqual({
      valid: false,
      field: "description",
      message: "Project description is required.",
    });
    expect(validateCreateProject({ title: "abc", description: "ok" })).toEqual({
      valid: false,
      field: "skills_demonstrated",
      message: "skills_demonstrated must be an array of non-empty strings.",
    });
    expect(validateUpdateProject({ status: "completed" })).toEqual({
      valid: true,
      dto: { status: "completed" },
    });
  });

  it("requires a known update key, preserving explicit undefined handling", () => {
    for (const input of [{}, { user_id: "other" }]) {
      expect(validateUpdateProject(input)).toEqual({
        valid: false,
        message: "At least one project field must be provided for update.",
      });
    }
    expect(validateUpdateProject({ title: undefined })).toEqual({
      valid: true,
      dto: {},
    });
  });

  it("normalizes both modes identically without mutating input or adding defaults", () => {
    const input = {
      title: " abc ",
      description: " test ",
      skills_demonstrated: ["js", "JavaScript", "My Skill"],
      project_urls: [" arbitrary text "],
      user_id: "other",
      id: "ignored",
    };
    const original = structuredClone(input);
    const expected = {
      valid: true,
      dto: {
        title: "abc",
        description: "test",
        skills_demonstrated: ["JavaScript", "My Skill"],
        project_urls: ["arbitrary text"],
      },
    };
    expect(validateCreateProject(input)).toEqual(expected);
    expect(validateUpdateProject(input)).toEqual(expected);
    expect(input).toEqual(original);
    expect(validateCreateProject(valid)).toEqual({ valid: true, dto: valid });
  });

  it.each([3, 100])("accepts a title of %i characters", (length) => {
    const input = { ...valid, title: "x".repeat(length) };
    expect(validateCreateProject(input)).toEqual({ valid: true, dto: input });
    expect(validateUpdateProject({ title: input.title })).toEqual({
      valid: true,
      dto: { title: input.title },
    });
  });

  it("accepts empty arrays but rejects blank and non-string entries", () => {
    expect(
      validateUpdateProject({ skills_demonstrated: [], project_urls: [] }),
    ).toEqual({
      valid: true,
      dto: { skills_demonstrated: [], project_urls: [] },
    });
    for (const field of ["skills_demonstrated", "project_urls"]) {
      for (const value of [[" "], [null], [1], "TypeScript", null]) {
        expect(validateUpdateProject({ [field]: value })).toEqual({
          valid: false,
          field,
          message: `${field} must be an array of non-empty strings.`,
        });
      }
    }
  });
});
