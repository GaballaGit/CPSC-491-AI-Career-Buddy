import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  initialOnboardingFormData,
  EXPERIENCE_LEVELS,
  LEARNING_PREFERENCES,
  LIMITS,
  validateNewSkill,
  validateStep,
} from "../lib/careerProfileForm.ts";

const valid = {
  targetCareer: "Engineer",
  experienceLevel: "beginner",
  skills: ["TypeScript"],
  learningPreferences: ["reading"],
  weeklyAvailabilityHours: 10,
};

describe("career profile form contract", () => {
  it("keeps the initial answers and option order", () => {
    assert.deepEqual(initialOnboardingFormData, {
      targetCareer: "",
      experienceLevel: "",
      skills: [],
      learningPreferences: [],
      weeklyAvailabilityHours: "",
    });
    assert.deepEqual(
      EXPERIENCE_LEVELS.map(({ value }) => value),
      ["beginner", "intermediate", "advanced"],
    );
    assert.deepEqual(
      LEARNING_PREFERENCES.map(({ value }) => value),
      [
        "videos",
        "reading",
        "hands_on_projects",
        "mentorship",
        "structured_courses",
      ],
    );
  });

  const invalidSteps = [
    [0, { targetCareer: " " }, "Enter the career you're targeting."],
    [
      0,
      { targetCareer: "x".repeat(101) },
      "Keep it to 100 characters or fewer.",
    ],
    [1, { experienceLevel: "" }, "Choose your experience level."],
    [2, { skills: [] }, "Add at least one skill."],
    [2, { skills: Array(31).fill("Skill") }, "You can add up to 30 skills."],
    [
      3,
      { learningPreferences: [] },
      "Choose at least one way you like to learn.",
    ],
    [
      4,
      { weeklyAvailabilityHours: "" },
      "Enter how many hours per week you can dedicate.",
    ],
    ...[0, 169, 1.5, NaN].map((hours) => [
      4,
      { weeklyAvailabilityHours: hours },
      "Enter a whole number of hours from 1 to 168.",
    ]),
  ];
  for (const [step, changes, message] of invalidSteps) {
    it(`preserves step ${step} error for ${JSON.stringify(changes)}`, () => {
      assert.equal(validateStep(step, { ...valid, ...changes }), message);
    });
  }

  it("accepts boundaries, leaves input untouched, and ignores unknown steps", () => {
    const input = {
      ...valid,
      targetCareer: "x".repeat(100),
      skills: Array(30).fill("Skill"),
    };
    const before = structuredClone(input);
    for (const hours of [1, 168]) {
      for (let step = 0; step < 5; step++) {
        assert.equal(
          validateStep(step, { ...input, weeklyAvailabilityHours: hours }),
          null,
        );
      }
    }
    assert.equal(validateStep(99, initialOnboardingFormData), null);
    assert.deepEqual(input, before);
    assert.deepEqual(LIMITS, {
      targetCareerMaxLength: 100,
      skillMaxLength: 50,
      maxSkills: 30,
      minWeeklyHours: 1,
      maxWeeklyHours: 168,
    });
  });

  it("preserves skill errors and their precedence", () => {
    assert.equal(validateNewSkill("  ", []), "Type a skill before adding it.");
    assert.equal(
      validateNewSkill("x".repeat(51), []),
      "Each skill must be 50 characters or fewer.",
    );
    assert.equal(validateNewSkill(" ts ", ["TS"]), '"ts" is already added.');
    assert.equal(
      validateNewSkill("new", Array(30).fill("Skill")),
      "You can add up to 30 skills.",
    );
    assert.equal(
      validateNewSkill("Skill", Array(30).fill("Skill")),
      '"Skill" is already added.',
    );
    assert.equal(validateNewSkill("x".repeat(50), []), null);
  });

  it("does not introduce backend alias normalization into form validation", () => {
    assert.equal(validateNewSkill("js", ["JavaScript"]), null);
    assert.equal(validateNewSkill("React", ["React "]), null);
  });
});
