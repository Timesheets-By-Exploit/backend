# ⏱ Timesheets Backend

A backend system for tracking time entries, projects, and reports.  
Built with **Express + TypeScript + MongoDB**, following best practices.

---

## Features (MVP)
- User authentication (JWT-based)
- CRUD for Timesheets
- CRUD for Projects
- Role-based Access Control (Admin, Employee, Manager)
- API Documentation (TsSpec X SwaggerUI)

---

## Tech Stack
- **Express** (TypeScript)
- **MongoDB (Mongoose)**
- **Jest + Supertest** (Testing)
- **ESLint + Prettier** (Linting/Formatting)
- **TsSpec X Swagger** (API Docs)

---

## 📦 Installation
```bash
git clone https://github.com/Timesheets-By-Exploit/backend.git
cd backend 
npm install
npm run dev
```
---

## Git Workflow

### 1. Create a New Branch

---

Always start new branches from `develop`, not from other feature branches.

---

```bash
# Create and switch to a new branch
git checkout -b feature/feature-name
```

---

### 2. Push a New Branch (first time)

```bash
git push -u origin feature/feature-name
```

👉 `-u` sets the upstream, so future `git push`/`git pull` works without arguments.

---

### 3. Rename a Branch

```bash
# Rename current branch
git branch -m new-name

# Rename a different branch
git branch -m old-name new-name
```

For remote:

```bash
git push origin --delete old-name
git push -u origin new-name
```

---

### 4. Switch Branches

```bash
git checkout develop
git checkout feature/feature-name
```

---

### 5. Keep Branch Updated (from develop/main)

```bash
# While on your feature branch
git fetch origin
git rebase origin/develop
# or
git merge origin/develop
```

Prefer **rebase** for clean history, **merge** for simplicity.

---

### 6. Stage, Commit, Push

```bash
git add .
git commit -m "feat(auth): implement signup endpoint"
git push
```

---

### 7. Commit Message Convention

Follow **Conventional Commits**:

* `feat:` → new feature
* `fix:` → bug fix
* `test:` → testing work
* `docs:` → documentation updates
* `refactor:` → code refactoring
* `chore:` → maintenance (configs, deps)

Examples:

```bash
feat(auth): add signup API for org owners
test(auth): add validation tests for signup
docs(readme): add setup instructions
```

---

### 8. Pull Requests (PR)

1. Push branch to remote.
2. Open PR into `develop` (not `main`).
3. Review → squash/merge.

---

### 9. Hotfix (urgent fix on main)

```bash
git checkout main
git checkout -b hotfix/fix-login
```

After fix:

```bash
git commit -m "fix(auth): handle null password bug"
git push -u origin hotfix/fix-login
```

Open PR → merge into `main` **and** `develop`.

---

### 10. Delete Branch

```bash
# Local
git branch -d feature/auth-signup
# Remote
git push origin --delete feature/auth-signup
```


### Folder Structure
```
timesheets-backend/
│
├── .github/               # GitHub Actions CI/CD workflows
├── .husky/                # Git hooks (linting/tests pre-commit)
├── docs/                  # Project documentation (markdowns, API specs)
│   └── tspecGenerator.ts
│
├── src/                   # Application source code
│   ├── config/            # App configurations (db, env, logger, etc.)
│   │   ├── db.ts
│   │   └── env.ts
│   │
│   ├── modules/           # Each feature lives here (modular structure)
│   │   ├── module/          # Authentication module
│   │   ├── __tests__/ # Tests specific to module
│   │   ├── module.controller.ts
│   │   ├── module.docs.ts #Tspec Docs
│   │   ├── module.service.ts
│   │   ├── module.model.ts
│   │   ├── module.routes.ts
│   │   └── module.types.ts
│   │   
│   │
│   ├── middlewares/        # Custom Express middlewares
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── validators.ts
│   │
│   ├── utils/             # Utility/helper functions
│   │   ├── index.ts
│   │   └── AppError.ts
│   │
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
│
├── .env                   # Local environment variables
├── .env.example           # Sample env file for docs
├── jest.config.ts         # Jest config
├── tsconfig.json          # TypeScript config
├── package.json
└── README.md
```
