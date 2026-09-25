# CareerLM Infrastructure

This directory contains the Terraform configuration used for CareerLM infrastructure validation and platform configuration.

## Platforms

CareerLM is currently designed around:

- Cloudflare for frontend/application infrastructure
- Supabase for backend/database services

Terraform provider requirements are defined in `versions.tf`.

## Terraform Responsibilities

During Sprint 2, Terraform is used to:

- Define the infrastructure providers used by CareerLM.
- Validate infrastructure configuration automatically in CI.
- Provide a foundation for adding managed Cloudflare and Supabase resources in later work.
- Produce reviewable Terraform plans when resources and required credentials are available.

Application deployment itself is handled separately by the Cloudflare and Supabase deployment workflows.

Terraform should only manage infrastructure resources that the team explicitly decides to place under Terraform control.

## State Strategy

Terraform state must never be committed to the Git repository.

The repository `.gitignore` excludes:

- `.terraform/`
- `*.tfstate`
- `*.tfstate.*`
- `*.tfvars`

The `.terraform.lock.hcl` file is intentionally committed so that developers and CI use consistent provider versions.

For Sprint 2, the configuration does not use a shared remote Terraform backend because no production infrastructure resources are currently being managed.

If CareerLM begins managing shared infrastructure through Terraform in a later sprint, the team should configure an appropriate remote state backend rather than storing state locally or in Git.

## Secrets

Infrastructure credentials must not be stored directly in Terraform files or committed `.tfvars` files.

Secrets should be stored as:

- Local development credentials: local `.env` or uncommitted configuration
- CI/CD deployment credentials: GitHub Environment Secrets
- Supabase runtime secrets: Supabase secret management

## Local Validation

From the `infra` directory, run:

```bash
terraform fmt -check
terraform init -backend=false
terraform validate