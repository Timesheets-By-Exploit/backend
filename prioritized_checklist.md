# Implementation Checklist (Easiest to Most Complex)

This checklist breaks down the [Implementation Plan](file:///Users/exploit/Desktop/projects/timesheets/timesheets-backend/implementation_plan.md) into actionable steps, starting with low-hanging fruit.

### Phase 1: Infrastructure & Security (Quick Wins)
- [x] **Health Check Endpoint**: Add a simple GET `/health` route to verify server status.
- [x] **Security Headers**: Install and configure `helmet` middleware.
- [x] **CORS Configuration**: Restrict CORS to allowed origins for production.
- [x] **Rate Limiting**: Add `express-rate-limit` to sensitive routes (Auth, Invitations).

### Phase 2: Metadata Modules (Foundation)
- [x] **Tag Module**: Implement basic CRUD (Create, Read, Update, Delete) for tags.
- [x] **Client Module**: Implement CRUD for clients (name, email, address, etc.).
- [x] **Project Module**: Implement CRUD for projects (Name, Color, Billable status, link to Client).
- [x] **Task Module**: Implement CRUD for tasks within projects.

### Phase 3: Core Logic (The Meat)
- [x] **Time Entry Model**: Define the Mongoose schema for time entries.
- [x] **Manual Time Entry**: Multi-step implementation:
    - [x] Create manual time entry (POST).
    - [x] List user time entries (GET).
    - [x] Update/Delete entry (PATCH/DELETE).
- [x] **Timer Implementation**:
    - [x] Start timer (POST - sets `startTime`, `endTime` is null).
    - [x] Stop timer (PATCH - calculates `duration` and sets `endTime`).
    - [x] Prevent multiple active timers per user.

### Phase 4: Observability & DevOps
- [ ] **Structured Logging**: Integrate `pino` or `winston` and replace existing `console.log` calls.
- [ ] **Dockerization**: Create a `Dockerfile` and `docker-compose.yml` with MongoDB environment setup.

### Phase 5: Advanced Features
- [ ] **Reporting Engine**: 
    - [ ] Implement data aggregation by Project.
    - [ ] Implement data aggregation by User/Member.
    - [ ] Export reports (CSV/JSON).

### Phase 6: Polish & Verification
- [ ] **Expand Test Coverage**: Add integration tests for complete end-to-end flows.
- [ ] **Documentation**: Ensure `openapi.json` is updated with all new endpoints.
