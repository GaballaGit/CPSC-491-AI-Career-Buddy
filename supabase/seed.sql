-- Curated presentation dataset. See docs/demo-jobs.md at the repository root.
-- Safe to rerun: only the fixed IDs below and their skills are updated.
BEGIN;

CREATE TEMP TABLE demo_jobs_seed (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  skills text[] NOT NULL
) ON COMMIT DROP;

INSERT INTO demo_jobs_seed VALUES
('d3e00000-0000-4000-8000-000000000001',
 'Junior Frontend Developer [Demo]', 'Engineering',
 'Fictional demo role, not an open vacancy. Beginner level. Build accessible interfaces with React and TypeScript, style responsive pages, and collaborate using Git. Designed to demonstrate a strong frontend skill match and a small learning gap.',
 ARRAY['react', 'typescript', 'css', 'git', 'accessibility']),
('d3e00000-0000-4000-8000-000000000002',
 'Junior Backend Developer [Demo]', 'Engineering',
 'Fictional demo role, not an open vacancy. Beginner level. Build Node.js services, design REST APIs, store application data in PostgreSQL, and write automated tests.',
 ARRAY['node.js', 'typescript', 'postgresql', 'rest apis', 'testing']),
('d3e00000-0000-4000-8000-000000000003',
 'Full Stack Developer [Demo]', 'Engineering',
 'Fictional demo role, not an open vacancy. Intermediate level. Deliver features from React interfaces to Node.js APIs and SQL databases, with automated tests and version control.',
 ARRAY['react', 'typescript', 'node.js', 'sql', 'git', 'testing']),
('d3e00000-0000-4000-8000-000000000004',
 'Junior Data Analyst [Demo]', 'Data',
 'Fictional demo role, not an open vacancy. Beginner level. Explore datasets with Python and SQL, summarize trends using statistics, and communicate findings through data visualization.',
 ARRAY['python', 'sql', 'statistics', 'data visualization']),
('d3e00000-0000-4000-8000-000000000005',
 'QA Automation Engineer [Demo]', 'Engineering',
 'Fictional demo role, not an open vacancy. Intermediate level. Protect web product quality with TypeScript and Playwright tests, triage failures, and integrate test suites into CI/CD.',
 ARRAY['typescript', 'playwright', 'testing', 'ci/cd', 'git']),
('d3e00000-0000-4000-8000-000000000006',
 'Cloud Platform Engineer [Demo]', 'Infrastructure',
 'Fictional demo role, not an open vacancy. Advanced stretch role. Operate Linux services on AWS, package applications with Docker, orchestrate workloads with Kubernetes, and manage infrastructure with Terraform.',
 ARRAY['linux', 'aws', 'docker', 'kubernetes', 'terraform', 'ci/cd']),
('d3e00000-0000-4000-8000-000000000007',
 'Figma - Data Engineer Intern (2027) [Snapshot]', 'Data',
 'Real posting snapshot retrieved 2026-11-20; availability may change. San Francisco or New York hub. Summary: build, test, and document data pipelines and trusted datasets. The posting asks for Python or a similar language, SQL, pipeline/ETL experience, and collaboration. Demo skill tags are a simplified interpretation, not the full hiring criteria. Source: https://boards.greenhouse.io/figma/jobs/6178851004',
 ARRAY['python', 'sql', 'etl', 'communication']),
('d3e00000-0000-4000-8000-000000000008',
 'Figma - Product Design Intern (2027) [Snapshot]', 'Design',
 'Real posting snapshot retrieved 2026-11-20; availability may change. San Francisco or New York hub. Summary: own features from ideation to implementation, create flows and prototypes, and participate in design critiques. The posting emphasizes visual/interaction design, product strategy, and expressing ideas through prototypes and code. Demo skill tags simplify the criteria; visual and interaction design can be alternatives in the original. Source: https://boards.greenhouse.io/figma/jobs/6180005004',
 ARRAY['visual design', 'interaction design', 'product strategy', 'prototyping']),
('d3e00000-0000-4000-8000-000000000009',
 'Figma - Software Engineer Intern (Summer 2027) [Snapshot]', 'Engineering',
 'Real posting snapshot retrieved 2026-11-20; availability may change. San Francisco or New York hub. Summary: join a product, infrastructure, or security team to build and test software. The posting accepts a general-purpose language such as C++, JavaScript, Python, or Java, plus core CS concepts and collaborative problem solving. Demo tags use programming rather than requiring all alternative languages. Source: https://boards.greenhouse.io/figma/jobs/6143238004',
 ARRAY['programming', 'data structures', 'algorithms', 'problem solving', 'communication']);

INSERT INTO public.jobs (id, title, category, description)
SELECT id, title, category, description FROM demo_jobs_seed
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

DELETE FROM public.job_required_skills
WHERE job_id IN (SELECT id FROM demo_jobs_seed);

INSERT INTO public.job_required_skills (job_id, skill)
SELECT id, unnest(skills) FROM demo_jobs_seed;

COMMIT;
