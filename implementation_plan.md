# Production-Grade Timesheets MVP Implementation Plan

The current codebase establishes a solid foundation with Auth, Organization, and Membership modules. To reach a "production-grade MVP" similar to Clockify, several core modules and infrastructure enhancements are required.

## Proposed Changes

### 1. Core Runtime Modules
New modules to handle the actual timesheet logic.

#### [NEW] Time Entry Module
- **Model**: Track `description`, `startTime`, `endTime`, `duration`, `billable` status, and links to User, Org, Project, and Task.
- **Features**: Timer start/stop logic, manual entry CRUD, bulk deletes, and basic validation (e.g., end time > start time).

#### [NEW] Project & Client Modules
- **Project**: Group entries by project. Track `color`, `billableRate`, and `visibility`.
- **Client**: Group projects by client for better organization and billing.

#### [NEW] Task & Tag Modules
- **Task**: Granular work items within a project.
- **Tag**: Cross-project categorization.

#### [NEW] Reporting Module
- **Features**: Summary and Detailed reports.
- **Aggregation**: Grouping time entries by Project, User, or Client over specific date ranges.

### 2. Infrastructure & Security
Enhancements to make the backend production-ready.

#### [MODIFY] Security & Middleware
- **Helmet**: Add `helmet` for secure HTTP headers.
- **Rate Limiting**: Implement `express-rate-limit` to prevent brute-force and DDoS.
- **CORS**: Tighten CORS policy for production environments.

#### [MODIFY] Observability
- **Structured Logging**: Replace/Supplement `morgan` with `pino` or `winston` for JSON logging.
- **Health Checks**: Add `/health` endpoint for monitoring and orchestration.

#### [NEW] DevOps
- **Docker**: Add `Dockerfile` and `docker-compose.yml` for consistent development and deployment.

## Verification Plan

### Automated Tests
- **Unit Tests**: For each new service (TimeEntry, Project, etc.).
- **Integration Tests**: End-to-end flows like:
  1. User signs up -> Creates Org -> Creates Project -> Starts Timer -> Stops Timer.
  2. Owner invites member -> Member joins -> Member logs time -> Owner views report.
- **Command**: `npm run test` (or `yarn test`).

### Manual Verification
1. **API Testing**: Use Postman/Insomnia to verify new endpoints against `openapi.json` specs.
2. **Email Flow**: Verify invitation and password reset emails in a staging/dev environment.
