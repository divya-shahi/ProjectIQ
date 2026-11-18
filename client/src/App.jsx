import { useEffect, useMemo, useState } from "react";
import { request } from "./api";
import { LayoutDashboard, FolderKanban, CheckSquare, Plus, LogOut, Trash2, CalendarDays, Activity, X, CircleAlert, Users } from "lucide-react";

const blankProject = { name: "", description: "", priority: "Medium", status: "Planning", dueDate: "" };
const blankTask = {
  title: "",
  description: "",
  project: "",
  priority: "Medium",
  status: "To Do",
  dueDate: "",
  estimatedDuration: 1,
  assignee: "",
  dependencies: []
};
const dateText = value => value ? new Date(value).toLocaleDateString() : "No deadline";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("projectiq_token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState("overview");
  const [modal, setModal] = useState("");
  const [projectForm, setProjectForm] = useState(blankProject);
  const [taskForm, setTaskForm] = useState(blankTask);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
const [teamMembers, setTeamMembers] = useState([]);
const [taskMembers, setTaskMembers] = useState([]);
const [teamProject, setTeamProject] = useState("");
const [criticalTaskCount, setCriticalTaskCount] = useState(0);
const [criticalPathData, setCriticalPathData] = useState(null);
const [criticalPathProject, setCriticalPathProject] = useState(null);
const [criticalPathLoading, setCriticalPathLoading] = useState(false);
const [risks, setRisks] = useState([]);
const [riskForm, setRiskForm] = useState({
  title: "",
  description: "",
  probability: 3,
  impact: 3,
  mitigation: ""
});
const [riskProject, setRiskProject] = useState(null);

  async function loadData(currentToken = token) {
    const [p, t, s] = await Promise.all([
      request("/projects", { token: currentToken }),
      request("/tasks", { token: currentToken }),
      request("/dashboard/stats", { token: currentToken })
    ]);
    setProjects(p); setTasks(t); setStats(s);
    await loadDashboardRisks(p, currentToken);
    await loadDashboardCriticalTasks(p, currentToken);
  }


async function loadCriticalPath(project) {
  setCriticalPathProject(project);
  setCriticalPathLoading(true);
  setCriticalPathData(null);
  setError("");

  try {
    const result = await request(
      `/projects/${project._id}/critical-path`,
      { token }
    );

    setCriticalPathData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setCriticalPathLoading(false);
  }
}

async function loadRisks(project) {
  setRiskProject(project);

  try {
    const result = await request(
      `/risks/${project._id}`,
      { token }
    );

    setRisks(result);
  } catch (err) {
    setError(err.message);
  }
}


async function loadDashboardRisks(projectList = projects, currentToken = token) {
  try {
    const results = await Promise.all(
      projectList.map(project =>
        request(`/risks/${project._id}`, { token: currentToken })
      )
    );

    const allRisks = results.flat();
    setRisks(allRisks);
    return allRisks;
  } catch (err) {
    console.error("Could not load dashboard risks:", err);
    setRisks([]);
    return [];
  }
}

async function loadDashboardCriticalTasks(projectList = projects, currentToken = token) {
  try {
    const results = await Promise.all(
      projectList.map(project =>
        request(`/projects/${project._id}/critical-path`, {
          token: currentToken
        })
      )
    );

    const count = results.reduce(
      (total, result) => total + result.criticalTasks.length,
      0
    );

    setCriticalTaskCount(count);
  } catch (err) {
    console.error("Could not load critical tasks:", err);
    setCriticalTaskCount(0);
  }
}



async function saveRisk(e) {
  e.preventDefault();
  setError("");

  try {
    await request(`/risks/${riskProject._id}`, {
      method: "POST",
      token,
      body: {
        ...riskForm,
        probability: Number(riskForm.probability),
        impact: Number(riskForm.impact)
      }
    });

    setRiskForm({
      title: "",
      description: "",
      probability: 3,
      impact: 3,
      mitigation: ""
    });

    await loadRisks(riskProject);
    flash("Risk created successfully");
  } catch (err) {
    setError(err.message);
  }
}



  useEffect(() => {
    if (!token) return;
    request("/auth/me", { token }).then(({ user }) => {
      setUser(user); return loadData(token);
    }).catch(() => logout());
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const result = await request(path, { method: "POST", body: auth });
      localStorage.setItem("projectiq_token", result.token);
      setUser(result.user); setToken(result.token);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("projectiq_token");
    setToken(""); setUser(null); setProjects([]); setTasks([]); setStats(null);
  }

  async function saveProject(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await request("/projects", { method: "POST", token, body: { ...projectForm, dueDate: projectForm.dueDate || undefined } });
      setModal(""); setProjectForm(blankProject); await loadData(); flash("Project created successfully");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  

async function saveTask(e) {
  e.preventDefault();
  setError("");
  setBusy(true);

  try {
    const payload = {
      ...taskForm,
      dueDate: taskForm.dueDate || undefined,
      dependencies: taskForm.dependencies || []
    };

    if (editingTask) {
      await request(`/tasks/${editingTask._id}`, {
        method: "PATCH",
        token,
        body: payload
      });

      flash("Task updated successfully");
    } else {
      await request("/tasks", {
        method: "POST",
        token,
        body: payload
      });

      flash("Task created successfully");
    }

    setModal("");
    setTaskForm(blankTask);
    setEditingTask(null);
    await loadData();

  } catch (err) {
    setError(err.message);
  } finally {
    setBusy(false);
  }
}


  async function loadTeamMembers(projectId) {
  if (!projectId) {
    setTeamMembers([]);
    return;
  }

  try {
    const result = await request(`/projects/${projectId}`, { token });
    setTeamMembers(result.project.members || []);
  } catch (err) {
    setError(err.message);
  }
}

async function loadTaskMembers(projectId) {
  if (!projectId) {
    setTaskMembers([]);
    return;
  }

  try {
    const result = await request(`/projects/${projectId}`, { token });
    setTaskMembers(result.project.members || []);
  } catch (err) {
    setError(err.message);
  }
}


async function addTeamMember(e) {
  e.preventDefault();
  setError("");

  try {
    const result = await request(
      `/projects/${teamProject}/members`,
      {
        method: "POST",
        token,
        body: { email: teamEmail }
      }
    );

    setTeamMembers(result.members || []);
    setTeamEmail("");
    flash("Team member added successfully");
  } catch (err) {
    setError(err.message);
  }
}


async function removeTeamMember(userId) {
  if (!confirm("Remove this member from the project?")) return;

  try {
    const result = await request(
      `/projects/${teamProject}/members/${userId}`,
      { method: "DELETE", token }
    );

    setTeamMembers(result.members || []);
    flash("Team member removed successfully");
  } catch (err) {
    setError(err.message);
  }
}


  async function updateTask(taskId, updates) {
    try { await request(`/tasks/${taskId}`, { method: "PATCH", token, body: updates }); await loadData(); }
    catch (err) { setError(err.message); }
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project and all its tasks?")) return;
    try { await request(`/projects/${id}`, { method: "DELETE", token }); await loadData(); flash("Project deleted"); }
    catch (err) { setError(err.message); }
  }

  function flash(message) { setNotice(message); setTimeout(() => setNotice(""), 3000); }

  const filteredTasks = useMemo(() => selectedProject === "all" ? tasks : tasks.filter(t => (t.project?._id || t.project) === selectedProject), [tasks, selectedProject]);

  if (!token || !user) return <main className="auth-shell">
    <section className="auth-card">
      <div className="brand-mark">P</div><p className="eyebrow">PROJECT INTELLIGENCE PLATFORM</p>
      <h1>{authMode === "login" ? "Welcome back" : "Create your workspace"}</h1>
      <p className="muted">Plan better. Deliver smarter.</p>
      <form onSubmit={handleAuth} className="form-stack">
        {authMode === "register" && <label>Full name<input required value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Your name" /></label>}
        <label>Email address<input type="email" required value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label>
        <label>Password<input type="password" minLength="8" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary full" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="switch-auth">{authMode === "login" ? "New to ProjectIQ?" : "Already have an account?"} <button className="link-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Create account" : "Sign in"}</button></p>
      
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small">P</div><span>Project<span className="brand-accent">IQ</span></span></div>
      <p className="nav-label">WORKSPACE</p>
      <button className={`nav-item ${page === "overview" ? "active" : ""}`} onClick={() => setPage("overview")}><LayoutDashboard size={18}/> Overview</button>
      <button className={`nav-item ${page === "projects" ? "active" : ""}`} onClick={() => setPage("projects")}><FolderKanban size={18}/> Projects</button>
      <button className={`nav-item ${page === "tasks" ? "active" : ""}`} onClick={() => setPage("tasks")}><CheckSquare size={18}/> Tasks</button>
      <button
  className={`nav-item ${page === "team" ? "active" : ""}`}
  onClick={() => setPage("team")}
>
  <Users size={18}/> Team
</button>
      <div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button className="nav-item logout" onClick={logout}><LogOut size={17}/> Sign out</button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>{page === "overview" ? "Overview" : page === "projects" ? "Projects" : "Tasks"}</h2></div><div className="top-actions"><span className="online-dot"></span><span className="muted small-text">Workspace active</span><button className="primary" onClick={() => { setError(""); setModal("project"); }}><Plus size={16}/> New project</button></div></header>
      {error && <div className="alert"><CircleAlert size={17}/>{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
      {notice && <div className="toast">{notice}</div>}

      {page === "overview" && <>
        <section className="welcome-row"><div><h1>Good work starts with clarity, {user.name.split(" ")[0]}.</h1><p className="muted">Here's what's happening across your projects.</p></div><button className="secondary" onClick={() => { const projectId = projects[0]?._id || "";
setTaskForm({ ...blankTask, project: projectId });
loadTaskMembers(projectId);
setModal("task"); }} disabled={!projects.length}><Plus size={16}/> Add task</button></section>
        <section className="stats-grid">
          <Stat icon={<FolderKanban/>} label="Total projects" value={stats?.projects.total ?? 0} note="Across your workspace"/>
          <Stat icon={<CheckSquare/>} label="Total tasks" value={stats?.tasks.total ?? 0} note={`${stats?.tasks.completed ?? 0} completed`}/>
          <Stat icon={<Activity/>} label="Task completion" value={`${stats?.tasks.completionRate ?? 0}%`} note="Overall completion rate"/>
          <Stat icon={<CircleAlert/>} label="Overdue tasks" value={stats?.overdueTasks.length ?? 0} note="Needs your attention"/>
          <Stat
  icon={<Activity/>}
  label="Critical tasks"
  value={criticalTaskCount}
  note="Tasks on the critical path"
/>
<Stat
  icon={<CircleAlert/>}
  label="Open risks"
  value={risks.filter(r => r.status !== "Resolved").length}
  note="Unresolved project risks"
/>
        </section>
        <section className="content-grid">
          <div className="panel"><div className="panel-heading"><div><h3>Recent projects</h3><p className="muted">Your latest active work</p></div><button className="link-button" onClick={() => setPage("projects")}>View all</button></div>
            {projects.length ? <div className="project-list">{projects.slice(0,5).map(p => <ProjectRow key={p._id} project={p} onDelete={deleteProject}/>)}</div> : <Empty text="No projects yet. Create your first project to get started."/>}
          </div>
          <div className="panel"><div className="panel-heading"><div><h3>Tasks needing attention</h3><p className="muted">Overdue and open work</p></div></div>
            {stats?.overdueTasks?.length ? stats.overdueTasks.map(t => <div className="attention-item" key={t._id}><div className="attention-icon"><CalendarDays size={17}/></div><div><strong>{t.title}</strong><small>{t.project?.name} · Due {dateText(t.dueDate)}</small></div></div>) : <Empty text="No overdue tasks. Nice work!"/>}
          </div>
        </section>
      </>}

      {page === "projects" && <section className="panel page-panel"><div className="panel-heading"><div><h3>All projects</h3><p className="muted">{projects.length} projects in your workspace</p></div><button className="primary" onClick={() => setModal("project")}><Plus size={16}/> New project</button></div>
        {projects.length ? <div className="project-grid">{projects.map(p => <ProjectCard key={p._id} project={p} onDelete={deleteProject} onCriticalPath={loadCriticalPath} onRisks={loadRisks}/>)}</div> : <Empty text="Create your first project to see it here."/>}
      </section>}

{criticalPathProject && (
  <section className="panel page-panel">
    <div className="panel-heading">
      <div>
        <h3>Critical Path Analysis</h3>
        <p className="muted">
          {criticalPathProject.name}
        </p>
      </div>

      <button
        className="secondary"
        onClick={() => {
          setCriticalPathProject(null);
          setCriticalPathData(null);
        }}
      >
        Back
      </button>
    </div>

    {criticalPathLoading ? (
      <p>Calculating critical path...</p>
    ) : criticalPathData && (
      <>
        <div className="stats-grid">
          <article className="stat-card">
            <span>Project duration</span>
            <h2>{criticalPathData.projectDuration} days</h2>
          </article>

          <article className="stat-card">
            <span>Total tasks</span>
            <h2>{criticalPathData.tasks.length}</h2>
          </article>

          <article className="stat-card">
            <span>Critical tasks</span>
            <h2>{criticalPathData.criticalTasks.length}</h2>
          </article>
        </div>

<h4>Project Gantt Chart</h4>
<div className="gantt-row gantt-header">
  <div>Task</div>
  <div
  className="gantt-timeline-header"
  style={{
    gridTemplateColumns: `repeat(${criticalPathData.projectDuration}, minmax(45px, 1fr))`
  }}
>
    {Array.from(
      { length: criticalPathData.projectDuration },
      (_, i) => (
        <span key={i}>Day {i + 1}</span>
      )
    )}
  </div>
</div>
<div className="gantt-chart">
  {criticalPathData.tasks.map(task => (
    <div className="gantt-row" key={task.id}>
      <div className="gantt-task-name" title={task.title}>
        {task.title}
      </div>

      <div
  className="gantt-timeline"
  style={{
    "--gantt-days": criticalPathData.projectDuration
  }}
>
        <div
          className={`gantt-bar ${
            task.isCritical ? "critical-bar" : "normal-bar"
          }`}
          style={{
            left: `${
              (task.earliestStart / criticalPathData.projectDuration) * 100
            }%`,
            width: `${
              (task.duration / criticalPathData.projectDuration) * 100
            }%`
          }}
          title={`${task.title}: ${task.duration} days`}
        />
      </div>
    </div>
  ))}
</div>

<div className="gantt-legend">
  <span>🔴 Critical task</span>
  <span>🟢 Non-critical task</span>
</div>


        <h4>Task schedule</h4>

        {criticalPathData.tasks.map(task => (
          <div key={task.id} className="task-card">
            <strong>{task.title}</strong>
            <p>Duration: {task.duration} days</p>
            <p>
              Start: Day {task.earliestStart + 1}
              {" · "}
              Finish: Day {task.earliestFinish}
            </p>
            <p>
              Float: {task.totalFloat} days
            </p>
            <span className={`status-tag ${
              task.isCritical ? "critical" : ""
            }`}>
              {task.isCritical ? "Critical" : "Non-critical"}
            </span>
          </div>
        ))}
      </>
    )}
  </section>
)}

{riskProject && (
  <section className="panel page-panel">
    <div className="panel-heading">
      <div>
        <h3>Risk Management</h3>
        <p className="muted">{riskProject.name}</p>
      </div>
      <button
        className="secondary"
        onClick={() => setRiskProject(null)}
      >
        Back
      </button>
    </div>

    <h4>Add New Risk</h4>

    <form className="form-stack" onSubmit={saveRisk}>
      <label>
        Risk title
        <input
          required
          value={riskForm.title}
          onChange={e =>
            setRiskForm({ ...riskForm, title: e.target.value })
          }
          placeholder="e.g. Project delivery delay"
        />
      </label>

      <label>
        Description
        <textarea
          value={riskForm.description}
          onChange={e =>
            setRiskForm({ ...riskForm, description: e.target.value })
          }
        />
      </label>

      <div className="form-row">
        <label>
          Probability (1–5)
          <select
            value={riskForm.probability}
            onChange={e =>
              setRiskForm({ ...riskForm, probability: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
          </select>
        </label>

        <label>
          Impact (1–5)
          <select
            value={riskForm.impact}
            onChange={e =>
              setRiskForm({ ...riskForm, impact: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <label>
        Mitigation strategy
        <textarea
          value={riskForm.mitigation}
          onChange={e =>
            setRiskForm({ ...riskForm, mitigation: e.target.value })
          }
          placeholder="How will this risk be reduced?"
        />
      </label>

      <p>
        Risk score: <strong>{riskForm.probability * riskForm.impact}/25</strong>
      </p>

      <button className="primary">Add Risk</button>
    </form>

    <h4>Identified Risks ({risks.length})</h4>

    {risks.map(risk => {
      const score = risk.probability * risk.impact;
      const level = score >= 17 ? "Critical"
        : score >= 10 ? "High"
        : score >= 5 ? "Medium" : "Low";

      return (
        <article className="task-card" key={risk._id}>
          <strong>{risk.title}</strong>
          <p>{risk.description}</p>
          <p>Probability: {risk.probability}/5 · Impact: {risk.impact}/5</p>
          <p>Risk score: <strong>{score}/25 — {level}</strong></p>
          <p>Mitigation: {risk.mitigation || "Not specified"}</p>
          <select
            value={risk.status}
            onChange={async e => {
              await request(`/risks/${riskProject._id}/${risk._id}`, {
                method: "PATCH",
                token,
                body: { status: e.target.value }
              });
              await loadRisks(riskProject);
            }}
          >
            <option>Open</option>
            <option>Mitigating</option>
            <option>Resolved</option>
          </select>
          <button
            className="icon-button"
            onClick={async () => {
              if (confirm("Delete this risk?")) {
                await request(`/risks/${riskProject._id}/${risk._id}`, {
                  method: "DELETE",
                  token
                });
                await loadRisks(riskProject);
              }
            }}
          >
            <Trash2 size={15}/> Delete
          </button>
        </article>
      );
    })}

    {risks.length === 0 && <Empty text="No risks identified yet." />}
  </section>
)}


      {page === "team" && (
  <section className="panel page-panel">
    <div className="panel-heading">
      <div>
        <h3>Project Team</h3>
        <p className="muted">Manage your project members</p>
      </div>
    </div>

    <p>Select a project to manage its team members.</p>

    <select
      value={teamProject}
      onChange={e => {
  setTeamProject(e.target.value);
  loadTeamMembers(e.target.value);
}}
    >
      <option value="">Select a project</option>
      {projects.map(p => (
        <option key={p._id} value={p._id}>{p.name}</option>
      ))}
    </select>

{teamProject && (
  <>
    <form onSubmit={addTeamMember} className="form-stack">
      <label>
        Team member email
        <input
          type="email"
          required
          value={teamEmail}
          onChange={e => setTeamEmail(e.target.value)}
          placeholder="member@example.com"
        />
      </label>
      <button className="primary" type="submit">
        Add member
      </button>
    </form>

    <div className="team-list">
      <h4>Team members</h4>

      {teamMembers.length === 0 ? (
        <p className="muted">No team members added yet.</p>
      ) : (
        
teamMembers.map(member => (
  <div className="user-chip" key={member._id}>
    <div className="avatar">
      {member.name?.[0]?.toUpperCase()}
    </div>

    <div>
      <strong>{member.name}</strong>
      <small>{member.email} · {member.role}</small>
    </div>

    <button
      className="icon-button"
      onClick={() => removeTeamMember(member._id)}
    >
      Remove
    </button>
  </div>
))

      )}
    </div>
  </>
)}

  </section>
)}

      
{page === "tasks" && <section className="panel page-panel">
  <div className="panel-heading">
    <div>
      <h3>Task board</h3>
      <p className="muted">Track work across all projects</p>
    </div>
    <div className="inline-actions">
      <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
        <option value="all">All projects</option>
        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>
      <button className="primary" disabled={!projects.length}
        onClick={() => {
          setEditingTask(null);
          setTaskForm({ ...blankTask, project: projects[0]?._id || "" });
          setError("");
          setModal("task");
        }}>
        <Plus size={16}/> Add task
      </button>
    </div>
  </div>

  <div className="task-columns">
    {["To Do", "In Progress", "Done"].map(status => (
      <div className="task-column" key={status}>
        <div className="column-title">
          <span className={`status-dot ${statusClass(status)}`}></span>
          {status}
          <span className="count">{filteredTasks.filter(t => t.status === status).length}</span>
        </div>

        {filteredTasks.filter(t => t.status === status).map(task => (
          <div className="task-card" key={task._id}>
            <div className="task-card-top">
              <span className={`priority ${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
              <div>
                <button className="icon-button" title="Edit task"
                  onClick={() => {
                    setEditingTask(task);
                    setTaskForm({
                      title: task.title,
                      description: task.description || "",
                      project: task.project?._id || task.project || "",
                      priority: task.priority,
                      status: task.status,
                      assignee: task.assignee?._id || task.assignee || "",
                      dependencies: (task.dependencies || []).map(
  dependency =>
    dependency._id || dependency
),
                      dueDate: task.dueDate
                        ? new Date(task.dueDate).toISOString().slice(0, 10)
                        : ""
                    });
                    loadTaskMembers(task.project?._id || task.project);
                    setError("");
                    setModal("task");
                  }}>
                  Edit
                </button>
                <button className="icon-button" title="Delete task"
                  onClick={async () => {
                    if (confirm("Delete this task?")) {
                      await request(`/tasks/${task._id}`, { method: "DELETE", token });
                      await loadData();
                    }
                  }}>
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>

            <strong>{task.title}</strong>
            <p className="muted">
  Assigned to: {task.assignee?.name || "Unassigned"}
</p>
            <p>{task.project?.name}</p>
{task.dependencies?.length > 0 && (
  <div className="dependency-list">
    <small>Depends on:</small>
    {task.dependencies.map(dependency => (
      <div key={dependency._id}>
        {dependency.title}
        <span> · {dependency.status}</span>
      </div>
    ))}
  </div>
)}
            <small><CalendarDays size={13}/> {dateText(task.dueDate)}</small>
            <select value={task.status}
              onChange={e => updateTask(task._id, { status: e.target.value })}>
              <option>To Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
        ))}

        {!filteredTasks.some(t => t.status === status) &&
          <p className="empty-column">No tasks here</p>}
      </div>
    ))}
  </div>
</section>}


      {modal && <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setModal(""); }}><section className="modal"><div className="modal-heading"><div><p className="eyebrow">PROJECTIQ WORKSPACE</p><h3>
  {modal === "project"
    ? "Create a project"
    : editingTask
      ? "Edit task"
      : "Create a task"}
</h3></div><button className="icon-button" onClick={() => setModal("")}><X/></button></div>
        <form className="form-stack" onSubmit={modal === "project" ? saveProject : saveTask}>
          {modal === "project" ? <>
            <label>Project name<input required maxLength="120" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Customer Portal Revamp"/></label>
            <label>Description<textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What is this project about?"/></label>
            <div className="form-row"><label>Priority<select value={projectForm.priority} onChange={e => setProjectForm({ ...projectForm, priority: e.target.value })}>{["Low","Medium","High","Critical"].map(x => <option key={x}>{x}</option>)}</select></label><label>Status<select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>{["Planning","Active","On Hold","Completed"].map(x => <option key={x}>{x}</option>)}</select></label></div>
            <label>Due date<input type="date" value={projectForm.dueDate} onChange={e => setProjectForm({ ...projectForm, dueDate: e.target.value })}/></label>
            <label>
  Estimated duration (days)
  <input
    type="number"
    min="1"
    value={taskForm.estimatedDuration}
    onChange={e =>
      setTaskForm({
        ...taskForm,
        estimatedDuration: Number(e.target.value)
      })
    }
    required
  />
</label>
          </> : <>
            <label>Task title<input required maxLength="160" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Create user stories"/></label>
            <label>Description<textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}/></label>
            <label>Project<select required value={taskForm.project} onChange={e => {
  const projectId = e.target.value;
  setTaskForm({ ...taskForm, project: projectId, assignee: "" });
  loadTaskMembers(projectId);
}}><option value="">Select a project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label>

<label>
  Assign to
  <select
    value={taskForm.assignee || ""}
    onChange={e =>
      setTaskForm({ ...taskForm, assignee: e.target.value })
    }
  >
    <option value="">Unassigned</option>
    {taskMembers.map(member => (
      <option key={member._id} value={member._id}>
        {member.name} ({member.email})
      </option>
    ))}
  </select>
</label>

<label>
  Depends on
  <select
    multiple
    value={taskForm.dependencies || []}
    onChange={e =>
      setTaskForm({
        ...taskForm,
        dependencies: Array.from(
          e.target.selectedOptions,
          option => option.value
        )
      })
    }
  >
    {tasks
      .filter(t =>
        (t.project?._id || t.project) === taskForm.project &&
        t._id !== editingTask?._id
      )
      .map(task => (
        <option key={task._id} value={task._id}>
          {task.title}
        </option>
      ))}
  </select>
  <small className="muted">
    Hold Ctrl (Windows) to select multiple tasks.
  </small>
</label>


            <div className="form-row"><label>Priority<select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>{["Low","Medium","High","Critical"].map(x => <option key={x}>{x}</option>)}</select></label><label>Status<select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>{["To Do","In Progress","Done"].map(x => <option key={x}>{x}</option>)}</select></label></div>
            <label>Due date<input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}/></label>
          </>}
          {error && <p className="error">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary" onClick={() => setModal("")}>Cancel</button><button className="primary" disabled={busy}>{busy
  ? "Saving..."
  : modal === "project"
    ? "Create project"
    : editingTask
      ? "Save changes"
      : "Create task"}</button></div>
        </form>
      </section></div>}
      <footer className="footer">ProjectIQ · Intelligent Project Planning & Execution </footer>
    </main>
  </div>;
}

function Stat({ icon, label, value, note }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong>{value}</strong><small>{note}</small></div>;
}
function ProjectRow({ project, onDelete }) {
  return <div className="project-row"><div className="project-symbol"><FolderKanban size={18}/></div><div className="project-info"><strong>{project.name}</strong><small>{project.taskCount} tasks · {project.status}</small><div className="progress-track"><div style={{ width: `${project.progress}%` }}/></div></div><span className="progress-label">{project.progress}%</span><button className="icon-button" onClick={() => onDelete(project._id)} title="Delete project"><Trash2 size={15}/></button></div>;
}
function ProjectCard({ project, onDelete, onCriticalPath, onRisks }) {
  return <article className="project-card"><div className="project-card-head"><div className="project-symbol"><FolderKanban size={19}/></div><button className="icon-button" onClick={() => onDelete(project._id)}><Trash2 size={15}/></button></div><h4>{project.name}</h4><p>{project.description || "No description provided."}</p><div className="tag-row"><span className={`status-tag ${project.status.toLowerCase().replaceAll(" ","-")}`}>{project.status}</span><span className={`priority ${project.priority.toLowerCase()}`}>{project.priority}</span></div><div className="card-progress"><div className="progress-meta"><span>Progress</span><strong>{project.progress}%</strong></div><div className="progress-track"><div style={{ width: `${project.progress}%` }}/></div></div><small className="muted"><CalendarDays size={13}/> Due {dateText(project.dueDate)}</small><button
  className="secondary"
  onClick={() => onCriticalPath(project)}
>
  View Critical Path
</button>
<button
  className="secondary"
  onClick={() => onRisks(project)}
>
  Manage Risks
</button></article>;
}
function Empty({ text }) { return <div className="empty-state"><div className="empty-illustration"><FolderKanban size={25}/></div><p>{text}</p></div>; }
function statusClass(status) { return status === "Done" ? "done" : status === "In Progress" ? "progress" : "todo"; }
