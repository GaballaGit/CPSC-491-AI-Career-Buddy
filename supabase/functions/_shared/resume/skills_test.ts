import { deepStrictEqual, strictEqual } from "node:assert";

import { extractSkills } from "./skills.ts";

// Helper - Display names only
const names = (text: string) => extractSkills(text).map((s) => s.name);

Deno.test("finds skills in order of appearance", () => {
  deepStrictEqual(names("Built with React and Python on AWS"), [
    "React",
    "Python",
    "AWS",
  ]);
});

Deno.test("aliases resolve to one canonical skill", () => {
  deepStrictEqual(names("JS, JavaScript, NodeJS and Node.js"), [
    "JavaScript",
    "Node.js",
  ]);
});

Deno.test("casing and repeated mentions do not duplicate", () => {
  deepStrictEqual(names("python PYTHON Python, docker; Docker."), [
    "Python",
    "Docker",
  ]);
});

Deno.test("punctuated skills match exactly", () => {
  deepStrictEqual(names("C++ and C# developer"), ["C++", "C#"]);
});

Deno.test("words inside other words do not match", () => {
  deepStrictEqual(names("javascriptish reactive gitignore"), []);
});

Deno.test("keys are lowercase display names", () => {
  deepStrictEqual(extractSkills("PostgreSQL"), [
    { name: "PostgreSQL", key: "postgresql" },
  ]);
});

Deno.test("empty text returns no skills", () => {
  strictEqual(extractSkills("").length, 0);
});

Deno.test("sample resume text", async () => {
  const { extractResumeText } = await import("./extract.ts");
  const bytes = await Deno.readFile(
    new URL("./fixtures/sample_resume.pdf", import.meta.url),
  );
  const skills = names(await extractResumeText(bytes, "sample_resume.pdf"));
  for (
    const s of ["Python", "TypeScript", "React", "Node.js", "PostgreSQL"]
  ) {
    strictEqual(skills.includes(s), true, `missing ${s}`);
  }
});
