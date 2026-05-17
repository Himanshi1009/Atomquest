import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Seed Data ──────────────────────────────────────────────────
const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Experience",
  "Operational Excellence",
  "People & Culture",
  "Innovation & Digital",
  "Risk & Compliance",
];
const UOM_TYPES = ["Min (Numeric)", "Min (%)", "Max (Numeric)", "Max (%)", "Timeline", "Zero"];
const STATUSES = ["Not Started", "On Track", "Completed"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_LABELS = {
  Q1: "Q1 Check-in (July)",
  Q2: "Q2 Check-in (October)",
  Q3: "Q3 Check-in (January)",
  Q4: "Q4 / Annual (March–April)",
};

const SEED_EMPLOYEES = [
  { id: "E001", name: "Employee 1", dept: "Engineering", managerId: "M001" },
  { id: "E002", name: "Employee 2", dept: "Engineering", managerId: "M001" },
  { id: "E003", name: "Employee 3", dept: "Marketing", managerId: "M002" },
  { id: "E004", name: "Employee 4", dept: "Marketing", managerId: "M002" },
];
const SEED_MANAGERS = [
  { id: "M001", name: "Manager 1", dept: "Engineering" },
  { id: "M002", name: "Manager 2", dept: "Marketing" },
];

function uid() {
  return "g" + Math.random().toString(36).slice(2, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Score Computation ──────────────────────────────────────────
function computeScore(uom, target, actual) {
  if (target == null || actual == null || target === "" || actual === "") return null;
  const t = parseFloat(target);
  const a = parseFloat(actual);
  if (uom.startsWith("Min")) return t === 0 ? (a === 0 ? 100 : 100) : Math.min((a / t) * 100, 150);
  if (uom.startsWith("Max")) return a === 0 ? 150 : Math.min((t / a) * 100, 150);
  if (uom === "Zero") return a === 0 ? 100 : 0;
  if (uom === "Timeline") {
    if (!target || !actual) return null;
    const td = new Date(target).getTime();
    const ad = new Date(actual).getTime();
    if (ad <= td) return 100;
    const diff = (ad - td) / (1000 * 60 * 60 * 24);
    return Math.max(0, 100 - diff * 2);
  }
  return null;
}

// ─── CSV Export helper ──────────────────────────────────────────
function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Styles ─────────────────────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#181b24",
  card: "#1e2230",
  border: "#2a2f3e",
  accent: "#6c5ce7",
  accentLight: "#a29bfe",
  success: "#00cec9",
  warning: "#fdcb6e",
  danger: "#ff7675",
  text: "#e8e8ed",
  textDim: "#8b8fa3",
  textMuted: "#5a5e72",
  white: "#ffffff",
};

const S = {
  app: {
    minHeight: "100vh",
    background: `linear-gradient(145deg, ${C.bg} 0%, #141720 50%, ${C.bg} 100%)`,
    color: C.text,
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 28px",
    borderBottom: `1px solid ${C.border}`,
    background: "rgba(24,27,36,.85)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: C.accentLight },
  rolePill: (active) => ({
    padding: "7px 18px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent : "transparent",
    color: active ? C.white : C.textDim,
    transition: "all .2s",
  }),
  sidebar: {
    width: 230,
    minHeight: "calc(100vh - 54px)",
    borderRight: `1px solid ${C.border}`,
    background: C.surface,
    padding: "18px 0",
    flexShrink: 0,
  },
  navItem: (active) => ({
    padding: "10px 24px",
    fontSize: 13.5,
    fontWeight: active ? 700 : 500,
    color: active ? C.accentLight : C.textDim,
    background: active ? "rgba(108,92,231,.12)" : "transparent",
    borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
    cursor: "pointer",
    transition: "all .15s",
  }),
  main: { flex: 1, padding: "28px 36px", maxWidth: 1100, overflow: "auto" },
  h1: { fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.4px" },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 14, color: C.text },
  subtitle: { fontSize: 14, color: C.textDim, marginBottom: 28 },
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: "22px 26px",
    marginBottom: 18,
  },
  btn: (variant = "primary", small) => ({
    padding: small ? "6px 14px" : "9px 22px",
    fontSize: small ? 12 : 13.5,
    fontWeight: 700,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    color: C.white,
    background:
      variant === "primary"
        ? `linear-gradient(135deg, ${C.accent}, #7c6cf0)`
        : variant === "success"
        ? C.success
        : variant === "danger"
        ? C.danger
        : variant === "warning"
        ? "#e17055"
        : "transparent",
    transition: "all .15s",
    ...(variant === "ghost" ? { color: C.textDim, border: `1px solid ${C.border}` } : {}),
  }),
  input: {
    width: "100%",
    padding: "9px 14px",
    fontSize: 13.5,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    padding: "9px 14px",
    fontSize: 13.5,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    outline: "none",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: `2px solid ${C.border}`,
    color: C.textDim,
    fontWeight: 700,
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: { padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.text, verticalAlign: "top" },
  badge: (color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: C.white,
    background: color,
  }),
  statBox: {
    flex: 1,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "18px 22px",
    minWidth: 150,
  },
  statNum: { fontSize: 32, fontWeight: 800, color: C.accentLight },
  statLabel: { fontSize: 12, color: C.textDim, marginTop: 4 },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    padding: "12px 22px",
    borderRadius: 10,
    background: C.accent,
    color: C.white,
    fontWeight: 600,
    fontSize: 13.5,
    zIndex: 999,
    boxShadow: "0 8px 30px rgba(108,92,231,.4)",
  },
};

// ─── Reusable Components ────────────────────────────────────────
function Badge({ children, color }) {
  return <span style={S.badge(color)}>{children}</span>;
}
function StatusBadge({ status }) {
  const m = { Draft: C.textMuted, Submitted: C.warning, Approved: C.success, "Returned for Rework": C.danger, Locked: C.accent };
  return <Badge color={m[status] || C.textMuted}>{status}</Badge>;
}

// ─── MAIN APP ───────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState("Employee");
  const [currentUser, setCurrentUser] = useState(SEED_EMPLOYEES[0]);
  const [page, setPage] = useState("dashboard");
  const [goals, setGoals] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [sharedGoals, setSharedGoals] = useState([]);
  const [toast, setToast] = useState(null);
  const [currentQuarter, setCurrentQuarter] = useState("Q1");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const addAudit = useCallback((action, detail) => {
    setAuditLog((p) => [{ id: uid(), timestamp: new Date().toISOString(), user: currentUser.name, role, action, detail }, ...p]);
  }, [currentUser, role]);

  // Get goals for current employee
  const myGoals = useMemo(() => goals.filter((g) => g.employeeId === currentUser.id), [goals, currentUser]);

  // Get goals for manager's team
  const teamGoals = useMemo(() => {
    if (role !== "Manager") return [];
    const empIds = SEED_EMPLOYEES.filter((e) => e.managerId === currentUser.id).map((e) => e.id);
    return goals.filter((g) => empIds.includes(g.employeeId));
  }, [goals, currentUser, role]);

  const teamEmployees = useMemo(() => {
    if (role !== "Manager") return [];
    return SEED_EMPLOYEES.filter((e) => e.managerId === currentUser.id);
  }, [currentUser, role]);

  // Role change
  useEffect(() => {
    if (role === "Employee") { setCurrentUser(SEED_EMPLOYEES[0]); setPage("dashboard"); }
    else if (role === "Manager") { setCurrentUser(SEED_MANAGERS[0]); setPage("dashboard"); }
    else { setCurrentUser({ id: "A001", name: "Admin User", dept: "HR" }); setPage("dashboard"); }
  }, [role]);

  // ─── NAV ITEMS ────────────────────────────────────────────────
  const navItems =
    role === "Employee"
      ? [
          { key: "dashboard", label: "Dashboard" },
          { key: "create", label: "Create Goals" },
          { key: "mygoals", label: "My Goals" },
          { key: "checkin", label: "Quarterly Check-in" },
        ]
      : role === "Manager"
      ? [
          { key: "dashboard", label: "Team Dashboard" },
          { key: "approvals", label: "Goal Approvals" },
          { key: "teamcheckin", label: "Team Check-ins" },
          { key: "sharedgoals", label: "Shared Goals" },
        ]
      : [
          { key: "dashboard", label: "Overview" },
          { key: "employees", label: "All Employees" },
          { key: "reports", label: "Reports & Export" },
          { key: "audit", label: "Audit Trail" },
          { key: "cycle", label: "Cycle Management" },
        ];

  // ─────────────── EMPLOYEE: CREATE GOALS ───────────────────────
  function CreateGoals() {
    const [draft, setDraft] = useState(
      myGoals.length > 0 && myGoals[0].status === "Draft"
        ? myGoals
        : myGoals.length > 0 && myGoals[0].status === "Returned for Rework"
        ? myGoals
        : []
    );
    const [newGoal, setNewGoal] = useState({ title: "", description: "", thrustArea: THRUST_AREAS[0], uom: UOM_TYPES[0], target: "", weightage: "" });

    const totalWeight = draft.reduce((s, g) => s + (parseFloat(g.weightage) || 0), 0);
    const canSubmit = draft.length > 0 && draft.length <= 8 && Math.abs(totalWeight - 100) < 0.01 && draft.every((g) => parseFloat(g.weightage) >= 10);

    function addGoal() {
      if (!newGoal.title || !newGoal.target || !newGoal.weightage) return showToast("Fill all fields");
      if (draft.length >= 8) return showToast("Maximum 8 goals allowed");
      if (parseFloat(newGoal.weightage) < 10) return showToast("Minimum weightage is 10%");
      const g = { ...newGoal, id: uid(), employeeId: currentUser.id, employeeName: currentUser.name, dept: currentUser.dept, status: "Draft", managerId: currentUser.managerId, createdAt: today(), achievements: {} };
      setDraft((p) => [...p, g]);
      setNewGoal({ title: "", description: "", thrustArea: THRUST_AREAS[0], uom: UOM_TYPES[0], target: "", weightage: "" });
    }

    function removeGoal(id) {
      setDraft((p) => p.filter((g) => g.id !== id));
    }

    function submitGoals() {
      if (!canSubmit) return;
      const submitted = draft.map((g) => ({ ...g, status: "Submitted" }));
      setGoals((prev) => {
        const others = prev.filter((g) => g.employeeId !== currentUser.id);
        return [...others, ...submitted];
      });
      addAudit("Goal Sheet Submitted", `${draft.length} goals, total weightage ${totalWeight}%`);
      showToast("Goals submitted for approval!");
      setDraft([]);
      setPage("mygoals");
    }

    return (
      <div>
        <h1 style={S.h1}>Create Goal Sheet</h1>
        <p style={S.subtitle}>Define your goals for this performance cycle. Total weightage must equal 100%.</p>

        {/* Validation status bar */}
        <div style={{ ...S.card, display: "flex", gap: 32, alignItems: "center", marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 12, color: C.textDim }}>Goals</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: draft.length > 8 ? C.danger : C.accentLight }}>{draft.length}/8</div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: C.textDim }}>Total Weightage</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: Math.abs(totalWeight - 100) < 0.01 ? C.success : C.warning }}>{totalWeight}%</div>
          </div>
          <div style={{ flex: 1 }} />
          <button style={S.btn("primary")} disabled={!canSubmit} onClick={submitGoals}>
            Submit for Approval
          </button>
        </div>

        {/* Add goal form */}
        <div style={{ ...S.card, marginBottom: 24 }}>
          <h2 style={{ ...S.h2, marginBottom: 18 }}>Add a Goal</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Thrust Area</label>
              <select style={{ ...S.select, width: "100%", marginTop: 4 }} value={newGoal.thrustArea} onChange={(e) => setNewGoal((p) => ({ ...p, thrustArea: e.target.value }))}>
                {THRUST_AREAS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Unit of Measurement</label>
              <select style={{ ...S.select, width: "100%", marginTop: 4 }} value={newGoal.uom} onChange={(e) => setNewGoal((p) => ({ ...p, uom: e.target.value }))}>
                {UOM_TYPES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: C.textDim }}>Goal Title</label>
              <input style={{ ...S.input, marginTop: 4 }} placeholder="e.g. Increase quarterly revenue by 15%" value={newGoal.title} onChange={(e) => setNewGoal((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: C.textDim }}>Description</label>
              <input style={{ ...S.input, marginTop: 4 }} placeholder="Brief description of the goal" value={newGoal.description} onChange={(e) => setNewGoal((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Target {newGoal.uom === "Timeline" ? "(Date)" : "(Number)"}</label>
              <input style={{ ...S.input, marginTop: 4 }} type={newGoal.uom === "Timeline" ? "date" : "number"} placeholder="Target value" value={newGoal.target} onChange={(e) => setNewGoal((p) => ({ ...p, target: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Weightage (%)</label>
              <input style={{ ...S.input, marginTop: 4 }} type="number" min="10" max="100" placeholder="Min 10%" value={newGoal.weightage} onChange={(e) => setNewGoal((p) => ({ ...p, weightage: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button style={S.btn("primary")} onClick={addGoal}>+ Add Goal</button>
          </div>
        </div>

        {/* Draft goals table */}
        {draft.length > 0 && (
          <div style={S.card}>
            <h2 style={S.h2}>Draft Goals</h2>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Thrust Area</th>
                  <th style={S.th}>Title</th>
                  <th style={S.th}>UoM</th>
                  <th style={S.th}>Target</th>
                  <th style={S.th}>Weightage</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {draft.map((g, i) => (
                  <tr key={g.id}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}>{g.thrustArea}</td>
                    <td style={S.td}>{g.title}</td>
                    <td style={S.td}>{g.uom}</td>
                    <td style={S.td}>{g.target}</td>
                    <td style={S.td}>{g.weightage}%</td>
                    <td style={S.td}>
                      <button style={S.btn("danger", true)} onClick={() => removeGoal(g.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─────────────── EMPLOYEE: MY GOALS ───────────────────────────
  function MyGoals() {
    return (
      <div>
        <h1 style={S.h1}>My Goals</h1>
        <p style={S.subtitle}>Your submitted goal sheet for this performance cycle.</p>
        {myGoals.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>
            No goals yet. <span style={{ color: C.accentLight, cursor: "pointer" }} onClick={() => setPage("create")}>Create your goal sheet →</span>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <StatusBadge status={myGoals[0]?.status} />
              <span style={{ fontSize: 12, color: C.textDim }}>
                Total Weightage: {myGoals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0)}%
              </span>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Thrust Area</th>
                  <th style={S.th}>Goal</th>
                  <th style={S.th}>UoM</th>
                  <th style={S.th}>Target</th>
                  <th style={S.th}>Weight</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myGoals.map((g, i) => (
                  <tr key={g.id}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}>{g.thrustArea}</td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{g.title}</div>
                      {g.description && <div style={{ fontSize: 12, color: C.textDim }}>{g.description}</div>}
                    </td>
                    <td style={S.td}>{g.uom}</td>
                    <td style={S.td}>{g.target}</td>
                    <td style={S.td}>{g.weightage}%</td>
                    <td style={S.td}><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─────────────── EMPLOYEE: QUARTERLY CHECK-IN ─────────────────
  function QuarterlyCheckin() {
    const approved = myGoals.filter((g) => g.status === "Approved" || g.status === "Locked");
    const [localAch, setLocalAch] = useState({});
    const [localStatus, setLocalStatus] = useState({});

    function saveCheckin() {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.employeeId !== currentUser.id) return g;
          const ach = { ...(g.achievements || {}) };
          if (localAch[g.id] !== undefined) ach[currentQuarter] = { actual: localAch[g.id], status: localStatus[g.id] || "On Track" };
          return { ...g, achievements: ach };
        })
      );
      addAudit(`${currentQuarter} Check-in Saved`, `${approved.length} goals updated`);
      showToast(`${currentQuarter} check-in saved!`);
    }

    return (
      <div>
        <h1 style={S.h1}>Quarterly Check-in</h1>
        <p style={S.subtitle}>Log your actual achievement against planned targets.</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {QUARTERS.map((q) => (
            <button key={q} style={S.rolePill(q === currentQuarter)} onClick={() => setCurrentQuarter(q)}>{QUARTER_LABELS[q]}</button>
          ))}
        </div>
        {approved.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>No approved goals to update.</div>
        ) : (
          <div style={S.card}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Goal</th>
                  <th style={S.th}>UoM</th>
                  <th style={S.th}>Target</th>
                  <th style={S.th}>Actual ({currentQuarter})</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((g) => {
                  const existing = g.achievements?.[currentQuarter];
                  const actual = localAch[g.id] !== undefined ? localAch[g.id] : existing?.actual ?? "";
                  const status = localStatus[g.id] || existing?.status || "Not Started";
                  const score = computeScore(g.uom, g.target, actual);
                  return (
                    <tr key={g.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{g.title}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>{g.thrustArea} · {g.weightage}%</div>
                      </td>
                      <td style={S.td}>{g.uom}</td>
                      <td style={S.td}>{g.target}</td>
                      <td style={S.td}>
                        <input
                          style={{ ...S.input, width: 120 }}
                          type={g.uom === "Timeline" ? "date" : "number"}
                          value={actual}
                          onChange={(e) => setLocalAch((p) => ({ ...p, [g.id]: e.target.value }))}
                        />
                      </td>
                      <td style={S.td}>
                        <select style={S.select} value={status} onChange={(e) => setLocalStatus((p) => ({ ...p, [g.id]: e.target.value }))}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={S.td}>
                        {score !== null ? (
                          <span style={{ fontWeight: 700, color: score >= 80 ? C.success : score >= 50 ? C.warning : C.danger }}>{score.toFixed(1)}%</span>
                        ) : (
                          <span style={{ color: C.textMuted }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <button style={S.btn("primary")} onClick={saveCheckin}>Save {currentQuarter} Check-in</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────── MANAGER: APPROVALS ───────────────────────────
  function GoalApprovals() {
    const submitted = teamGoals.filter((g) => g.status === "Submitted");
    const grouped = {};
    submitted.forEach((g) => {
      if (!grouped[g.employeeId]) grouped[g.employeeId] = { name: g.employeeName, goals: [] };
      grouped[g.employeeId].goals.push(g);
    });

    const [editing, setEditing] = useState({});

    function approveAll(empId) {
      setGoals((prev) =>
        prev.map((g) => (g.employeeId === empId && g.status === "Submitted" ? { ...g, status: "Approved", target: editing[g.id]?.target || g.target, weightage: editing[g.id]?.weightage || g.weightage } : g))
      );
      addAudit("Goals Approved", `All goals for employee ${grouped[empId]?.name}`);
      showToast("Goals approved & locked!");
    }

    function returnForRework(empId) {
      setGoals((prev) => prev.map((g) => (g.employeeId === empId && g.status === "Submitted" ? { ...g, status: "Returned for Rework" } : g)));
      addAudit("Goals Returned", `Returned for rework: ${grouped[empId]?.name}`);
      showToast("Goals returned for rework");
    }

    return (
      <div>
        <h1 style={S.h1}>Goal Approvals</h1>
        <p style={S.subtitle}>Review and approve your team's submitted goals.</p>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>No pending approvals.</div>
        ) : (
          Object.entries(grouped).map(([empId, data]) => (
            <div key={empId} style={{ ...S.card, marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{data.name}</div>
                  <div style={{ fontSize: 12, color: C.textDim }}>{data.goals.length} goals · Total weight: {data.goals.reduce((s, g) => s + parseFloat(editing[g.id]?.weightage || g.weightage || 0), 0)}%</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={S.btn("success", true)} onClick={() => approveAll(empId)}>Approve All</button>
                  <button style={S.btn("danger", true)} onClick={() => returnForRework(empId)}>Return for Rework</button>
                </div>
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Thrust Area</th>
                    <th style={S.th}>Goal</th>
                    <th style={S.th}>UoM</th>
                    <th style={S.th}>Target (editable)</th>
                    <th style={S.th}>Weightage (editable)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.goals.map((g) => (
                    <tr key={g.id}>
                      <td style={S.td}>{g.thrustArea}</td>
                      <td style={S.td}>{g.title}</td>
                      <td style={S.td}>{g.uom}</td>
                      <td style={S.td}>
                        <input style={{ ...S.input, width: 100 }} defaultValue={g.target} onChange={(e) => setEditing((p) => ({ ...p, [g.id]: { ...p[g.id], target: e.target.value } }))} />
                      </td>
                      <td style={S.td}>
                        <input style={{ ...S.input, width: 80 }} type="number" defaultValue={g.weightage} onChange={(e) => setEditing((p) => ({ ...p, [g.id]: { ...p[g.id], weightage: e.target.value } }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    );
  }

  // ─────────────── MANAGER: TEAM CHECK-INS ──────────────────────
  function TeamCheckins() {
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [comment, setComment] = useState("");

    const empGoals = selectedEmp ? goals.filter((g) => g.employeeId === selectedEmp.id && (g.status === "Approved" || g.status === "Locked")) : [];

    function saveComment() {
      const key = `${selectedEmp.id}_${currentQuarter}`;
      setCheckins((p) => ({ ...p, [key]: { comment, date: today(), manager: currentUser.name } }));
      addAudit("Check-in Comment", `${currentQuarter} comment for ${selectedEmp.name}`);
      showToast("Check-in comment saved!");
      setComment("");
    }

    return (
      <div>
        <h1 style={S.h1}>Team Check-ins</h1>
        <p style={S.subtitle}>Review planned vs actual achievement and document discussions.</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {QUARTERS.map((q) => (
            <button key={q} style={S.rolePill(q === currentQuarter)} onClick={() => setCurrentQuarter(q)}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ width: 220 }}>
            {teamEmployees.map((e) => (
              <div key={e.id} style={{ ...S.navItem(selectedEmp?.id === e.id), borderLeft: "none", borderRadius: 8, marginBottom: 4 }} onClick={() => setSelectedEmp(e)}>
                {e.name}
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {!selectedEmp ? (
              <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>Select a team member</div>
            ) : empGoals.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>No approved goals for {selectedEmp.name}</div>
            ) : (
              <div style={S.card}>
                <h2 style={S.h2}>{selectedEmp.name} — {QUARTER_LABELS[currentQuarter]}</h2>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Goal</th>
                      <th style={S.th}>Target</th>
                      <th style={S.th}>Actual</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empGoals.map((g) => {
                      const ach = g.achievements?.[currentQuarter];
                      const score = ach ? computeScore(g.uom, g.target, ach.actual) : null;
                      return (
                        <tr key={g.id}>
                          <td style={S.td}>
                            <div style={{ fontWeight: 600 }}>{g.title}</div>
                            <div style={{ fontSize: 11, color: C.textDim }}>{g.thrustArea} · {g.weightage}%</div>
                          </td>
                          <td style={S.td}>{g.target}</td>
                          <td style={S.td}>{ach?.actual ?? "—"}</td>
                          <td style={S.td}>{ach?.status ? <Badge color={ach.status === "Completed" ? C.success : ach.status === "On Track" ? C.warning : C.textMuted}>{ach.status}</Badge> : "—"}</td>
                          <td style={S.td}>{score !== null ? <span style={{ fontWeight: 700, color: score >= 80 ? C.success : score >= 50 ? C.warning : C.danger }}>{score.toFixed(1)}%</span> : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Check-in comment */}
                <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6 }}>Check-in Comment</label>
                  <textarea style={{ ...S.input, height: 80, resize: "vertical" }} placeholder="Document the discussion…" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button style={S.btn("primary")} onClick={saveComment}>Save Comment</button>
                  </div>
                  {checkins[`${selectedEmp.id}_${currentQuarter}`] && (
                    <div style={{ marginTop: 12, padding: 12, background: C.surface, borderRadius: 8, fontSize: 13 }}>
                      <span style={{ color: C.textDim }}>Previous comment by {checkins[`${selectedEmp.id}_${currentQuarter}`].manager} on {checkins[`${selectedEmp.id}_${currentQuarter}`].date}:</span>
                      <div style={{ marginTop: 4 }}>{checkins[`${selectedEmp.id}_${currentQuarter}`].comment}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────── MANAGER: SHARED GOALS ────────────────────────
  function SharedGoalsPage() {
    const [sg, setSg] = useState({ title: "", thrustArea: THRUST_AREAS[0], uom: UOM_TYPES[0], target: "", weightage: "" });
    const [selectedEmps, setSelectedEmps] = useState([]);

    function pushShared() {
      if (!sg.title || !sg.target || !sg.weightage) return showToast("Fill all fields");
      if (selectedEmps.length === 0) return showToast("Select at least one employee");
      const baseId = uid();
      const newGoals = selectedEmps.map((empId) => {
        const emp = SEED_EMPLOYEES.find((e) => e.id === empId);
        return {
          ...sg,
          id: uid(),
          sharedBaseId: baseId,
          employeeId: empId,
          employeeName: emp?.name,
          dept: emp?.dept,
          managerId: currentUser.id,
          status: "Approved",
          createdAt: today(),
          achievements: {},
          isShared: true,
        };
      });
      setGoals((p) => [...p, ...newGoals]);
      setSharedGoals((p) => [...p, { baseId, title: sg.title, pushedTo: selectedEmps.length }]);
      addAudit("Shared Goal Pushed", `"${sg.title}" → ${selectedEmps.length} employees`);
      showToast(`Shared goal pushed to ${selectedEmps.length} employees!`);
      setSg({ title: "", thrustArea: THRUST_AREAS[0], uom: UOM_TYPES[0], target: "", weightage: "" });
      setSelectedEmps([]);
    }

    return (
      <div>
        <h1 style={S.h1}>Shared Goals</h1>
        <p style={S.subtitle}>Push departmental KPIs to multiple team members. Recipients can only adjust weightage.</p>
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: C.textDim }}>Goal Title</label>
              <input style={{ ...S.input, marginTop: 4 }} value={sg.title} onChange={(e) => setSg((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Thrust Area</label>
              <select style={{ ...S.select, width: "100%", marginTop: 4 }} value={sg.thrustArea} onChange={(e) => setSg((p) => ({ ...p, thrustArea: e.target.value }))}>
                {THRUST_AREAS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>UoM</label>
              <select style={{ ...S.select, width: "100%", marginTop: 4 }} value={sg.uom} onChange={(e) => setSg((p) => ({ ...p, uom: e.target.value }))}>
                {UOM_TYPES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Target</label>
              <input style={{ ...S.input, marginTop: 4 }} type={sg.uom === "Timeline" ? "date" : "number"} value={sg.target} onChange={(e) => setSg((p) => ({ ...p, target: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim }}>Weightage (%)</label>
              <input style={{ ...S.input, marginTop: 4 }} type="number" value={sg.weightage} onChange={(e) => setSg((p) => ({ ...p, weightage: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6 }}>Assign To</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {teamEmployees.map((e) => (
                  <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: C.text }}>
                    <input type="checkbox" checked={selectedEmps.includes(e.id)} onChange={(ev) => setSelectedEmps((p) => ev.target.checked ? [...p, e.id] : p.filter((x) => x !== e.id))} />
                    {e.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button style={S.btn("primary")} onClick={pushShared}>Push Shared Goal</button>
          </div>
        </div>
        {sharedGoals.length > 0 && (
          <div style={{ ...S.card, marginTop: 18 }}>
            <h2 style={S.h2}>Pushed Shared Goals</h2>
            {sharedGoals.map((s) => (
              <div key={s.baseId} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{s.title}</span> → {s.pushedTo} employees
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────── ADMIN: ALL EMPLOYEES ─────────────────────────
  function AllEmployees() {
    return (
      <div>
        <h1 style={S.h1}>All Employees</h1>
        <p style={S.subtitle}>Organization-wide goal status overview.</p>
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Employee</th>
                <th style={S.th}>Department</th>
                <th style={S.th}>Manager</th>
                <th style={S.th}>Goals</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SEED_EMPLOYEES.map((e) => {
                const eGoals = goals.filter((g) => g.employeeId === e.id);
                const mgr = SEED_MANAGERS.find((m) => m.id === e.managerId);
                const status = eGoals.length === 0 ? "No Goals" : eGoals[0].status;
                return (
                  <tr key={e.id}>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{e.name}</span></td>
                    <td style={S.td}>{e.dept}</td>
                    <td style={S.td}>{mgr?.name ?? "—"}</td>
                    <td style={S.td}>{eGoals.length}</td>
                    <td style={S.td}><StatusBadge status={status} /></td>
                    <td style={S.td}>
                      {(status === "Approved" || status === "Locked") && (
                        <button
                          style={S.btn("warning", true)}
                          onClick={() => {
                            setGoals((p) => p.map((g) => (g.employeeId === e.id ? { ...g, status: "Draft" } : g)));
                            addAudit("Admin Unlock", `Unlocked goals for ${e.name}`);
                            showToast(`Goals unlocked for ${e.name}`);
                          }}
                        >
                          Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────── ADMIN: REPORTS ───────────────────────────────
  function Reports() {
    function exportAchievement() {
      const rows = [];
      SEED_EMPLOYEES.forEach((e) => {
        const eGoals = goals.filter((g) => g.employeeId === e.id);
        eGoals.forEach((g) => {
          QUARTERS.forEach((q) => {
            const ach = g.achievements?.[q];
            rows.push({
              Employee: e.name,
              Department: e.dept,
              Goal: g.title,
              ThrustArea: g.thrustArea,
              UoM: g.uom,
              Target: g.target,
              Weightage: g.weightage + "%",
              Quarter: q,
              Actual: ach?.actual ?? "",
              Status: ach?.status ?? "",
              Score: ach ? (computeScore(g.uom, g.target, ach.actual)?.toFixed(1) ?? "") + "%" : "",
            });
          });
        });
      });
      if (rows.length === 0) return showToast("No data to export");
      downloadCSV(rows, "achievement_report.csv");
      showToast("Report downloaded!");
    }

    // Completion stats
    const allApproved = goals.filter((g) => g.status === "Approved" || g.status === "Locked");
    const completionByQ = QUARTERS.map((q) => {
      const done = allApproved.filter((g) => g.achievements?.[q]?.actual).length;
      return { quarter: q, done, total: allApproved.length, pct: allApproved.length ? Math.round((done / allApproved.length) * 100) : 0 };
    });

    return (
      <div>
        <h1 style={S.h1}>Reports & Export</h1>
        <p style={S.subtitle}>Achievement reports and completion dashboard.</p>
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <button style={S.btn("primary")} onClick={exportAchievement}>Export Achievement Report (CSV)</button>
        </div>

        {/* Completion dashboard */}
        <div style={S.card}>
          <h2 style={S.h2}>Completion Dashboard</h2>
          <div style={{ display: "flex", gap: 16 }}>
            {completionByQ.map((c) => (
              <div key={c.quarter} style={S.statBox}>
                <div style={S.statNum}>{c.pct}%</div>
                <div style={S.statLabel}>{c.quarter} — {c.done}/{c.total} goals updated</div>
                <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: C.border }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${c.pct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.success})`, transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By employee */}
        <div style={{ ...S.card, marginTop: 18 }}>
          <h2 style={S.h2}>Employee Check-in Status</h2>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Employee</th>
                {QUARTERS.map((q) => <th key={q} style={S.th}>{q}</th>)}
              </tr>
            </thead>
            <tbody>
              {SEED_EMPLOYEES.map((e) => {
                const eGoals = goals.filter((g) => g.employeeId === e.id && (g.status === "Approved" || g.status === "Locked"));
                return (
                  <tr key={e.id}>
                    <td style={S.td}>{e.name}</td>
                    {QUARTERS.map((q) => {
                      const done = eGoals.filter((g) => g.achievements?.[q]?.actual).length;
                      const total = eGoals.length;
                      return (
                        <td key={q} style={S.td}>
                          {total === 0 ? "—" : done === total ? <Badge color={C.success}>Done</Badge> : done > 0 ? <Badge color={C.warning}>{done}/{total}</Badge> : <Badge color={C.textMuted}>Pending</Badge>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────── ADMIN: AUDIT TRAIL ───────────────────────────
  function AuditTrail() {
    return (
      <div>
        <h1 style={S.h1}>Audit Trail</h1>
        <p style={S.subtitle}>Complete log of all changes — who did what and when.</p>
        {auditLog.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 48, color: C.textDim }}>No activity yet.</div>
        ) : (
          <div style={S.card}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Timestamp</th>
                  <th style={S.th}>User</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Action</th>
                  <th style={S.th}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((a) => (
                  <tr key={a.id}>
                    <td style={S.td}><span style={{ fontSize: 12 }}>{new Date(a.timestamp).toLocaleString()}</span></td>
                    <td style={S.td}>{a.user}</td>
                    <td style={S.td}><Badge color={a.role === "Admin" ? C.danger : a.role === "Manager" ? C.warning : C.accent}>{a.role}</Badge></td>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{a.action}</span></td>
                    <td style={S.td}><span style={{ color: C.textDim, fontSize: 12 }}>{a.detail}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─────────────── ADMIN: CYCLE MANAGEMENT ──────────────────────
  function CycleManagement() {
    return (
      <div>
        <h1 style={S.h1}>Cycle Management</h1>
        <p style={S.subtitle}>Configure performance cycles and quarterly windows.</p>
        <div style={S.card}>
          <h2 style={S.h2}>Current Cycle Schedule</h2>
          <table style={S.table}>
            <thead>
              <tr><th style={S.th}>Period</th><th style={S.th}>Window Opens</th><th style={S.th}>Action</th></tr>
            </thead>
            <tbody>
              {[
                ["Phase 1 — Goal Setting", "1st May", "Goal Creation, Submission & Approval"],
                ["Q1 Check-in", "July", "Progress Update — Planned vs. Actual"],
                ["Q2 Check-in", "October", "Progress Update — Planned vs. Actual"],
                ["Q3 Check-in", "January", "Progress Update — Planned vs. Actual"],
                ["Q4 / Annual", "March / April", "Final Achievement Capture"],
              ].map(([p, w, a], i) => (
                <tr key={i}><td style={S.td}><span style={{ fontWeight: 600 }}>{p}</span></td><td style={S.td}>{w}</td><td style={S.td}>{a}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...S.card, marginTop: 18 }}>
          <h2 style={S.h2}>Org Hierarchy</h2>
          {SEED_MANAGERS.map((m) => (
            <div key={m.id} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.accentLight }}>▸ {m.name} <span style={{ fontWeight: 400, color: C.textDim }}>({m.dept} Manager)</span></div>
              {SEED_EMPLOYEES.filter((e) => e.managerId === m.id).map((e) => (
                <div key={e.id} style={{ paddingLeft: 24, fontSize: 13, color: C.textDim, marginTop: 4 }}>└ {e.name}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────── DASHBOARDS ───────────────────────────────────
  function Dashboard() {
    if (role === "Employee") {
      const approved = myGoals.filter((g) => g.status === "Approved" || g.status === "Locked").length;
      const submitted = myGoals.filter((g) => g.status === "Submitted").length;
      const avgScore = (() => {
        const scores = myGoals.filter((g) => g.achievements?.Q1?.actual).map((g) => computeScore(g.uom, g.target, g.achievements.Q1.actual)).filter(Boolean);
        return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
      })();
      return (
        <div>
          <h1 style={S.h1}>Welcome, {currentUser.name}</h1>
          <p style={S.subtitle}>Your goal tracking dashboard</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <div style={S.statBox}><div style={S.statNum}>{myGoals.length}</div><div style={S.statLabel}>Total Goals</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.success }}>{approved}</div><div style={S.statLabel}>Approved</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.warning }}>{submitted}</div><div style={S.statLabel}>Pending Approval</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.accentLight }}>{avgScore}%</div><div style={S.statLabel}>Avg. Q1 Score</div></div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <button style={S.btn("primary")} onClick={() => setPage("create")}>Create Goals</button>
            <button style={S.btn("ghost")} onClick={() => setPage("checkin")}>Quarterly Check-in</button>
          </div>
        </div>
      );
    }
    if (role === "Manager") {
      const pending = teamGoals.filter((g) => g.status === "Submitted").length;
      const approved = teamGoals.filter((g) => g.status === "Approved" || g.status === "Locked").length;
      return (
        <div>
          <h1 style={S.h1}>Team Dashboard</h1>
          <p style={S.subtitle}>Hi {currentUser.name} — here's your team overview.</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <div style={S.statBox}><div style={S.statNum}>{teamEmployees.length}</div><div style={S.statLabel}>Team Members</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.warning }}>{pending}</div><div style={S.statLabel}>Pending Approvals</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.success }}>{approved}</div><div style={S.statLabel}>Approved Goals</div></div>
            <div style={S.statBox}><div style={{ ...S.statNum, color: C.accentLight }}>{teamGoals.length}</div><div style={S.statLabel}>Total Goals</div></div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <button style={S.btn("primary")} onClick={() => setPage("approvals")}>Review Approvals</button>
            <button style={S.btn("ghost")} onClick={() => setPage("teamcheckin")}>Team Check-ins</button>
          </div>
        </div>
      );
    }
    // Admin
    const totalGoals = goals.length;
    const approvedGoals = goals.filter((g) => g.status === "Approved" || g.status === "Locked").length;
    const submittedGoals = goals.filter((g) => g.status === "Submitted").length;
    return (
      <div>
        <h1 style={S.h1}>Admin Overview</h1>
        <p style={S.subtitle}>Organization-wide goal tracking status</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          <div style={S.statBox}><div style={S.statNum}>{SEED_EMPLOYEES.length}</div><div style={S.statLabel}>Employees</div></div>
          <div style={S.statBox}><div style={S.statNum}>{SEED_MANAGERS.length}</div><div style={S.statLabel}>Managers</div></div>
          <div style={S.statBox}><div style={{ ...S.statNum, color: C.accentLight }}>{totalGoals}</div><div style={S.statLabel}>Total Goals</div></div>
          <div style={S.statBox}><div style={{ ...S.statNum, color: C.success }}>{approvedGoals}</div><div style={S.statLabel}>Approved</div></div>
          <div style={S.statBox}><div style={{ ...S.statNum, color: C.warning }}>{submittedGoals}</div><div style={S.statLabel}>Pending</div></div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <button style={S.btn("primary")} onClick={() => setPage("reports")}>Reports & Export</button>
          <button style={S.btn("ghost")} onClick={() => setPage("audit")}>Audit Trail</button>
        </div>
      </div>
    );
  }

  // ─────────────── PAGE ROUTER ──────────────────────────────────
  function PageContent() {
    if (page === "dashboard") return <Dashboard />;
    if (page === "create") return <CreateGoals />;
    if (page === "mygoals") return <MyGoals />;
    if (page === "checkin") return <QuarterlyCheckin />;
    if (page === "approvals") return <GoalApprovals />;
    if (page === "teamcheckin") return <TeamCheckins />;
    if (page === "sharedgoals") return <SharedGoalsPage />;
    if (page === "employees") return <AllEmployees />;
    if (page === "reports") return <Reports />;
    if (page === "audit") return <AuditTrail />;
    if (page === "cycle") return <CycleManagement />;
    return <Dashboard />;
  }

  // ─────────────── RENDER ───────────────────────────────────────
  return (
    <div style={S.app}>
      {/* TOP BAR */}
      <div style={S.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={S.logo}>⚛ AtomQuest</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>Goal Setting & Tracking Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.textDim, marginRight: 8 }}>Switch Role:</span>
          {["Employee", "Manager", "Admin"].map((r) => (
            <div key={r} style={S.rolePill(role === r)} onClick={() => setRole(r)}>{r}</div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.success})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.white }}>
            {currentUser.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>{role} · {currentUser.dept}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* SIDEBAR */}
        <div style={S.sidebar}>
          {navItems.map((n) => (
            <div key={n.key} style={S.navItem(page === n.key)} onClick={() => setPage(n.key)}>
              {n.label}
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div style={S.main}>
          <PageContent />
        </div>
      </div>

      {/* TOAST */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
