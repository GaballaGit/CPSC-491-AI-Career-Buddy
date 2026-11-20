-- Run after loading supabase/seed.sql (including after a second load).
DO $$
DECLARE
  role_count integer;
  skill_count integer;
BEGIN
  SELECT count(*) INTO role_count FROM public.jobs
  WHERE id BETWEEN 'd3e00000-0000-4000-8000-000000000001'::uuid
               AND 'd3e00000-0000-4000-8000-000000000009'::uuid;
  IF role_count <> 9 THEN
    RAISE EXCEPTION 'Expected 9 demo roles, got %', role_count;
  END IF;

  SELECT count(*) INTO skill_count FROM public.job_required_skills
  WHERE job_id BETWEEN 'd3e00000-0000-4000-8000-000000000001'::uuid
                   AND 'd3e00000-0000-4000-8000-000000000009'::uuid;
  IF skill_count <> 44 THEN
    RAISE EXCEPTION 'Expected 44 demo skill relationships, got %', skill_count;
  END IF;

  IF (SELECT count(*) FROM public.jobs
      WHERE id BETWEEN 'd3e00000-0000-4000-8000-000000000001'::uuid
                   AND 'd3e00000-0000-4000-8000-000000000006'::uuid
        AND title LIKE '%[Demo]' AND description LIKE 'Fictional demo role%') <> 6 THEN
    RAISE EXCEPTION 'Fictional roles must be visibly labeled';
  END IF;

  IF (SELECT count(*) FROM public.jobs
      WHERE id BETWEEN 'd3e00000-0000-4000-8000-000000000007'::uuid
                   AND 'd3e00000-0000-4000-8000-000000000009'::uuid
        AND title LIKE '%[Snapshot]'
        AND description LIKE '%2026-11-20%'
        AND description LIKE '%https://boards.greenhouse.io/figma/jobs/%') <> 3 THEN
    RAISE EXCEPTION 'Real snapshots must include labels, retrieval date, and source';
  END IF;

  IF (SELECT count(*) FROM public.job_required_skills
      WHERE job_id = 'd3e00000-0000-4000-8000-000000000001'
        AND skill IN ('react', 'typescript', 'css', 'git')) <> 4
     OR NOT EXISTS (SELECT 1 FROM public.job_required_skills
                    WHERE job_id = 'd3e00000-0000-4000-8000-000000000001'
                      AND skill = 'accessibility') THEN
    RAISE EXCEPTION 'Frontend presentation must have four known skills and an accessibility gap';
  END IF;
END;
$$;
