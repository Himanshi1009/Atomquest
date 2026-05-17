# ⚛ AtomQuest — Goal Setting & Tracking Portal

**AtomQuest Hackathon 1.0 Submission**

A web-based Goal Setting & Tracking Portal that supports the full lifecycle of employee goals — from creation and alignment to quarterly check-ins and performance visibility.

## Features

### Phase 1 — Goal Creation & Approval
- Employee goal sheet creation with Thrust Area, UoM, Targets, Weightage
- Validation rules: total weightage = 100%, min 10% per goal, max 8 goals
- Manager (L1) approval workflow with inline editing
- Goal locking on approval
- Shared Goals — push departmental KPIs to multiple employees

### Phase 2 — Achievement Tracking & Quarterly Check-ins
- Quarterly check-in interface (Q1–Q4)
- Planned vs Actual achievement tracking
- Auto-computed progress scores (Min, Max, Timeline, Zero formulas)
- Manager check-in comments

### Three User Roles
- **Employee** — Create goals, log achievements, track progress
- **Manager (L1)** — Approve goals, conduct check-ins, push shared goals
- **Admin / HR** — Manage cycles, unlock goals, export reports, view audit trail

### Reporting & Governance
- CSV export of achievement data
- Completion dashboard with per-quarter status
- Full audit trail (who changed what, when)

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18 + Vite               |
| Styling     | Inline CSS (dark theme)       |
| State       | React hooks (useState, useMemo) |
| Hosting     | Vercel (recommended)          |

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**
5. Your portal is live at `your-project.vercel.app`

## How to Demo

Use the **role switcher** in the top bar to walk through each user journey:

1. **Employee** → Create Goals → Submit → View My Goals
2. **Manager** → Goal Approvals → Approve → Team Check-ins
3. **Employee** → Quarterly Check-in → Enter actuals → Save
4. **Admin** → Reports & Export → Audit Trail → Cycle Management

## Architecture

See `AtomQuest_Architecture_Diagram.pdf` in the submission.

```
Users (Browser)
      ↓
React SPA (Vite)
  ├── Role-based views (Employee / Manager / Admin)
  ├── Goal CRUD + validation engine
  ├── Approval workflow
  ├── Quarterly check-in interface
  ├── Score computation (Min/Max/Zero/Timeline)
  ├── CSV export
  └── Audit logger
```

## Evaluation Criteria Covered

| # | Parameter               | Covered |
|---|-------------------------|---------|
| 1 | Functionality           | ✅ End-to-end goal lifecycle |
| 2 | Adherence to BRD        | ✅ All Phase 1 + Phase 2 |
| 3 | User Friendliness       | ✅ Clean dark UI, intuitive flows |
| 4 | Absence of Bugs         | ✅ Validation, edge-case handling |
| 5 | Good-to-Have Features   | ✅ Shared goals, audit trail, analytics |
| 6 | Cost Optimisation       | ✅ Static SPA, no backend costs |

## License

Built for AtomQuest Hackathon 1.0.
