import type { CreateJobDto } from "../../entities/job.js";

export const sampleJobs: CreateJobDto[] = [
  {
    title: "Frontend Engineer",
    category: "Engineering",
    description: "Build accessible web experiences with React and TypeScript.",
    required_skills: [
      { name: "React" },
      { name: "TypeScript" },
      { name: "CSS" },
    ],
  },
  {
    title: "Backend Engineer",
    category: "Engineering",
    description: "Design reliable APIs and services for a growing platform.",
    required_skills: [
      { name: "Node.js" },
      { name: "TypeScript" },
      { name: "PostgreSQL" },
    ],
  },
  {
    title: "Full Stack Developer",
    category: "Engineering",
    description: "Own product features from database to user interface.",
    required_skills: [{ name: "React" }, { name: "Node.js" }, { name: "SQL" }],
  },
  {
    title: "Data Analyst",
    category: "Data",
    description: "Turn product data into clear business recommendations.",
    required_skills: [
      { name: "SQL" },
      { name: "Python" },
      { name: "Data Visualization" },
    ],
  },
  {
    title: "Machine Learning Engineer",
    category: "Data",
    description: "Develop and productionize predictive models.",
    required_skills: [
      { name: "Python" },
      { name: "Machine Learning" },
      { name: "Docker" },
    ],
  },
  {
    title: "Product Manager",
    category: "Product",
    description: "Guide product discovery and delivery across teams.",
    required_skills: [
      { name: "Product Strategy" },
      { name: "User Research" },
      { name: "Roadmapping" },
    ],
  },
  {
    title: "UX Designer",
    category: "Design",
    description: "Create intuitive workflows from research through delivery.",
    required_skills: [
      { name: "Figma" },
      { name: "User Research" },
      { name: "Prototyping" },
    ],
  },
  {
    title: "DevOps Engineer",
    category: "Infrastructure",
    description:
      "Improve deployment automation, reliability, and observability.",
    required_skills: [
      { name: "AWS" },
      { name: "Docker" },
      { name: "Kubernetes" },
    ],
  },
  {
    title: "QA Automation Engineer",
    category: "Engineering",
    description: "Build automated tests that protect product quality.",
    required_skills: [
      { name: "TypeScript" },
      { name: "Playwright" },
      { name: "CI/CD" },
    ],
  },
  {
    title: "Security Analyst",
    category: "Security",
    description:
      "Identify and reduce risks across applications and infrastructure.",
    required_skills: [
      { name: "Cybersecurity" },
      { name: "Linux" },
      { name: "Risk Assessment" },
    ],
  },
  {
    title: "Technical Writer",
    category: "Content",
    description: "Make complex software easy to understand and use.",
    required_skills: [
      { name: "Technical Writing" },
      { name: "Documentation" },
      { name: "API Design" },
    ],
  },
  {
    title: "Business Analyst",
    category: "Business",
    description:
      "Translate business needs into measurable technical requirements.",
    required_skills: [
      { name: "Requirements Analysis" },
      { name: "SQL" },
      { name: "Process Mapping" },
    ],
  },
];
