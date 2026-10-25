# Architecture Roadmap Issues

This file tracks the requested `cicd-fixer-agent` upgrade as independently
reviewable workstreams.

## Issue 1: Dockerization and orchestration

- [ ] Build the FastAPI backend with Python 3.10 and `actionlint` available on
  `PATH`.
- [ ] Build the Next.js frontend using standalone output.
- [ ] Run both services with root `docker-compose.yml` and `backend/.env`.

## Issue 2: Azure infrastructure and deployment

- [ ] Provision a resource group, ACR, Container Apps environment, and Key
  Vault with Terraform.
- [ ] Deploy backend and frontend images from GitHub Actions on pushes to
  `main`.
- [ ] Keep credentials in GitHub secrets and Azure Key Vault rather than source
  control.

## Issue 3: GitHub App authentication

- [ ] Accept either a personal access token or GitHub App ID/private key
  credentials.
- [ ] Mint a short-lived installation token for repository operations.
- [ ] Expose the same credential options through the REST API and MCP tools.

## Issue 4: Multi-CI static security scanners

- [ ] Route GitHub Actions workflows through `actionlint`.
- [ ] Add deterministic Trivy and Semgrep checks for GitLab CI inputs.
- [ ] Add syntax checks for Jenkinsfiles.
- [ ] Preserve scanner findings in the LLM prompt without treating them as
  trusted instructions.

## Issue 5: Cost and runner optimization

- [ ] Return resource usage, runner sizing, and cache recommendations.
- [ ] Mark these findings with the `COST_OPTIMIZATION` category.
- [ ] Render cost recommendations in the analysis dashboard.

## Issue 6: Backend automated tests

- [ ] Add pytest coverage for repository analysis and pull-request creation.
- [ ] Mock PyGithub interactions.
- [ ] Exercise MCP tool execution without network access.

## Issue 7: Real-time analysis streaming

- [ ] Add an SSE endpoint that emits repository-analysis progress and findings.
- [ ] Consume progress with `EventSource` in the Repo Inspector.
- [ ] Preserve explicit error and completion events.
