# Portfolio Project Schema & Integration Specification

**Subsystem:** Member 4 — Portfolio & Career Readiness  
**Author:** Daniel Lee  
**Sprint:** Sprint 1  
**Entity:** `Project` (`projects` table)  
**Status:** Active

---

## 1. Overview & Purpose

The `Project` model represents user-submitted portfolio items, evidence of work, and practical coding projects in CareerLM. It serves two core architectural functions:

1. **Portfolio Showcase:** Allows users to catalog personal projects, repository links, descriptions, and demonstrated technical skills.
2. **Readiness Evidence Engine:** Provides verified proof of competency that directly feeds into the user's **Career Readiness Score** and **Career Dashboard**.

---

## 2. Database Schema (PostgreSQL / Supabase)

### 2.1 Table Definition: `projects`

| Column                | Data Type      | Constraints / Default                                                                | Description                                                         |
| :-------------------- | :------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `id`                  | `UUID`         | `PRIMARY KEY DEFAULT gen_random_uuid()`                                              | Unique project identifier                                           |
| `user_id`             | `UUID`         | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`                               | Foreign key referencing the authenticated Supabase user             |
| `title`               | `VARCHAR(100)` | `NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100)`                              | Project name (3–100 characters)                                     |
| `description`         | `TEXT`         | `NOT NULL`                                                                           | Detailed description of the project & tech stack                    |
| `skills_demonstrated` | `TEXT[]`       | `NOT NULL DEFAULT '{}'`                                                              | List of normalized skill tags (e.g. `['TypeScript', 'PostgreSQL']`) |
| `project_urls`        | `TEXT[]`       | `NOT NULL DEFAULT '{}'`                                                              | External URLs (GitHub repo, live app, demo video)                   |
| `status`              | `VARCHAR(50)`  | `NOT NULL DEFAULT 'in_progress'`<br>`CHECK (status IN ('in_progress', 'completed'))` | Project lifecycle status                                            |
| `created_at`          | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                                                             | Record creation timestamp                                           |
| `updated_at`          | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                                                             | Record last update timestamp                                        |

### 2.2 Performance Indexes

- `idx_projects_user_id`: Optimizes lookups for `WHERE user_id = $1`.
- `idx_projects_user_status`: Optimizes filtered queries for `WHERE user_id = $1 AND status = 'completed'`.

### 2.3 Multi-Tenant Isolation & Row Level Security (RLS)

- Supabase RLS is enabled on `projects`.
- All operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) enforce `auth.uid() = user_id`.
- The Express application layer reinforces this constraint by binding `req.user.id` to every database query.

---

## 3. Integration with Dashboard Features

The Career Dashboard (`/dashboard`) queries the `projects` table for two primary widgets:

### 3.1 Total Project Count Widget

- **Query:**
  ```sql
  SELECT
      COUNT(*) AS total_projects,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed_projects,
      COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_projects
  FROM projects
  WHERE user_id = :user_id;
  ```
- **Dashboard Display:** Shows the user their total portfolio volume and completion ratio.

### 3.2 Recent Projects Activity Widget

- **Projection (`ProjectSummary`):**
  ```typescript
  interface ProjectSummary {
    id: string;
    title: string;
    skills_demonstrated: string[];
    status: "in_progress" | "completed";
    updated_at: string;
  }
  ```
- **Query:**
  ```sql
  SELECT id, title, skills_demonstrated, status, updated_at
  FROM projects
  WHERE user_id = :user_id
  ORDER BY updated_at DESC
  LIMIT 3;
  ```

---

## 4. Integration with Career Readiness Score Algorithm

In the CareerLM MVP formula, the **Portfolio component represents 15%** of the user's total Career Readiness Score:

$$\text{Readiness Score} = \text{Skills (35\%)} + \text{Resume (20\%)} + \text{Roadmap (20\%)} + \mathbf{Portfolio (15\%)} + \text{Job Match (10\%)}$$

### 4.1 Scoring Consumption Model

The scoring engine evaluates projects across three criteria:

1. **Evidence Volume (30% of Portfolio subscore):**
   - Having 0 projects = 0 pts.
   - 1 project = 50 pts.
   - 2 projects = 80 pts.
   - 3+ projects = 100 pts.
2. **Completion Quality (30% of Portfolio subscore):**
   - Completed projects (`status = 'completed'`) receive 100% weight.
   - In-progress projects (`status = 'in_progress'`) receive 50% momentum weight.
3. **Skill Gap Coverage (40% of Portfolio subscore):**
   - The scoring engine intersects `projects.skills_demonstrated` with the target role's missing skills (identified by Jim's Career Profile / William's Resume analyzer).
   - Demonstrating a missing skill inside a completed project resolves the skill gap and boosts readiness.

---

## 5. TypeScript Contracts

```typescript
// Core Entity
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls: string[];
  status: "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

// Creation DTO
export interface CreateProjectDto {
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls?: string[];
  status?: "in_progress" | "completed";
}

// Update DTO
export interface UpdateProjectDto {
  title?: string;
  description?: string;
  skills_demonstrated?: string[];
  project_urls?: string[];
  status?: "in_progress" | "completed";
}
```
