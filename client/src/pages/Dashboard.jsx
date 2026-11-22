import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
  Pencil,
  Save,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { Brand, BrandMark } from "../components/Brand";

const categoryOptions = ["Coding", "Writing", "Research", "Study", "Other"];

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [activeSection, setActiveSection] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function initialize() {
      try {
        const session = await apiRequest("/auth/me");
        setUser(session.user);
        const records = await apiRequest("/api/capsules");
        setCapsules(Array.isArray(records) ? records : []);
      } catch (err) {
        if (err.status === 401 || err.message.includes("Unauthorized")) {
          navigate("/login", { replace: true });
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [navigate]);

  const categories = useMemo(() => {
    const found = capsules.map((capsule) => capsule.category).filter(Boolean);
    return [...new Set([...categoryOptions, ...found])].sort((a, b) => a.localeCompare(b));
  }, [capsules]);

  const filteredCapsules = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = capsules.filter((capsule) => {
      const matchesSearch = [
        capsule.prompt_title,
        capsule.project_name,
        capsule.prompt_text,
        capsule.response_summary,
        capsule.category,
      ].some((value) => (value || "").toLowerCase().includes(query));
      return matchesSearch && (filter === "All" || capsule.category === filter);
    });

    return matches.sort((a, b) => {
      if (sort === "title") return (a.prompt_title || "").localeCompare(b.prompt_title || "");
      if (sort === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [capsules, filter, search, sort]);

  const recentCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return capsules.filter((capsule) => {
      const createdAt = new Date(capsule.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= weekAgo;
    }).length;
  }, [capsules]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "Coding",
      usefulness: capsule.usefulness || "Good",
      reviewed: Boolean(capsule.reviewed),
      improved: Boolean(capsule.improved),
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });
    setError("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = editingId ? `/api/capsules/${editingId}` : "/api/capsules";
      const result = await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      const savedCapsule = result.capsule;

      if (editingId) {
        setCapsules((previous) => previous.map((capsule) =>
          capsule.id === editingId ? savedCapsule : capsule
        ));
        notify("Prompt updated.");
      } else {
        setCapsules((previous) => [savedCapsule, ...previous]);
        notify("Prompt saved to your capsule.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this prompt permanently?")) return;

    try {
      await apiRequest(`/api/capsules/${id}`, { method: "DELETE" });
      setCapsules((previous) => previous.filter((capsule) => capsule.id !== id));
      notify("Prompt deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCopy(capsule) {
    try {
      await navigator.clipboard.writeText(capsule.prompt_text || "");
      setCopiedId(capsule.id);
      notify("Prompt copied to clipboard.");
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Clipboard access isn’t available in this browser.");
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  function jumpTo(section) {
    setActiveSection(section);
    const target = document.getElementById(section === "categories" ? "categories" : section === "prompts" ? "library" : "overview");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (section === "categories") document.getElementById("category-filter")?.focus();
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <span className="loading-mark"><BrandMark large /></span>
        <span>Opening your capsule…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-loading dashboard-loading-error" role="alert">
        <span className="loading-mark"><BrandMark large /></span>
        <span>{error || "Your session is unavailable."}</span>
        <button className="button button-secondary" onClick={() => navigate("/login")}>
          Return to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-app">
      <aside className="dashboard-sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-dot" />
          PERSONAL WORKSPACE
        </div>

        <nav className="sidebar-menu" aria-label="Dashboard sections">
          <button
            type="button"
            className={`sidebar-link${activeSection === "overview" ? " active" : ""}`}
            onClick={() => jumpTo("overview")}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button
            type="button"
            className={`sidebar-link${activeSection === "prompts" ? " active" : ""}`}
            onClick={() => jumpTo("prompts")}
          >
            <BookOpen size={18} /> My prompts
            <span className="sidebar-count">{capsules.length}</span>
          </button>
          <button
            type="button"
            className={`sidebar-link${activeSection === "categories" ? " active" : ""}`}
            onClick={() => jumpTo("categories")}
          >
            <Tags size={18} /> Categories
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><BookOpen size={15} /></span>
            <p>Your next great prompt is only a search away.</p>
          </div>
          <div className="sidebar-profile">
            <span className="user-avatar" aria-hidden="true">
              {(user.username || "U").charAt(0).toUpperCase()}
            </span>
            <span className="profile-copy">
              <strong>{user.username}</strong>
              <small>GitHub account</small>
            </span>
            <button className="logout-button" onClick={handleLogout} aria-label="Sign out" title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="dashboard-header" id="overview">
            <div>
              <p className="dashboard-eyebrow">YOUR SPACE, AT A GLANCE</p>
              <h1>Welcome back, <span>{user.username}</span><span className="heading-period">.</span></h1>
              <p className="dashboard-subtitle">A little inspiration, neatly kept.</p>
            </div>
            <button className="button button-primary add-prompt-button" onClick={openCreate}>
              <Plus size={18} /> Add a prompt
            </button>
          </header>

          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <div className="notice-region" aria-live="polite" aria-atomic="true">
            {notice && <div className="toast-notice"><Check size={16} /> {notice}</div>}
          </div>

          <section className="stats-grid" aria-label="Prompt library statistics">
            <article className="stat-card stat-card-primary">
              <div className="stat-topline"><span>Total prompts</span><span className="stat-icon stat-icon-violet"><BookOpen size={17} /></span></div>
              <strong>{capsules.length}</strong>
              <small>Saved in your library</small>
            </article>
            <article className="stat-card">
              <div className="stat-topline"><span>Categories</span><span className="stat-icon stat-icon-blue"><FolderOpen size={17} /></span></div>
              <strong>{new Set(capsules.map((capsule) => capsule.category).filter(Boolean)).size}</strong>
              <small>Ways you organise ideas</small>
            </article>
            <article className="stat-card">
              <div className="stat-topline"><span>Recently added</span><span className="stat-icon stat-icon-coral"><CalendarDays size={17} /></span></div>
              <strong>{recentCount}</strong>
              <small>In the last 7 days</small>
            </article>
          </section>

          <section className="library-section" id="library" aria-labelledby="library-title">
            <div className="library-heading">
              <div>
                <p className="dashboard-eyebrow">THE GOOD STUFF</p>
                <h2 id="library-title">My prompt library</h2>
                <p className="library-description">Your useful ideas, ready for another round.</p>
              </div>
              <span className="result-count">{filteredCapsules.length} {filteredCapsules.length === 1 ? "prompt" : "prompts"}</span>
            </div>

            <div className="library-toolbar" id="categories">
              <label className="search-box">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">Search prompts</span>
                <input
                  type="search"
                  placeholder="Find a prompt, project, or idea…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
              </label>
              <label className="select-wrap">
                <Tags size={16} aria-hidden="true" />
                <span className="sr-only">Filter by category</span>
                <select id="category-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="All">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="select-wrap sort-wrap">
                <ArrowDownUp size={16} aria-hidden="true" />
                <span className="sr-only">Sort prompts</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              {(search || filter !== "All" || sort !== "newest") && (
                <button type="button" className="clear-filters" onClick={() => { setSearch(""); setFilter("All"); setSort("newest"); }}>
                  Clear filters
                </button>
              )}
            </div>

            {filteredCapsules.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><BookOpen size={25} /></div>
                <p className="section-kicker">A fresh page</p>
                {capsules.length > 0 && <h3>No prompts found.</h3>}
                <p>{capsules.length === 0
                  ? "Start saving your favourite prompts and build your personal AI library."
                  : "Try a different search or clear the filters to see your library."}</p>
                {capsules.length === 0 ? (
                  <button className="button button-primary add-prompt-button" onClick={openCreate}><Plus size={17} /> Create your first prompt</button>
                ) : (
                  <button className="button button-secondary" onClick={() => { setSearch(""); setFilter("All"); }}>Clear filters</button>
                )}
              </div>
            ) : (
              <div className="capsule-grid">
                {filteredCapsules.map((capsule) => (
                  <article className="capsule-card" key={capsule.id}>
                    <div className="capsule-card-top">
                      <span className={`category-badge category-${(capsule.category || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                        <span className="badge-dot" /> {capsule.category || "Other"}
                      </span>
                      <span className="capsule-date">{formatDate(capsule.created_at)}</span>
                    </div>
                    <h3>{capsule.prompt_title}</h3>
                    <p className="capsule-project">{capsule.project_name}</p>
                    <p className="capsule-preview">{capsule.prompt_text}</p>
                    {capsule.response_summary && (
                      <p className="capsule-summary"><span>Response note</span>{capsule.response_summary}</p>
                    )}
                    <div className="capsule-meta">
                      {capsule.prompt_version && <span>{capsule.prompt_version}</span>}
                      {capsule.usefulness && <span>{capsule.usefulness}</span>}
                      {capsule.reviewed && <span className="meta-positive"><Check size={12} /> Reviewed</span>}
                      {capsule.improved && <span className="meta-improved"><Check size={12} /> Improved</span>}
                    </div>
                    <div className="capsule-actions">
                      <button type="button" className="copy-button" onClick={() => handleCopy(capsule)}>
                        {copiedId === capsule.id ? <Check size={15} /> : <Copy size={15} />}
                        {copiedId === capsule.id ? "Copied" : "Copy prompt"}
                      </button>
                      <div className="card-icon-actions">
                        <button type="button" onClick={() => openEdit(capsule)} aria-label={`Edit ${capsule.prompt_title}`} title="Edit prompt"><Pencil size={16} /></button>
                        <button type="button" className="delete-action" onClick={() => handleDelete(capsule.id)} aria-label={`Delete ${capsule.prompt_title}`} title="Delete prompt"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="dashboard-footer">
            <span><BookOpen size={14} /> A little more room for good ideas.</span>
            <span>AI Capsule</span>
          </footer>
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop">
          <section className="prompt-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
            <div className="modal-header">
              <div>
                <p className="dashboard-eyebrow">YOUR PROMPT LIBRARY</p>
                <h2 id="prompt-modal-title">{editingId ? "Refine your prompt" : "Save a new prompt"}</h2>
                <p>Keep the context that makes this idea useful.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowForm(false)} aria-label="Close prompt form"><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmit} className="prompt-form">
              <div className="form-row">
                <label>
                  <span className="field-label">Project name <span className="required-mark">*</span></span>
                  <input name="project_name" value={form.project_name} onChange={updateField} required maxLength={120} placeholder="e.g. Portfolio refresh" />
                </label>
                <label>
                  Version
                  <input name="prompt_version" value={form.prompt_version} onChange={updateField} maxLength={40} placeholder="v1" />
                </label>
              </div>
              <label>
                <span className="field-label">Prompt title <span className="required-mark">*</span></span>
                <input name="prompt_title" value={form.prompt_title} onChange={updateField} required maxLength={160} placeholder="Give this prompt a clear name" />
              </label>
              <label>
                <span className="field-label">Prompt text <span className="required-mark">*</span></span>
                <textarea name="prompt_text" value={form.prompt_text} onChange={updateField} required rows={5} placeholder="Write or paste the prompt you want to keep…" />
              </label>
              <label>
                Response summary
                <textarea name="response_summary" value={form.response_summary} onChange={updateField} rows={2} placeholder="What did it help you create?" />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select name="category" value={form.category} onChange={updateField}>
                    {[...new Set([...categoryOptions, ...categories])].map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Usefulness
                  <select name="usefulness" value={form.usefulness} onChange={updateField}>
                    <option>Good</option>
                    <option>Needs Improvement</option>
                  </select>
                </label>
              </div>
              <div className="form-checks">
                <label className="check-option">
                  <input type="checkbox" name="reviewed" checked={form.reviewed} onChange={updateField} />
                  <span className="custom-check"><Check size={12} /></span> Response reviewed
                </label>
                <label className="check-option">
                  <input type="checkbox" name="improved" checked={form.improved} onChange={updateField} />
                  <span className="custom-check"><Check size={12} /></span> Output improved
                </label>
              </div>
              <label>
                Screenshot evidence URL
                <input type="url" name="screenshot_url" value={form.screenshot_url} onChange={updateField} placeholder="https://…" />
              </label>
              <label>
                Notes
                <textarea name="notes" value={form.notes} onChange={updateField} rows={2} placeholder="Anything you want to remember" />
              </label>

              {error && <p className="dashboard-error" role="alert">{error}</p>}

              <div className="modal-actions">
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? <span className="button-spinner" aria-hidden="true" /> : <Save size={16} />}
                  {saving ? "Saving…" : editingId ? "Save changes" : "Save prompt"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
